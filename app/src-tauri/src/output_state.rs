//! Authoritative program (on-air) state for output windows.
//!
//! The Studio window *sends* snapshots here; Rust keeps the latest one and broadcasts it to
//! every window. Output windows fetch the snapshot when they load, so they recover after a
//! reload and keep showing the last state if the Studio window crashes, freezes or closes.
//! See docs/adr/0001-output-state-in-rust.md.
//!
//! Versions are assigned here from a process-wide monotonic counter (never the wall clock), so
//! ordering is correct across Studio reloads and clock changes.

use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Mutex;

use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::{AppHandle, Emitter, State};

pub const OUTPUT_EVENT: &str = "output://state";
pub const ACK_EVENT: &str = "output://ack";
pub const PROBE_EVENT: &str = "output://probe";

/// What an output window reports after rendering a snapshot (health + self-test evidence).
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct OutputAck {
    pub role: String,
    pub version: u64,
    /// Text actually present in the rendered slide layer (None when the slide layer is empty).
    pub rendered: Option<String>,
}

#[derive(Default)]
pub struct OutputStore {
    latest: Mutex<Option<Value>>,
    seq: AtomicU64,
    acks: Mutex<HashMap<String, OutputAck>>,
}

/// Overwrites `version` with the next value of the monotonic sequence.
pub fn stamp(seq: &AtomicU64, mut state: Value) -> Result<Value, String> {
    let obj = state.as_object_mut().ok_or("output state must be an object")?;
    let v = seq.fetch_add(1, Ordering::SeqCst) + 1;
    obj.insert("version".into(), Value::from(v));
    Ok(state)
}

#[tauri::command]
pub fn output_set_state(app: AppHandle, store: State<'_, OutputStore>, state: Value) -> Result<u64, String> {
    let stamped = stamp(&store.seq, state)?;
    let version = stamped.get("version").and_then(Value::as_u64).unwrap_or(0);
    {
        let mut guard = store.latest.lock().map_err(|_| "output state lock poisoned".to_string())?;
        *guard = Some(stamped.clone());
    }
    app.emit(OUTPUT_EVENT, stamped).map_err(|e| e.to_string())?;
    Ok(version)
}

#[tauri::command]
pub fn output_get_state(store: State<'_, OutputStore>) -> Result<Option<Value>, String> {
    let guard = store.latest.lock().map_err(|_| "output state lock poisoned".to_string())?;
    Ok(guard.clone())
}

/// Called by output windows after they render a snapshot (and in reply to a probe).
#[tauri::command]
pub fn output_ack(app: AppHandle, store: State<'_, OutputStore>, ack: OutputAck) -> Result<(), String> {
    {
        let mut acks = store.acks.lock().map_err(|_| "ack lock poisoned".to_string())?;
        acks.insert(ack.role.clone(), ack.clone());
    }
    crate::selftest::on_ack(&app, &ack);
    app.emit(ACK_EVENT, ack).map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn versions_are_monotonic_and_ignore_client_values() {
        let seq = AtomicU64::new(0);
        // A client sending a huge wall-clock version, then a small one after a reload.
        let a = stamp(&seq, json!({ "version": 1_763_000_000_000u64 })).expect("object");
        let b = stamp(&seq, json!({ "version": 0 })).expect("object");
        let c = stamp(&seq, json!({})).expect("object");
        assert_eq!(a["version"], 1);
        assert_eq!(b["version"], 2);
        assert_eq!(c["version"], 3);
    }

    #[test]
    fn rejects_non_objects() {
        let seq = AtomicU64::new(0);
        assert!(stamp(&seq, json!([1, 2])).is_err());
        assert_eq!(seq.load(Ordering::SeqCst), 0);
    }
}

//! Authoritative program (on-air) state for output windows.
//!
//! The Studio window *sends* snapshots here; Rust keeps the latest one and broadcasts it to
//! every window. Output windows fetch the snapshot when they load, so they recover after a
//! reload and keep showing the last state if the Studio window crashes, freezes or closes.
//! See docs/adr/0001-output-state-in-rust.md.

use std::sync::Mutex;

use serde_json::Value;
use tauri::{AppHandle, Emitter, State};

pub const OUTPUT_EVENT: &str = "output://state";

#[derive(Default)]
pub struct OutputStore {
    latest: Mutex<Option<Value>>,
}

#[tauri::command]
pub fn output_set_state(app: AppHandle, store: State<'_, OutputStore>, state: Value) -> Result<(), String> {
    if !state.is_object() {
        return Err("output state must be an object".into());
    }
    {
        let mut guard = store.latest.lock().map_err(|_| "output state lock poisoned".to_string())?;
        *guard = Some(state.clone());
    }
    app.emit(OUTPUT_EVENT, state).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn output_get_state(store: State<'_, OutputStore>) -> Result<Option<Value>, String> {
    let guard = store.latest.lock().map_err(|_| "output state lock poisoned".to_string())?;
    Ok(guard.clone())
}

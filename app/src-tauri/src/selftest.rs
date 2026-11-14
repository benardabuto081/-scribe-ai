//! End-to-end startup self-check, enabled with `SCRIBE_SELFTEST=1`.
//!
//! The Studio drives the real app (open Audience → load song → next slide) and the output window
//! acknowledges what it actually rendered. Finally Rust closes the Studio, probes the outputs, and
//! checks the Audience still shows the slide (acceptance criterion 5). Results print to stdout as
//! `[selftest] ...` lines and the process exits 0 (PASS) or 1 (FAIL).

use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;

use tauri::{AppHandle, Emitter, Manager};

use crate::output_state::{OutputAck, PROBE_EVENT};

static PROBING: AtomicBool = AtomicBool::new(false);

pub fn enabled() -> bool {
    std::env::var("SCRIBE_SELFTEST").map(|v| v == "1").unwrap_or(false)
}

#[tauri::command]
pub fn selftest_enabled() -> bool {
    enabled()
}

#[tauri::command]
pub async fn selftest_report(line: String) {
    println!("[selftest] {line}");
}

#[tauri::command]
pub async fn selftest_fail(app: AppHandle, reason: String) {
    println!("[selftest] FAIL: {reason}");
    println!("[selftest] RESULT FAIL");
    app.exit(1);
}

/// Final phase: close the Studio, wait, then ask outputs to re-acknowledge what they show.
#[tauri::command]
pub async fn selftest_close_studio_and_probe(app: AppHandle) -> Result<(), String> {
    if !enabled() {
        return Err("self-test not enabled".into());
    }
    if let Some(studio) = app.get_webview_window("studio") {
        studio.close().map_err(|e| e.to_string())?;
    }
    println!("[selftest] studio window closed; probing outputs in 1.5 s");
    let handle = app.clone();
    std::thread::spawn(move || {
        std::thread::sleep(Duration::from_millis(1500));
        PROBING.store(true, Ordering::SeqCst);
        if let Err(e) = handle.emit(PROBE_EVENT, ()) {
            println!("[selftest] FAIL: probe emit failed: {e}");
            handle.exit(1);
            return;
        }
        std::thread::sleep(Duration::from_secs(5));
        if PROBING.load(Ordering::SeqCst) {
            println!("[selftest] FAIL: audience did not answer the probe after the studio closed");
            println!("[selftest] RESULT FAIL");
            handle.exit(1);
        }
    });
    Ok(())
}

pub fn on_ack(app: &AppHandle, ack: &OutputAck) {
    if !enabled() {
        return;
    }
    println!(
        "[selftest] ack role={} version={} rendered={:?}",
        ack.role, ack.version, ack.rendered
    );
    if ack.role == "audience" && PROBING.swap(false, Ordering::SeqCst) {
        let ok = ack.rendered.as_deref().is_some_and(|t| t.contains("Amazing grace"));
        if ok {
            println!("[selftest] PASS: audience still shows the slide with the studio closed");
            println!("[selftest] RESULT PASS");
            app.exit(0);
        } else {
            println!("[selftest] FAIL: audience lost the slide after the studio closed");
            println!("[selftest] RESULT FAIL");
            app.exit(1);
        }
    }
}

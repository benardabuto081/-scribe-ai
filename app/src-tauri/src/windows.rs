//! Display detection and output window lifecycle (Audience, Stage).
//!
//! Output windows are created with their own WebView2 data directory. On Windows that gives
//! them a separate browser process from the Studio, so a hung Studio renderer cannot freeze
//! the audience screen.

use std::path::PathBuf;
use std::time::{Duration, Instant};

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager, PhysicalPosition, WebviewUrl, WebviewWindow, WebviewWindowBuilder};

use crate::selftest;

pub const WINDOW_EVENT: &str = "output://window";

#[derive(Serialize, Clone)]
pub struct WindowStatus {
    pub role: String,
    pub open: bool,
}

const ROLES: [&str; 2] = ["audience", "stage"];

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MonitorInfo {
    name: String,
    width: u32,
    height: u32,
    x: i32,
    y: i32,
    scale: f64,
    primary: bool,
}

fn label_for(role: &str) -> Result<String, String> {
    if ROLES.contains(&role) {
        Ok(format!("output-{role}"))
    } else {
        Err(format!("unknown output role: {role}"))
    }
}

fn monitor_name(m: &tauri::Monitor, index: usize) -> String {
    m.name().cloned().unwrap_or_else(|| format!("Display {}", index + 1))
}

#[tauri::command]
pub async fn list_monitors(app: AppHandle) -> Result<Vec<MonitorInfo>, String> {
    let primary = app
        .primary_monitor()
        .map_err(|e| e.to_string())?
        .and_then(|m| m.name().cloned());
    let monitors = app.available_monitors().map_err(|e| e.to_string())?;
    Ok(monitors
        .iter()
        .enumerate()
        .map(|(i, m)| {
            let name = monitor_name(m, i);
            MonitorInfo {
                primary: primary.as_deref() == Some(name.as_str()),
                name,
                width: m.size().width,
                height: m.size().height,
                x: m.position().x,
                y: m.position().y,
                scale: m.scale_factor(),
            }
        })
        .collect())
}

/// Opens (or moves) an output window. With a monitor it goes borderless fullscreen on that
/// display; without one it opens as a resizable preview window on the current display.
///
/// Must be `async`: on Windows, building a webview window inside a synchronous command blocks
/// the main thread waiting for WebView2, which never completes (Tauri docs; this was the cause of
/// the "Open does nothing" bug). Async commands run off the main thread.
#[tauri::command]
pub async fn output_open(app: AppHandle, role: String, monitor: Option<String>) -> Result<(), String> {
    let label = label_for(&role)?;

    let target = match &monitor {
        Some(name) => {
            let monitors = app.available_monitors().map_err(|e| e.to_string())?;
            monitors
                .into_iter()
                .enumerate()
                .find(|(i, m)| &monitor_name(m, *i) == name)
                .map(|(_, m)| m)
        }
        None => None,
    };

    let t0 = Instant::now();
    let window = match app.get_webview_window(&label) {
        Some(w) => w,
        // Normally pre-created at startup; recreate if it was destroyed.
        None => create_output_window(&app, &role)?,
    };

    match target {
        Some(m) => {
            window.set_decorations(false).map_err(|e| e.to_string())?;
            window
                .set_position(PhysicalPosition::new(m.position().x, m.position().y))
                .map_err(|e| e.to_string())?;
            window.set_fullscreen(true).map_err(|e| e.to_string())?;
        }
        None => {
            window.set_fullscreen(false).map_err(|e| e.to_string())?;
            window.set_decorations(true).map_err(|e| e.to_string())?;
        }
    }
    window.show().map_err(|e| e.to_string())?;
    selftest::log(format!("output_open({role}) shown in {} ms", t0.elapsed().as_millis()));
    app.emit(WINDOW_EVENT, WindowStatus { role, open: true })
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn output_close(app: AppHandle, role: String) -> Result<(), String> {
    let label = label_for(&role)?;
    if let Some(w) = app.get_webview_window(&label) {
        // Hide, never destroy: the window stays pre-created and keeps its state subscription.
        w.set_fullscreen(false).map_err(|e| e.to_string())?;
        w.hide().map_err(|e| e.to_string())?;
    }
    app.emit(WINDOW_EVENT, WindowStatus { role, open: false })
        .map_err(|e| e.to_string())
}

/// Where output webviews keep their (separate) WebView2 profile. Isolated in self-test mode.
pub fn output_data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    match selftest::profile_dir() {
        Some(p) => Ok(p.join("webview-outputs")),
        None => Ok(app.path().app_local_data_dir().map_err(|e| e.to_string())?.join("webview-outputs")),
    }
}

/// Builds a hidden output window. Its own WebView2 data directory = its own browser process
/// (ADR 0001). It loads immediately and subscribes to program state, so showing it is instant.
pub fn create_output_window(app: &AppHandle, role: &str) -> Result<WebviewWindow, String> {
    let label = label_for(role)?;
    let title = format!("Scribe AI — {}", if role == "audience" { "Audience" } else { "Stage" });
    WebviewWindowBuilder::new(app, &label, WebviewUrl::App("index.html".into()))
        .title(title)
        .inner_size(960.0, 540.0)
        .min_inner_size(320.0, 180.0)
        .background_color(tauri::window::Color(0, 0, 0, 255))
        .data_directory(output_data_dir(app)?)
        .focused(false)
        .visible(false)
        .build()
        .map_err(|e| e.to_string())
}

/// Pre-creates hidden Audience and Stage windows shortly after startup (off the main thread, so
/// the Studio appears first). "Open" then only positions and shows them.
pub fn precreate_outputs(app: AppHandle) {
    std::thread::spawn(move || {
        std::thread::sleep(Duration::from_millis(800));
        for role in ROLES {
            let label = format!("output-{role}");
            if app.get_webview_window(&label).is_some() {
                continue;
            }
            let t0 = Instant::now();
            match create_output_window(&app, role) {
                Ok(_) => selftest::log(format!("pre-created {label} (hidden) in {} ms", t0.elapsed().as_millis())),
                Err(e) => eprintln!("could not pre-create {label}: {e}"),
            }
        }
    });
}

/// Recreates the Studio window if it was closed while outputs kept running.
/// Async for the same reason as `output_open` (creates a webview window).
#[tauri::command]
pub async fn studio_reopen(app: AppHandle) -> Result<(), String> {
    if let Some(w) = app.get_webview_window("studio") {
        w.show().map_err(|e| e.to_string())?;
        return w.set_focus().map_err(|e| e.to_string());
    }
    let studio = crate::studio_window::build_studio(&app)?;
    crate::studio_window::fit_to_work_area(&studio)
}

#[tauri::command]
pub fn app_quit(app: AppHandle) {
    app.exit(0);
}

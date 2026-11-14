use tauri::{Emitter, Manager, WindowEvent};

mod output_state;
mod selftest;
mod studio_window;
mod windows;

fn emit_output_closed(window: &tauri::Window, role: &str) {
    let status = windows::WindowStatus { role: role.to_string(), open: false };
    if let Err(e) = window.app_handle().emit(windows::WINDOW_EVENT, status) {
        eprintln!("failed to emit output window status: {e}");
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let result = tauri::Builder::default()
        .manage(output_state::OutputStore::default())
        .setup(|app| {
            // The Studio is created here (tauri.conf.json has `create: false`) so self-test runs
            // can give it an isolated profile. Fitted to the monitor work area, then shown.
            let studio = studio_window::build_studio(app.handle())?;
            if let Err(e) = studio_window::fit_to_work_area(&studio) {
                eprintln!("could not fit studio window: {e}");
                if let Err(e) = studio.show() {
                    eprintln!("could not show studio window: {e}");
                }
            }
            // Hidden Audience/Stage windows, ready before the operator presses Open.
            windows::precreate_outputs(app.handle().clone());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            output_state::output_set_state,
            output_state::output_get_state,
            output_state::output_ack,
            studio_window::studio_window_fit,
            selftest::selftest_enabled,
            selftest::selftest_profile,
            selftest::selftest_report,
            selftest::selftest_fail,
            selftest::selftest_close_studio_and_probe,
            windows::list_monitors,
            windows::output_open,
            windows::output_close,
            windows::studio_reopen,
            windows::app_quit,
        ])
        .on_window_event(|window, event| {
            let label = window.label().to_string();
            if let Some(role) = label.strip_prefix("output-") {
                match event {
                    // Closing an output hides it: it stays pre-created and subscribed to state.
                    WindowEvent::CloseRequested { api, .. } => {
                        api.prevent_close();
                        if let Err(e) = window.hide() {
                            eprintln!("could not hide {label}: {e}");
                        }
                        emit_output_closed(window, role);
                    }
                    WindowEvent::Destroyed => emit_output_closed(window, role),
                    _ => {}
                }
                return;
            }
            if label == "studio" {
                if selftest::enabled() {
                    // Diagnostics for unexpected minimize/restore during self-test runs.
                    if let WindowEvent::Resized(size) = event {
                        let minimized = window.is_minimized().unwrap_or(false);
                        selftest::log(format!(
                            "studio window resized to {}x{} (minimized={minimized})",
                            size.width, size.height
                        ));
                    }
                }
                if let WindowEvent::Destroyed = event {
                    // Outputs keep running while visible (ADR 0001). If none is visible, the hidden
                    // pre-created windows must not keep an invisible app alive.
                    let any_visible = window
                        .app_handle()
                        .webview_windows()
                        .values()
                        .any(|w| w.label().starts_with("output-") && w.is_visible().unwrap_or(false));
                    if !any_visible {
                        window.app_handle().exit(0);
                    }
                }
            }
        })
        .run(tauri::generate_context!());
    if let Err(e) = result {
        eprintln!("Scribe AI failed to start: {e}");
    }
}

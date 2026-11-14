use tauri::{Emitter, Manager};

mod output_state;
mod selftest;
mod windows;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let result = tauri::Builder::default()
        .manage(output_state::OutputStore::default())
        .invoke_handler(tauri::generate_handler![
            output_state::output_set_state,
            output_state::output_get_state,
            output_state::output_ack,
            selftest::selftest_enabled,
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
            if let tauri::WindowEvent::Destroyed = event {
                if let Some(role) = window.label().strip_prefix("output-") {
                    let status = windows::WindowStatus { role: role.to_string(), open: false };
                    if let Err(e) = window.app_handle().emit(windows::WINDOW_EVENT, status) {
                        eprintln!("failed to emit output window status: {e}");
                    }
                }
            }
        })
        // Closing the Studio does not close outputs: the app keeps running while any window is
        // open (Tauri default), and output windows keep rendering the last snapshot.
        .run(tauri::generate_context!());
    if let Err(e) = result {
        eprintln!("Scribe AI failed to start: {e}");
    }
}

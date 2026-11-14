//! Studio window sizing from the real monitor work area (taskbar excluded), DPI-aware.
//!
//! Policy:
//!  - Small work areas (under 1366 × 800 logical, e.g. 1920×1080 at 150 % = 1280 × ~688): maximize,
//!    so the whole Studio including clock and bottom strip is visible.
//!  - Larger screens: 90 % of the work area, capped at 1680 × 1050 logical, centered.
//!  - Minimum size never exceeds the work area.
//!
//! The window starts hidden (tauri.conf.json) and is shown only after it has been fitted.

use serde::Serialize;
use tauri::{LogicalSize, Monitor, PhysicalPosition, PhysicalSize, WebviewWindow};

const SMALL_W: f64 = 1366.0;
const SMALL_H: f64 = 800.0;
const MAX_W: f64 = 1680.0;
const MAX_H: f64 = 1050.0;
const MIN_W: f64 = 1024.0;
const MIN_H: f64 = 600.0;
/// Windows draws maximized windows ~8 px past the work area edge (invisible resize borders).
const TOLERANCE_PX: i32 = 16;

fn monitor_for(window: &WebviewWindow) -> Option<Monitor> {
    window
        .current_monitor()
        .ok()
        .flatten()
        .or_else(|| window.primary_monitor().ok().flatten())
}

pub fn fit_to_work_area(window: &WebviewWindow) -> Result<(), String> {
    let monitor = monitor_for(window).ok_or("no monitor available")?;
    let scale = monitor.scale_factor();
    let wa = monitor.work_area();
    let (wa_w, wa_h) = (f64::from(wa.size.width) / scale, f64::from(wa.size.height) / scale);

    window
        .set_min_size(Some(LogicalSize::new(MIN_W.min(wa_w), MIN_H.min(wa_h - 40.0))))
        .map_err(|e| e.to_string())?;

    if wa_w < SMALL_W || wa_h < SMALL_H {
        window.maximize().map_err(|e| e.to_string())?;
    } else {
        let w = (wa_w * 0.9).min(MAX_W);
        let h = (wa_h * 0.9).min(MAX_H);
        window.set_size(LogicalSize::new(w, h)).map_err(|e| e.to_string())?;
        // Center the *outer* frame (includes title bar) inside the work area.
        let outer = window.outer_size().map_err(|e| e.to_string())?;
        let x = wa.position.x + (wa.size.width.saturating_sub(outer.width) / 2) as i32;
        let y = wa.position.y + (wa.size.height.saturating_sub(outer.height) / 2) as i32;
        window.set_position(PhysicalPosition::new(x, y)).map_err(|e| e.to_string())?;
    }
    window.show().map_err(|e| e.to_string())?;
    window.set_focus().map_err(|e| e.to_string())
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FitReport {
    pub fits: bool,
    pub maximized: bool,
    pub minimized: bool,
    pub scale: f64,
    pub outer: [i64; 4],
    pub work_area: [i64; 4],
}

pub fn fits(outer_pos: PhysicalPosition<i32>, outer: PhysicalSize<u32>, wa_pos: PhysicalPosition<i32>, wa: PhysicalSize<u32>) -> bool {
    let (ox, oy) = (outer_pos.x, outer_pos.y);
    let (ow, oh) = (outer.width as i32, outer.height as i32);
    ox >= wa_pos.x - TOLERANCE_PX
        && oy >= wa_pos.y - TOLERANCE_PX
        && ox + ow <= wa_pos.x + wa.width as i32 + TOLERANCE_PX
        && oy + oh <= wa_pos.y + wa.height as i32 + TOLERANCE_PX
}

/// Reports whether the Studio window's outer frame lies inside its monitor's work area.
#[tauri::command]
pub async fn studio_window_fit(window: WebviewWindow) -> Result<FitReport, String> {
    let monitor = monitor_for(&window).ok_or("no monitor available")?;
    let wa = monitor.work_area();
    let pos = window.outer_position().map_err(|e| e.to_string())?;
    let size = window.outer_size().map_err(|e| e.to_string())?;
    Ok(FitReport {
        fits: fits(pos, size, wa.position, wa.size),
        maximized: window.is_maximized().map_err(|e| e.to_string())?,
        minimized: window.is_minimized().map_err(|e| e.to_string())?,
        scale: monitor.scale_factor(),
        outer: [pos.x.into(), pos.y.into(), size.width.into(), size.height.into()],
        work_area: [wa.position.x.into(), wa.position.y.into(), wa.size.width.into(), wa.size.height.into()],
    })
}

/// Restores a minimized Studio and fits it to the work area again.
#[tauri::command]
pub async fn studio_window_refit(window: WebviewWindow) -> Result<(), String> {
    if window.is_minimized().map_err(|e| e.to_string())? {
        window.unminimize().map_err(|e| e.to_string())?;
    }
    fit_to_work_area(&window)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn maximized_window_with_invisible_borders_fits() {
        // 1920×1080 @150 %, 48 px taskbar: work area 1920×1032; maximized frame is -8,-8 1936×1048.
        assert!(fits(
            PhysicalPosition::new(-8, -8),
            PhysicalSize::new(1936, 1048),
            PhysicalPosition::new(0, 0),
            PhysicalSize::new(1920, 1032)
        ));
    }

    #[test]
    fn the_original_bug_does_not_fit() {
        // 1440×900 logical at 150 % = 2160×1350 physical (+ title bar) on a 1920×1032 work area.
        assert!(!fits(
            PhysicalPosition::new(0, 0),
            PhysicalSize::new(2160, 1395),
            PhysicalPosition::new(0, 0),
            PhysicalSize::new(1920, 1032)
        ));
    }
}

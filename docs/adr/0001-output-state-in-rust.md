# ADR 0001 — Output state lives in Rust; output windows are isolated processes

- Status: accepted (Phase A, Step 4)
- Date: 2026-11-14

## Context

CLAUDE.md requires that **output windows keep displaying if the Studio window crashes or freezes**,
and the Phase A acceptance criteria ask us to verify that closing the Studio does not blank the
Audience output. If program state lived only in the Studio's React tree, or output windows shared
a renderer process with the Studio, a Studio crash or a hung JavaScript thread would take the
audience screen down with it in the middle of a service.

## Decision

1. **Single source of truth for on-air state in Rust.** `src-tauri/src/output_state.rs` holds the
   latest `OutputState` snapshot (shape defined and validated by zod in `app/src/outputs/types.ts`).
   The Studio *sends* snapshots with `invoke('output_set_state')`; Rust stores them and broadcasts the
   `output://state` event to all windows.
2. **Outputs pull on load.** Each output window calls `invoke('output_get_state')` when it mounts,
   so an output that is opened, reloaded or recreated while the Studio is gone still shows the
   current program.
3. **Outputs never mount the Studio.** `main.tsx` identifies output windows by their label
   (`output-audience`, `output-stage`) and renders only `OutputView`. They do not load the
   command bus, the library stores or the router.
4. **Process isolation.** Output windows are created with their own WebView2 data directory
   (`<app-local-data>/webview-outputs`). WebView2 runs a separate browser process (and renderer)
   for a different user-data folder, so a hung Studio renderer cannot freeze the audience screen.
5. **Snapshots, not deltas, ordered without the wall clock.** Every update is a full snapshot.
   Rust stamps each one with a process-wide monotonic counter (`output_state::stamp`), ignoring any
   version the Studio sent, so ordering survives Studio reloads and clock changes. The browser
   transport carries a per-run `session` id instead; outputs reset ordering when it changes.
6. **Time is computed locally.** Clocks and timers carry `startedAt` and `accumulatedMs`. Each output
   computes the display value itself (`outputs/timerText.ts`), so countdowns keep running with no
   Studio at all.
7. **The app stays alive.** Tauri keeps the process running while any window is open. Closing the
   Studio leaves the outputs up. `Ctrl+Shift+S` on an output window reopens the Studio
   (`studio_reopen`), and `Ctrl+Shift+Q` quits.

Browser dev mode uses the same contract through `BroadcastChannel` plus a `localStorage` snapshot
(`outputs/bridge.ts`), so the same code paths are exercised in tests.

8. **Window-creating commands are `async`.** On Windows, building a webview window inside a
   synchronous Tauri command blocks the main thread waiting on WebView2 and never completes.
   `output_open`, `output_close`, `studio_reopen` and `list_monitors` are therefore `async`.
   Every native call from the UI goes through `invokeChecked` (`outputs/tauri.ts`), which times out
   after 8 s so a hang becomes a visible error (toast and audit log entry) instead of silence.

## Consequences

- The output renderer is small and independent. Visual changes to outputs must go through the
  `OutputState` contract, which documents what operators can put on screen.
- Snapshots are a few KB. Updates are coalesced to one send per animation frame (`outputs/sync.ts`).
- Output windows do not share `localStorage` with the Studio (separate data directory). This is
  intended: everything they need arrives through Rust.
- Phase B can persist the last snapshot to disk for crash recovery without changing the contract.

## Verification

- Automated: `src/outputs/OutputView.test.tsx` renders outputs from a published snapshot with no
  Studio mounted, and checks stale-version rejection and per-role test patterns.
- End-to-end self-check: `SCRIBE_SELFTEST=1 npm run tauri dev` drives the real UI (palette →
  Screens → Open Audience → load a song from the palette → → key), waits for the Audience window to
  acknowledge the *rendered* slide text, then Rust closes the Studio, probes the Audience and
  prints `[selftest] RESULT PASS|FAIL`.
- Manual (desktop build): open Audience from Screens, take a slide, close the Studio window. The
  Audience keeps showing the slide and any running timer keeps counting. Press `Ctrl+Shift+S` on
  the output to bring the Studio back.

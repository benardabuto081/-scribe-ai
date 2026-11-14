# Progress log

A new session can resume from this file alone. Read `CLAUDE.md`, `docs/SPEC.md`,
`docs/PHASE_A_PROMPT.md`, then this file.

## How to verify (run from `app/`)

```
npm run typecheck && npm run lint && npm test && npm run format:check
cd src-tauri && cargo clippy --all-targets && cargo test && cd ..
SCRIBE_SELFTEST=1 npm run tauri dev     # prints [selftest] … RESULT PASS|FAIL, then exits
```
(PowerShell: `$env:SCRIBE_SELFTEST=1; npm run tauri dev`.) The self-test **wipes this app's
localStorage** (keys `scribe.*`) to start from a fresh profile, then drives the real UI.

Self-test sequence today: fresh profile → splash → sign-in → Continue in Local Mode → all 9 wizard
steps → app shell → Studio window fits work area → palette "screens" → Screens → Open Audience →
palette "Amazing Grace" → → key → Audience renders the slide → Rust closes the Studio → Audience
still shows the slide. Last result: **PASS** (2026-11-14).

## Done

- **Phase A Steps 1–4** (see git history): scaffold, design system (`#/design-system`), Command Bus,
  Studio shell, isolated output windows with state in Rust (ADR 0001), Screens.
- **Step 4 fixes:** async window commands (Windows deadlock), `invokeChecked` timeout, every failure
  toasted + audited, palette ranking, rail alignment, Rust-assigned monotonic output versions.
- **A — Studio window sizing** (`src-tauri/src/studio_window.rs`): fitted from the monitor work area,
  DPI-aware; maximizes on small work areas; min 1024×600; starts hidden until fitted; self-test
  checks the frame fits and the bottom strip is visible (restores + re-fits if minimized).
- **B — Step 5, auth and onboarding:**
  - `features/auth/provider.ts` — `AuthProvider` interface; `mocks/authProvider.ts` mock backend.
  - `features/auth/license.ts` — cached signed license, 90-day offline grace, never blocks (tests).
  - `features/auth/session.ts` — Local Mode (no network), account flow, `nextRoute()`.
  - `features/auth/AuthScreens.tsx` — Splash, Sign in (Local Mode first), Create account, Forgot
    password, Workspace (mine/create/join), Role. Loading, error, success and empty states.
  - `features/onboarding/` — 9-step wizard (`wizard.ts` persisted store + `Onboarding.tsx`).
  - `features/songs/parseLyrics.ts` — header detection (en/sw) + reflow (tests).
  - `features/planner/templates.ts` — 9 service templates (SPEC §4.4).
  - `commands/defs/library.ts` — **already implemented and registered for C**: presentation
    create/update/duplicate/trash/restore/purge, song.createFromText, slide add/updateText/delete/
    setElements (canvas), group add/update, arrangement set/select, playlist create/duplicate/update/
    addItem/updateItem/removeItem/moveItem. All with snapshot undo. `ElementSchema` (zod) is the
    canvas element contract. `commands/defs/session.ts`: auth.signOut, onboarding.complete/restart.
  - Domain (`state/domain.ts`): `SlideElement` (1920×1080 design space), `Slide.elements`,
    `Presentation.deletedAt` (trash), `Playlist.outline`.
  - Routes: `/splash`, `/auth/*`, `/onboarding/:step`; Studio routes guarded by `RequireSession`.

- **Housekeeping (session 3):**
  - Self-test isolation: in `SCRIBE_SELFTEST=1` runs Rust builds every webview with a per-run profile
    at `%TEMP%\scribe-selftest-<pid>` (`selftest::profile_dir`, printed as `isolated profile: …`).
    The frontend refuses to run without it and checks it is empty. Nothing is wiped any more. Rust
    test `isolated_profile_is_per_process_under_temp`. The Studio is now built in code
    (`studio_window::build_studio`; `create: false` in tauri.conf.json) so it can get that profile.
  - Minimized Studio root cause: **not an app bug.** Three instrumented runs (no reload; reload +
    early check; reload + normal flow) never minimized the window; the only window-state code is the
    startup fit (maximize/show/focus). Windows parks a manually minimized window at −32000,−32000
    with a 237×39 frame, exactly what session 2 recorded, so it was an external minimize while test
    windows kept popping up. The test no longer restores the window; a minimized Studio is a FAIL,
    and every Studio resize is logged during self-test runs so any recurrence shows when it happened.
  - Output windows are pre-created hidden ~0.8 s after startup (`windows::precreate_outputs`).
    Open now only positions + shows. Measured: before 2.8 / 2.9 / 3.8 / 12.3 s to first ack; after
    0 ms to show, 235–257 ms to first ack. Closing an output hides it (keeps its state
    subscription); the app exits when the Studio closes and no output is visible.

- **C1 — Live Control** (`features/live/LivePage.tsx`, route `/live`): plan queue + quick search,
  Preview/Program monitors via `AudienceFrame` (exported from `outputs/OutputView.tsx`, same
  renderer as the Audience window), action bar, transition + layer controls, slide grid, AI panel,
  quick-bar. Number keys 1–9 → `slide.trigger` (`commands/keyboard.ts`). Output contract now carries
  optional canvas `elements` (rendered by `CanvasSlide`) for the editor. Simulated AI feed:
  `mocks/aiFeed.ts`, started only by the visible "Simulate AI" switch. Palette ranking moved fully
  into our code (`shouldFilter={false}`; cmdk did not order groups, so "live" ranked a playlist
  first); rendered test `CommandPalette.test.tsx`. Self-test now: palette → Live → AI Approve
  (Program shows John 3:16) → plan item → Preview → Take → Program → Audience renders it.

## In progress

Nothing half-done. **C has not started.**

## Next task

**Resume here: C2 — Library**, then (next session per owner) Presentation editor and Planner.
C1 is done; the shared output work for the editor (canvas `elements` in the output contract and
`CanvasSlide` renderer) is already in place.

1. **Library** (`features/library/LibraryPage.tsx`, add `library: <LibraryPage />` to `PAGES` in
   `app/router.tsx`): `Tree` of libraries + Favorites / Recent / Trash; grid (`ThumbnailGrid`,
   virtualized; render a small `AudienceFrame` of the first slide or a group-colored text card) /
   list (`Table`) toggle; search, sort (title, updated, uses), tag chips; multi-select (checkbox +
   Shift/Ctrl click) with bulk actions: trash (`presentation.trash`), duplicate, move
   (`presentation.update` libraryId), favorite; details dialog (title, author, tags, CCLI,
   language via `presentation.update`); trash view with restore / delete permanently
   (`presentation.restore` / `presentation.purge`); double-click opens in Live
   (`presentation.open` + `app.navigate /live`) and an Edit action goes to `/editor/<id>` (the
   editor screen is next session; it shows Coming soon until then). All four UI states.
   Self-test: navigate to Library, search "amazing", select it, trash it, check it is in Trash,
   restore it.
2. **Presentation editor** and 3. **Planner**: see the plan in git history of this file
   (session 2 "Next task"), unchanged: commands already exist in `commands/defs/library.ts`.

For each: i18n (en + sw; parity test), FEATURE_STATUS, all checks + self-test, commit block.

## Decisions made without asking

- Live Control auto-selects the first service plan when none is selected (operators should land on
  something usable). The AI feed in Phase A is a clearly labelled simulation, off by default.
- Palette: ranking is done in our code, not cmdk, so results are deterministic and tested.

- Small-screen window policy is **maximize**; min window size 1024×600 logical.
- Sign-in forms call the `AuthProvider` directly instead of the Command Bus: the bus requires an
  operator and permission level, which do not exist before sign-in. Post-session actions
  (sign out, finish/restart setup) are commands.
- Local Mode signs in as a local **admin** with a perpetual local license.
- License offline grace period: **90 days**. Even when it lapses, only cloud features pause.
- Wizard: Church name and Languages are required; every other step is skippable.
- Model pack "Download" is shown but marked Coming soon (needs the engine, Phase C). "Load from
  USB/folder" validates the folder now (`model.bin`, `config.json`, a tokenizer/vocabulary file);
  copying/installing happens when the engine lands.
- Paste-lyrics import is real (creates songs). Media import and team invites are visibly
  Coming soon / queued.
- Service languages offered: English, Kiswahili, Dholuo, Gĩkũyũ, Luganda, French.

## Phase C notes (AI engine integration)

1. **Audio devices:** browser `getUserMedia` / `enumerateDevices` device IDs do **not** match the
   Python engine's `sounddevice` indexes. When the engine is connected, the wizard audio step (and
   Settings → Audio) must list devices and show the level meter **from the engine** (engine API),
   and store the engine's device identifier. The browser meter stays only as the engine-down fallback.
2. **Model pack install:** installing from download or USB/folder must **copy** the pack into an
   app-data `models` folder owned by the app (e.g. `<app_local_data>/models/<pack>`), and Rust must
   pass that path to the engine at sidecar launch. This replaces the prototype's hardcoded
   `models/faster-whisper-small` layout next to the project.

## Known issues

- Pre-creating outputs builds two WebView2 instances in their own browser process. On a cold
  profile this took 4–13 s in the background, and native window calls made during that time wait
  (one `studio_window_fit` timed out at 8 s while it ran). The UI stays usable; warm starts take
  ~2 s. Revisit if cold-start budget (5 s) is missed on the 8 GB target laptop.

- In the last two self-test runs the Studio window was found **minimized** after the fresh-start
  reload; the test restores and re-fits it. Not yet known whether this was user action or the app.
  Watch one run to confirm.
- Audience window first acknowledgement took 12 s in one run (3 s in others). Probably cold
  WebView2 start for the separate output data directory; measure on a cold boot.
- Bible lookup in the desktop app uses the 18-verse sample with a visible warning until
  `bible_lookup` (rusqlite over `data/bible.db`) is built.
- Audit log is in memory only (Phase B persists it). Kiswahili copy needs native-speaker review.

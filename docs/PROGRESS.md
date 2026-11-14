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

## In progress

Nothing half-done. **C has not started.**

## Next task — C (Step 6 priorities 1–4), in this order

Shared first: in `outputs/types.ts` add optional `elements` (array of the `ElementSchema` shape) to
`SlideContent`; in `state/live.ts` `toSlideContent` pass `cue.elements`; in `OutputView.tsx` render
elements absolutely in % of 1920×1080 when present (else themed text). Export an `AudienceFrame
({ state })` component from `OutputView.tsx` so Studio monitors reuse the exact output renderer.

1. **Live Control** (`features/live/LivePage.tsx`, nav id `live`, add to `PAGES` in
   `app/router.tsx`): `SplitPane` id `live` with three panes.
   - Left: playlist picker + items (`playlist.selectItem`), quick search for songs and any scripture
     reference (`scripture.load` / `scripture.show`).
   - Center: **Preview** and **Program** monitors (16:9 `AudienceFrame`; preview builds an
     OutputState from the preview cue), slide grid with group colors and numbers (click →
     `slide.trigger`, Alt+click → `slide.preview`), action bar Take / Next / Previous / Clear /
     Blackout / Logo (existing commands), transition select (`transition.set`), per-layer clear
     (`screen.clearLayer`).
   - Right: AI panel — transcript, detection cards with confidence + explanation, Approve/Dismiss
     (`ai.approve` / `ai.dismiss`), mode switch, Pause, Undo last AI action, manual scripture box.
     Phase A feed: `mocks/aiFeed.ts` started by a visible "Simulate AI" toggle (label it simulated);
     it pushes transcript lines and `ai.propose` with `source: 'ai'`.
   - Bottom: timers (`timer.*`), props (`prop.toggle`), messages (`message.show`), macros
     (`macro.run`) quick-bar. Number keys 1–9 trigger slides (add to `commands/keyboard.ts` as
     `slide.trigger` with index).
   - Self-test: replace the palette song step with Live: select Sunday plan item → Take → check
     Program monitor DOM and Audience ack.
2. **Library** (`features/library/LibraryPage.tsx`): `Tree` of libraries + Favorites / Recent /
   Trash; grid (ThumbnailGrid, virtualized) / list (Table) toggle; search, sort, tag chips;
   multi-select bulk actions (trash, duplicate, move via `presentation.update` libraryId); details
   dialog (title, author, tags, CCLI, language); trash view with restore / delete permanently.
3. **Presentation editor** (`features/editor/EditorPage.tsx`, route `/editor` and
   `/editor/:presentationId`): left = groups with slides (add/rename/color via commands) and
   arrangement editor (dnd-kit reorder → `arrangement.set`); center = 16:9 canvas: add text/shape,
   select, drag to move, 8 handles to resize (local state during drag; commit one
   `slide.setElements` on pointer-up), arrow-key nudge, Delete; right = inspector (font, size,
   weight, color, align, fill, radius, opacity, shadow via design-system pickers); slide text and
   notes editing (`slide.updateText`); Ctrl+Z through `app.undo`.
4. **Planner** (`features/planner/PlannerPage.tsx`): plans list, new from template
   (`playlist.create` with `SERVICE_TEMPLATES`), duplicate last week (`playlist.duplicate`), header
   (name, date, start time via `playlist.update`), items list with dnd-kit reorder
   (`playlist.moveItem`), durations with running start times and total, assignee, add from library
   dialog (`playlist.addItem`), Timeline view (design-system `Timeline`), sermon outline textarea,
   print run sheet (window.print + print CSS).

For each: update i18n (en + sw, parity test enforces), FEATURE_STATUS, run all checks + self-test,
print a commit block.

## Decisions made without asking

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

## Known issues

- In the last two self-test runs the Studio window was found **minimized** after the fresh-start
  reload; the test restores and re-fits it. Not yet known whether this was user action or the app.
  Watch one run to confirm.
- Audience window first acknowledgement took 12 s in one run (3 s in others). Probably cold
  WebView2 start for the separate output data directory; measure on a cold boot.
- Bible lookup in the desktop app uses the 18-verse sample with a visible warning until
  `bible_lookup` (rusqlite over `data/bible.db`) is built.
- Audit log is in memory only (Phase B persists it). Kiswahili copy needs native-speaker review.

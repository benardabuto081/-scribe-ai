# Phase A Prompt — Foundation and Design (paste this into Claude Code)

You are the lead engineer on **Scribe AI**, a ProPresenter-class presentation and production platform with an AI layer that can operate every feature. Before doing anything:

1. Read `CLAUDE.md` in the repo root completely. Its rules are binding.
2. Read `docs/SPEC.md` completely. It is the product definition.
3. Look at the existing repo (`engine/`, `run_live.py`, `requirements.txt`) so you understand the Python AI engine. Do not rewrite or move it.
4. Look at the logo in `app/src/assets/brand/` (create the folders if missing) and derive the brand palette from it.

## Your job in this phase

Build the foundation and the **complete visual product** as a working, clickable desktop app. Every screen listed in `docs/SPEC.md` section 4 must exist with a high-quality, sleek, modern UI and realistic seeded mock data. Real persistence and real AI come in later phases, but the architecture that makes them possible must be real now.

### Step 0: Plan
Write a short plan (file structure, libraries you will use and why, anything you need me to decide). Keep dependencies lean for an 8 GB Windows laptop. Wait for my "go" before scaffolding if you have blocking questions; otherwise proceed.

### Step 1: Scaffold
- Create `app/` with Tauri 2, React 18, TypeScript strict, Vite, Tailwind, Zustand, React Router, Lucide icons, zod, Vitest, ESLint, Prettier.
- Bundle Inter and the display fonts locally (OFL only). No CDN calls anywhere.
- Add i18n with English and Kiswahili files; no hardcoded UI strings.
- Add `docs/FEATURE_STATUS.md` listing every feature in SPEC section 4 and 5 with status `mock | partial | done`.

### Step 2: Design system
Build `app/src/design-system/` with tokens (derived from the logo), dark, light and high-contrast themes, and every component listed in SPEC section 1. Add a hidden `/design-system` route that shows all components and states (a living style guide). The look must be sleek and modern: layered dark surfaces, thin borders, soft shadows, refined typography, subtle motion. Use the logo in the splash, sign-in, sidebar and About.

### Step 3: Command Bus (do this before building screens)
Implement `app/src/commands/` exactly as described in CLAUDE.md: registry, zod-typed commands, sources (`ui | keyboard | midi | remote | macro | ai`), undo support, permission levels, audit log store. Register at least 40 commands covering: slide (trigger, next, previous, clear), screen (clear, blackout, logo), look (apply), scripture (show), song (load), playlist (select, next item), timer (start, stop, reset), message (show, hide), prop (toggle), macro (run), media (play, stop), audio (play, stop, fade), ai (setMode, pause, resume, approve, dismiss, undoLast), output (assign display, test pattern). **Every button and shortcut in the UI must call a command, never a private handler.** Add a command palette (`Ctrl+K`) that lists and runs commands.

### Step 4: App shell and windows
- Studio window: left rail, top status bar (service state chip, AI mode switch and confidence, mic meter, online/offline, LIVE, active Look, clock), resizable split panes with persisted layout, command palette.
- Output windows: **Audience** and **Stage** as separate Tauri windows that render whatever the current slide/Look state is, including a transition, a prop and a message layer. They must keep rendering if the Studio window is closed or frozen (state lives in Rust or a shared channel, not only in the Studio React tree).
- Display detection and assignment in Screens and Outputs (use real Tauri monitor APIs).

### Step 5: Auth and onboarding screens
Splash and license check, Sign in with **Continue in Local Mode**, Create account, Forgot password, Workspace create/join, Role pick, and the full first-run wizard (SPEC section 3). Auth is mocked behind an interface (`AuthProvider`) so the real backend can replace it. Local Mode must work fully.

### Step 6: Every module as a high-fidelity mock
Build all of SPEC section 4 (4.1 to 4.28) as navigable screens with seeded data, all four UI states, keyboard paths and tooltips. Priorities in this order: **Live Control, Library, Presentation editor, Planner, Scripture, Songs, Looks/Themes/Templates gallery**, then the rest. The Presentation editor canvas should already support adding, moving, resizing and styling text and shapes, and the Live Control screen must actually trigger slides to the Audience and Stage windows through the Command Bus using the mock presentation.

Template Gallery (SPEC section 5): create the data-driven template format (JSON schema with zod), a loader, and **at least 3 real templates per category** rendering correctly (backgrounds can be CSS/SVG/procedural; no copyrighted assets). More templates come in Phase D.

### Step 7: Engine connection stub
In `src-tauri`, add sidecar lifecycle management for the Python engine (start, health check, restart, stop) and a typed client in the UI. Show real engine status (connected / starting / down) in the status bar. If the engine is not found, the app must still work with AI features visibly disabled. Define the WebSocket event contract in `docs/engine-api.md` (transcript, detection, service-state, health). Do not implement AI logic now.

### Step 8: Quality
- `npm run typecheck`, `npm run lint`, `npm run test` all pass.
- Tests for the Command Bus (registration, validation, undo, audit log, permissions) and for template schema loading.
- `npm run tauri dev` launches without errors; `npm run tauri build` produces a Windows installer.
- Update `docs/FEATURE_STATUS.md`.

## Constraints reminders
- Offline-first, no CDN assets, bundled fonts.
- Original design only. Do not copy ProPresenter's assets, icons, names or UI text.
- No hidden fakes: mocks live in `app/src/mocks/` behind `VITE_USE_MOCKS`, unfinished features show a visible "Coming soon" state and are listed in `FEATURE_STATUS.md`.
- Commit after each step with conventional commit messages, on a branch named `phase-a-foundation`.
- Never commit `node_modules`, `target`, `dist`, `build`, `models/`, `release/`, `.env`.

## Acceptance criteria (I will check these)
1. App launches; I can sign in via Local Mode and complete the wizard.
2. I can click through every module in the left rail and every screen looks polished and consistent with the logo's palette.
3. In Live Control I can pick a mock song or scripture, press Take/Next/Clear, and see the Audience and Stage windows update with transitions.
4. The same action works from the button, a keyboard shortcut, the command palette and the (mock) AI panel Approve button, all through one command.
5. Closing the Studio window does not blank the Audience output (verify and document how).
6. Status bar shows real engine health; stopping the engine does not crash the UI.
7. `FEATURE_STATUS.md` honestly reflects what is mock, partial or done.

When finished, give me a report: what is done, what is mock, what you decided without asking, what is blocked, and the recommended Phase B first task.

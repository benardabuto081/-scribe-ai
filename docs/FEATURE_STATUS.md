# Feature Status

Honest status of every feature in `docs/SPEC.md` sections 4 and 5.

| Status | Meaning |
|---|---|
| `none` | Not started. No screen yet. |
| `mock` | Screen exists with seeded data from `app/src/mocks/` (only when `VITE_USE_MOCKS=true`). Unfinished actions show a visible "Coming soon" state. Nothing persists. |
| `partial` | Some real behavior works (listed in Notes); the rest is mock. |
| `done` | Meets the Definition of Done in `CLAUDE.md`. |

Last updated: Phase A, Step 5.

## Temporary items (must be replaced)

| Item | Why it is temporary | Replace with |
|---|---|---|
| Brand mark (`app/src/assets/brand/mark.png`, `mark-tile.png`, `public/favicon.png`, `src-tauri/icons/*`) | Machine-cropped from `logo.jpeg` by `app/scripts/brand-crop.ps1` (black background converted to alpha). JPEG artifacts visible at large sizes. | Official transparent PNG/SVG mark and wordmark from the brand owner. |
| `VITE_USE_MOCKS=true` in `app/.env.production` | Phase A has no persistence, so the packaged build ships with seeded mock data. | Remove in Phase B when SQLite storage lands. |
| Mock auth backend (src/mocks/authProvider.ts) | No cloud backend yet; account sign-in, Google, workspaces and invites are simulated (600 ms latency, offline errors). | Real backend implementing AuthProvider (Phase F). |
| Mock license signature (features/auth/license.ts mockSign) | FNV hash with a dev key, not cryptographic. Grace-period logic is real and tested. | Asymmetric signature verified with a bundled public key (Phase F). |

## Foundation

| Feature | Status | Notes |
|---|---|---|
| Scaffold (Tauri 2, React 18, TS strict, Vite, Tailwind 4, Zustand, Router, zod, Vitest, ESLint, Prettier) | done | Web and Rust layers build; Rust 1.100 (MSVC). |
| Bundled fonts (Inter, Montserrat — OFL) | done | Latin + Latin-ext woff2 vendored in `app/src/assets/fonts/` with OFL licenses. No CDN. |
| i18n (English, Kiswahili) | partial | Catalog parity test; every command has en+sw labels. Kiswahili copy needs native-speaker review. |
| Design system (§1) | done | Tokens from logo, dark/light/high-contrast, comfortable/compact, all §1 components, living style guide at `#/design-system`. |
| Command Bus, registry, audit log | partial | 58 typed commands, zod args, undo, permissions, AI gate, keyboard + Ctrl+K palette. Audit log is in-memory (persists in Phase B). |
| Studio shell and status bar (§2) | partial | Left rail (all modules), status bar (service state, AI mode/confidence/pause, mic meter, online, engine, LIVE, look, clock), bottom strip. Mic meter shows only when the engine is connected. |
| Output windows (Audience, Stage) | partial | Separate Tauri windows with own WebView2 process; state in Rust (ADR 0001); transitions, props, messages, timers, blackout, logo, test pattern, identify. Edge blending / LED tiling not started. |
| Engine sidecar connection | none | Step 7. |

## Section 3 — Authentication and onboarding

| Feature | Status | Notes |
|---|---|---|
| Splash and license check | partial | Cached license, 90-day offline grace, never blocks; status badge on splash. Signature is mock. |
| Sign in / Continue in Local Mode | partial | Local Mode is real and fully offline (no network calls). Email and Google sign-in run against the mock AuthProvider. |
| Create account | mock | Validation real; backend mock. |
| Forgot / reset password | mock | Request + sent state; backend mock. |
| Workspace create / join | mock | List, create, join by 6-character code; backend mock. |
| Role pick | partial | Sets the session role, which drives Command Bus permissions (real). |
| First-run wizard | partial | 9 steps, one per screen, resumable (persisted), skippable where safe, keyboard (Enter / Alt+Left). Real: church profile + logo, UI language, hardware check, microphone test with live meter, model-pack folder validation (USB/folder), display assignment, paste-lyrics import (creates songs). Coming soon: model download, licensed Bible import, media import, sending team invites. |

## Section 4 — Studio modules

| # | Module | Status | Notes |
|---|---|---|---|
| 4.1 | Home | none | |
| 4.2 | Library | none | |
| 4.3 | Presentation editor | none | |
| 4.4 | Playlists / Planner | none | |
| 4.5 | Live Control | none | |
| 4.6 | Looks, Themes, Templates | none | |
| 4.7 | Props | none | |
| 4.8 | Messages | none | |
| 4.9 | Timers and Clocks | none | |
| 4.10 | Media bin | none | |
| 4.11 | Audio bin | none | |
| 4.12 | Live video and capture | none | |
| 4.13 | Transitions and effects | none | |
| 4.14 | Macros, Actions, Cues, Triggers | none | |
| 4.15 | Timeline | none | |
| 4.16 | Scripture | none | |
| 4.17 | Songs | none | |
| 4.18 | Stage display | none | |
| 4.19 | Screens and Outputs | partial | Real display detection (Tauri monitor API), assign Audience/Stage, open/close, test pattern, identify. No edge blending, LED tiling, rotation or safe-area guides yet. |
| 4.20 | Director | none | |
| 4.21 | Remote control and API | none | |
| 4.22 | AI Brain | none | |
| 4.23 | Post-Service | none | |
| 4.24 | Analytics and Reports | none | |
| 4.25 | Team and Permissions | none | |
| 4.26 | Search | partial | Ctrl+K palette searches commands, screens, songs, looks, macros, playlists. Search screen itself is Coming soon. |
| 4.27 | Settings | none | |
| 4.28 | Help | none | |

## Section 5 — Template catalog

| # | Category | Status | Count | Notes |
|---|---|---|---|---|
| 5.1 | Backgrounds | none | 0 | |
| 5.2 | Thumbnail templates | none | 0 | |
| 5.3 | Font templates | none | 0 | |
| 5.4 | Text style presets | none | 0 | |
| 5.5 | Song / lyric themes | none | 0 | |
| 5.6 | Scripture themes | none | 0 | |
| 5.7 | Lower thirds | none | 0 | |
| 5.8 | Announcement templates | none | 0 | |
| 5.9 | Countdown and pre-service | none | 0 | |
| 5.10 | Sermon templates | none | 0 | |
| 5.11 | Giving and connect | none | 0 | |
| 5.12 | Special service moments | none | 0 | |
| 5.13 | Stage layouts | none | 0 | |
| 5.14 | Playlist / Service templates | none | 0 | |
| 5.15 | Message templates | none | 0 | |
| 5.16 | Video intro/outro bumpers | none | 0 | |
| 5.17 | Print and share | none | 0 | |
| 5.18 | Looks presets | none | 0 | |

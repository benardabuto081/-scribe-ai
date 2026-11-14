# Feature Status

Honest status of every feature in `docs/SPEC.md` sections 4 and 5.

| Status | Meaning |
|---|---|
| `none` | Not started. No screen yet. |
| `mock` | Screen exists with seeded data from `app/src/mocks/` (only when `VITE_USE_MOCKS=true`). Unfinished actions show a visible "Coming soon" state. Nothing persists. |
| `partial` | Some real behavior works (listed in Notes); the rest is mock. |
| `done` | Meets the Definition of Done in `CLAUDE.md`. |

Last updated: Phase A, Step 1.

## Temporary items (must be replaced)

| Item | Why it is temporary | Replace with |
|---|---|---|
| Brand mark (`app/src/assets/brand/mark.png`, `mark-tile.png`, `public/favicon.png`, `src-tauri/icons/*`) | Machine-cropped from `logo.jpeg` by `app/scripts/brand-crop.ps1` (black background converted to alpha). JPEG artifacts visible at large sizes. | Official transparent PNG/SVG mark and wordmark from the brand owner. |
| `VITE_USE_MOCKS=true` in `app/.env.production` | Phase A has no persistence, so the packaged build ships with seeded mock data. | Remove in Phase B when SQLite storage lands. |

## Foundation

| Feature | Status | Notes |
|---|---|---|
| Scaffold (Tauri 2, React 18, TS strict, Vite, Tailwind 4, Zustand, Router, zod, Vitest, ESLint, Prettier) | partial | Web layer builds and tests; Rust shell pending toolchain install. |
| Bundled fonts (Inter, Montserrat — OFL) | done | Via `@fontsource-variable/*`, bundled into the app at build time. No CDN. |
| i18n (English, Kiswahili) | partial | Catalog parity test in place; strings added as screens land. |
| Design system (§1) | none | Step 2. |
| Command Bus, registry, audit log | none | Step 3. |
| Studio shell and status bar (§2) | none | Step 4. |
| Output windows (Audience, Stage) | none | Step 4. |
| Engine sidecar connection | none | Step 7. |

## Section 3 — Authentication and onboarding

| Feature | Status | Notes |
|---|---|---|
| Splash and license check | none | |
| Sign in / Continue in Local Mode | none | |
| Create account | none | |
| Forgot / reset password | none | |
| Workspace create / join | none | |
| Role pick | none | |
| First-run wizard | none | |

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
| 4.19 | Screens and Outputs | none | |
| 4.20 | Director | none | |
| 4.21 | Remote control and API | none | |
| 4.22 | AI Brain | none | |
| 4.23 | Post-Service | none | |
| 4.24 | Analytics and Reports | none | |
| 4.25 | Team and Permissions | none | |
| 4.26 | Search | none | |
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

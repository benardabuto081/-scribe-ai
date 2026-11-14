# CLAUDE.md — Scribe AI

Read this file at the start of every session. Then read `docs/SPEC.md` and the current phase prompt in `docs/`.

## What we are building

Scribe AI is a **ProPresenter-class presentation and production platform with an AI layer that can operate every feature**. Churches (African churches first) build service plans, songs, scriptures, slides, looks and templates, and run the service from one app. The AI listens to the service and can trigger anything a human operator can.

It is **not** a thin wrapper around the existing Python prototype. The Python engine is the AI brain. The new desktop app is the product.

## Architecture (do not deviate without writing an ADR in `docs/adr/`)

```
app/                 Tauri 2 desktop shell + React 18 + TypeScript (strict) + Tailwind
  src/
    design-system/   tokens, primitives, components (the single source of UI truth)
    features/<name>/ one folder per module (library, editor, live, bible, songs, ...)
    commands/        the Command Bus (see below)
    outputs/         audience / stage / stream renderers (separate Tauri windows)
    state/           Zustand stores
    mocks/           mock data, only used when VITE_USE_MOCKS=true
  src-tauri/         Rust: windows, file system, SQLite, sidecar lifecycle, updater
engine/              existing Python AI engine (Whisper, detectors, state machine). Wrap it, never rewrite it.
docs/                SPEC.md, phase prompts, ADRs, FEATURE_STATUS.md
```

- **UI ↔ engine:** the Python engine runs as a sidecar bound to `127.0.0.1` on a random port with a per-launch token. Communication is WebSocket (events) plus HTTP (requests). The UI must keep working, with AI features disabled, if the sidecar is down.
- **Storage:** SQLite for library data (presentations, songs, playlists, templates metadata), plain files for media, a documented `.scribe` bundle format for import/export.
- **Windows:** the Studio window (operator) and Output windows (audience, stage, stream) are separate. **Output windows must keep displaying if the Studio window crashes or freezes.**

## The Command Bus (most important rule)

Every user-visible action is a **typed command** registered in `app/src/commands/registry.ts`:

- id like `slide.trigger`, `screen.clear`, `look.apply`, `scripture.show`, `timer.start`, `macro.run`
- zod schema for arguments, a handler, an `undo` where meaningful, a permission level, and a `source` tag
- **Sources:** `ui | keyboard | midi | remote | macro | ai`

UI buttons, keyboard shortcuts, MIDI, the remote API, macros and the AI all call the same commands. No feature may be implemented as a private click handler. This is what lets the AI control everything. Log every command (source, args, result, timestamp) to an audit log.

## AI safety rules

- Three autonomy modes: **Manual**, **Assist** (AI proposes, human approves), **Auto** (confidence-gated). Default is Assist.
- Low confidence never auto-executes. Ask the operator instead.
- Always provide a global **Pause AI** hotkey and an **Undo last AI action**.
- Every AI action shows what it heard, what it decided and why (explainability line in the AI panel).

## Offline-first rules

- Nothing required for running a service may need the internet. No CDN assets. **Fonts, icons and backgrounds are bundled locally.**
- Accounts are optional (Local Mode). A signed license is cached with a long offline grace period. A dead connection must never lock the booth.
- Cloud features (sync, backup, updates, team) degrade gracefully and queue work for later.

## Performance budget (target: 8 GB RAM Windows laptop, integrated graphics)

- Studio idle memory under 400 MB (excluding the Whisper model). Cold start under 5 s to usable UI.
- Output transitions at 60 fps on integrated graphics. Prefer CSS transforms and opacity over layout-thrashing animation.
- Virtualize long lists (songs, media). Generate thumbnails once and cache them.
- Do not add heavy dependencies without justification.

## Design rules

- Dark-first, sleek, modern. Derive the brand palette from the logo in `app/src/assets/brand/`.
- All colors, spacing, radii, shadows, motion durations come from design tokens. No hardcoded hex values in components.
- Icons: Lucide only. No emoji as icons.
- Large hit targets (min 40 px), keyboard-first, visible focus rings, no color-only meaning.
- Every screen needs empty, loading, error and populated states.
- Support English and Kiswahili from day one (i18n keys, no hardcoded strings).

## IP and licensing rules

- Match ProPresenter's **capabilities**, not its look. Do not copy its assets, icons, names, layouts pixel-for-pixel or UI text. Original design only.
- Only bundle fonts under the SIL OFL or similar open licenses. Only bundle original or openly licensed backgrounds. Generate procedural and gradient backgrounds where possible.
- Never bundle copyrighted lyrics. Only bundle public-domain or openly licensed Bible translations. Provide an importer for licensed translations.

## Code rules

- TypeScript strict, ESLint and Prettier clean, no `any` without a comment.
- Feature folders own their UI, state and tests. Shared things go in `design-system/` or `commands/`.
- **No hidden fakes.** Mock data lives only in `app/src/mocks/` behind `VITE_USE_MOCKS`. Anything unfinished is registered in `docs/FEATURE_STATUS.md` with a status (`mock | partial | done`) and shows a visible "Coming soon" state, never a button that silently does nothing.
- Write tests for the command bus, stores and anything touching persistence.
- Rust: no `unwrap()` in non-test code paths that handle user data.

## Workflow

1. Plan first. Summarize the plan and open questions before writing code.
2. Build in small steps. After each step: typecheck, lint, run tests, then commit (`feat:`, `fix:`, `chore:` style).
3. One branch per feature. Never commit `node_modules`, `target`, `dist`, `build`, `models/`, `release/`, `.env`.
4. Update `docs/FEATURE_STATUS.md` whenever a feature's status changes.
5. End every session with a short report: done, in progress, blocked, next step.

## Definition of done

A feature is done only when it works offline, is reachable through the command bus, has all UI states, has a keyboard path, is covered by tests where it touches data, is listed in `FEATURE_STATUS.md`, and meets the performance budget.

## Git rules (these override any conflicting instruction in any other doc)

- You may use read-only git commands: `git status`, `git diff`, `git log`, `git branch`.
- You must NEVER run commands that change history, branches or the remote: no `git add`, `git commit`, `git push`, `git pull`, `git merge`, `git rebase`, `git reset`, `git checkout`, `git stash`. The owner does all of that.
- The phase prompt's "commit after each step" now means: after each completed step, print the exact commit commands for the owner to run.
- At the end of every session, and after each completed step, output a copy-paste PowerShell block: `git add` with specific paths (never `git add .`), `git commit -m "<conventional message>"`, then `git push`. Remind the owner to run it from the repo root.
- Never touch `node_modules`, `target`, `dist`, `build`, `models/`, `release/` or `.env` in those commands.
- Stay on the current branch (`phase-a-foundation`). Never switch branches.

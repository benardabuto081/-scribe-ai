# Scribe AI

**An offline-first presentation and production platform for churches, with an AI layer that listens to the service and can operate the screens. Built Africa-first, starting from a working real-time scripture and lyric detection engine.**

![status](<https://img.shields.io/badge/status-active%20development-yellow>) ![tauri](https://img.shields.io/badge/Tauri-2-24C8DB) ![react](https://img.shields.io/badge/React-18-61DAFB) ![typescript](https://img.shields.io/badge/TypeScript-strict-3178C6) ![python](https://img.shields.io/badge/python-3.x-blue) ![faster-whisper](<https://img.shields.io/badge/Faster--Whisper-local%20ASR-blueviolet>) ![sqlite](<https://img.shields.io/badge/SQLite-offline%20db-lightgrey>)

> **Project principle:** *If the internet disappears, the service continues.*

---

## What Scribe AI is

Scribe AI is a ProPresenter-class presenter (songs, scripture, slides, media, themes, outputs, planning) combined with an AI assistant that listens to a live service through a microphone, transcribes speech locally, and detects scripture references, song lyrics and service phases. In **Assist** mode it proposes the matching action and the operator approves it. The operator stays in control at all times.

The project has two parts, and this README keeps the line between them explicit:

1. **Desktop app (in development)**: a Tauri + React application. The foundation is real and tested. Most feature screens are still placeholders.
2. **AI engine (working prototype)**: Python code for local speech recognition, scripture detection, lyric matching and a service-state machine. It runs end to end offline today, but it is not yet connected to the desktop app.

Scribe AI is a personal engineering project: a deliberately hard systems problem (real-time, noisy, low-resource, must-never-fail software) used to build depth in autonomous production and applied AI.

### Why this exists

Manual church production is fragile in an unglamorous way. A volunteer has to catch a scripture reference mid-sermon and put it on screen without breaking the flow of the service, often on an old laptop with software that assumes stable internet and a trained operator. Scribe's founding constraint is that **the moment production software depends on the internet to keep running mid-service, it has failed its actual job.** In the environments this project targets, a dropped connection is not an edge case. It is a Sunday.

Design targets: an ordinary Windows laptop (8 GB RAM, integrated graphics), volunteer operators, unreliable internet, and services that mix English and Kiswahili.

---

## Status at a glance

Active development is on the `phase-a-foundation` branch. `main` holds the Python prototype and the project docs until the desktop app is merged.

| Area                                                                                                                                            | State                                                   |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Design system (tokens, dark/light/high-contrast themes, components, living style guide at `#/design-system`)                                  | Done                                                    |
| Command Bus (58+ typed commands, undo, permissions, audit log, AI gate, keyboard shortcuts, Ctrl+K palette)                                     | Done                                                    |
| Studio shell and status bar                                                                                                                     | Done                                                    |
| Audience and Stage output windows, display assignment                                                                                           | Done                                                    |
| Sign-in, Local Mode, 9-step first-run wizard, cached offline license                                                                            | Local Mode real; account backend is a mock              |
| Live Control (Preview/Program monitors, slide grid, AI panel, quick-bar)                                                                        | Built; the AI feed is a labelled simulation             |
| Library, Presentation editor, Planner                                                                                                           | Commands exist; screens not built                       |
| Home, Media, Audio, Designer, Templates, Looks, Props, Timers, Macros, Stage layouts, Director, Remote, Post-service, Analytics, Team, Settings | Placeholder "Coming soon" screens                       |
| Connection between the Python engine and the desktop app                                                                                        | Not built                                               |
| Persistence of library data (SQLite)                                                                                                            | Not built; data is in memory                            |
| Python engine: transcription, scripture detection and lookup, operator gating                                                                   | Done                                                    |
| Python engine: lyric detection, service-state machine                                                                                           | Partial (working in isolation, not wired to live audio) |
| Real-world detection validation                                                                                                                 | Not done                                                |

The exact state of every feature is tracked in [`docs/FEATURE_STATUS.md`](docs/FEATURE_STATUS.md). Next steps are in [`docs/PROGRESS.md`](docs/PROGRESS.md).

---

## Architecture

```
app/        Desktop app: Tauri 2 + React 18 + TypeScript (strict) + Tailwind 4 + Zustand + zod
engine/     Python AI engine: Whisper, scripture and lyric detection, state machine, SQLite databases
data/       bible.db (KJV), songs.db (original test songs), sample sermon transcripts
docs/       SPEC.md, PROGRESS.md, FEATURE_STATUS.md, architecture decision records (docs/adr/)
tests/      Python tests for the engine
run_live.py Python live entry point (prototype)
```

Key decisions:

- **Command Bus.** Every action is a typed, validated command (`slide.next`, `look.apply`, `scripture.show`, ...). Buttons, keyboard shortcuts, the command palette, macros and the AI all call the same commands, so the AI can do anything an operator can. Every call is audited.
- **Isolated output windows.** On-air state lives in Rust. The Audience and Stage windows run in their own WebView2 process, so they keep showing the last slide if the Studio window freezes or is closed. See [ADR 0001](docs/adr/0001-output-state-in-rust.md).
- **AI safety.** Three modes: Manual, Assist (AI proposes, human approves) and Auto (acts only above a confidence threshold). Low confidence never auto-executes, every AI action carries an explanation, and a global Pause AI stops all AI actions.
- **Local Mode.** The app works with no account and no network. An account is optional and only adds sync, backup and team features. A cached license has a long offline grace period and never blocks a service.
- **Engine as a sidecar (planned).** The Python engine is meant to run as a local process the app talks to over localhost. The app must keep working with AI features disabled if the engine is down.

The product specification is in [`docs/SPEC.md`](docs/SPEC.md) and the engineering rules are in [`CLAUDE.md`](CLAUDE.md).

---

## Desktop app

### Getting started (Windows 10/11)

Prerequisites: Node.js 20+, Rust (via rustup) with the Visual Studio C++ Build Tools, and Microsoft Edge WebView2 (included with Windows 11).

```powershell
git clone https://github.com/benardabuto081/-scribe-ai.git
cd ./-scribe-ai
git checkout phase-a-foundation
cd app
npm install
npm run tauri dev
```

On first launch choose **Continue in Local Mode** and finish the setup wizard.

Useful shortcuts: `Ctrl+K` opens the command palette. On an output window, `Ctrl+Shift+S` reopens the Studio and `Ctrl+Shift+Q` quits.

### Checks

```powershell
cd app
npm run typecheck
npm run lint
npm test
npm run format:check
cd src-tauri
cargo clippy --all-targets
cargo test
```

At the last count: 95 frontend tests and 5 Rust tests passing.

### End-to-end self-test

Drives the real app from a fresh, isolated profile (it never touches your real data) through setup, Live Control and the output windows, then closes the Studio and verifies the Audience window still shows the slide. It prints `RESULT PASS` or `RESULT FAIL`:

```powershell
cd app
$env:SCRIBE_SELFTEST = "1"
npm run tauri dev
```

### Measured on the development laptop

- Opening the Audience window shows it in about 0 ms and renders confirmed content in about 250 ms, because the output windows are created hidden at startup.
- On a cold profile, creating those hidden windows in the background took roughly 2 to 13 seconds. This has not yet been measured on the 8 GB integrated-graphics target.

---

## AI engine (Python prototype)

### Capabilities

| Capability                    | Status  | Technology                            | Notes                                                              |
| ----------------------------- | ------- | ------------------------------------- | ------------------------------------------------------------------ |
| Local speech transcription    | Done    | Faster-Whisper (`small`, CPU, int8) | 5-second chunks, VAD-filtered                                      |
| Scripture reference detection | Done    | Regex                                 | All 66 books and common abbreviations, 4 reference formats         |
| Offline Bible lookup          | Done    | SQLite (KJV, 31,100 verses)           | Normalizes spoken formats                                          |
| Fullscreen scripture display  | Done    | Tkinter                               | Auto-clears after a hold time                                      |
| Human-in-the-loop gating      | Done    | Tkinter operator console              | Approve / Dismiss / Manual entry (live path covers scripture only) |
| Lyric detection               | Partial | RapidFuzz (`token_set_ratio`)       | Tested; only reachable via `pipeline.py`, not `run_live.py`    |
| Service state machine         | Partial | Keyword heuristics                    | Same caveat                                                        |
| Unified pipeline              | Partial |                                       | `pipeline.py` demo uses hardcoded text, not live audio           |
| Confidence-scored detection   | Planned |                                       | Current detection is rule-based                                    |
| ASR backend abstraction       | Planned |                                       | Whisper is hardcoded into `AudioEngine`                          |
| First-run model download      | Planned |                                       | Model must already exist locally                                   |

### Live path vs. full pipeline

`run_live.py`, the live microphone entry point, wires together only:

```
AudioEngine -> scripture_detector -> bible_db -> display_engine -> operator_console
```

It does not use the state machine or the lyric detector. `engine/pipeline.py` (`ScribePipeline`) wires them together (lyrics only in the `WORSHIP` state, scripture in every other state), but its demo runs against hardcoded text, not a microphone. The state machine and lyric detector are real, tested code that is not yet connected to live audio. Connecting them, and then connecting the engine to the desktop app, is the most consequential near-term task.

### How detection works

1. **Capture:** `AudioEngine` streams microphone input via `sounddevice` into 5-second chunks.
2. **Transcribe:** each chunk is transcribed locally by `faster-whisper` (`small`, `int8`, CPU, VAD-filtered).
3. **Buffer:** if a chunk yields no detection, the last ~60 characters carry forward so references split across chunks are not lost.
4. **Classify state (full pipeline only):** keyword phrase lists map text to `PRE_SERVICE`, `WORSHIP`, `SERMON`, `PRAYER` or `ANNOUNCEMENTS`. Unmatched text leaves the state unchanged rather than guessing.
5. **Detect scripture:** four regex patterns (`Book Ch:V`, `Book chapter Ch verse V`, `Book Ch V`, compressed `Book ChVV`), validated against real chapter counts per book.
6. **Look up:** spoken formats are normalized (for example "John 316" becomes `John 3:16`) and queried against the local `bible.db`.
7. **Gate:** every detected reference goes to the Operator Console. A human must approve it before it renders.
8. **Match lyrics (full pipeline only):** RapidFuzz compares text against every known song line. `MATCH_THRESHOLD = 75` is deliberately conservative, favouring a missed line over a wrong one.

### Data

| File              | Purpose                  | Notes                                                                                                 |
| ----------------- | ------------------------ | ----------------------------------------------------------------------------------------------------- |
| `data/bible.db` | KJV verse lookup         | SQLite, 31,100 rows, built once with `build_bible_db.py`                                            |
| `data/songs.db` | Lyric lines for matching | 6 original placeholder songs, 72 lines; rebuild from `data/songs_source/*.txt` with no code changes |
| Whisper model     | Local speech recognition | Not in Git. Place a faster-whisper model folder at `models/faster-whisper-small`                    |

`data/raw_transcripts/` (100 YouTube caption files) and `data/transcripts/` (101 cleaned transcripts) hold real sermon material. Only one ground-truth file exists, for a synthetic transcript.

### Running the prototype

```powershell
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python run_live.py
```

A fullscreen display and a small Operator Console open. Detected scripture appears in the console for approval. Approve renders it, Dismiss discards it, and the operator can type any reference at any time. To see the state machine and lyric detection, run `python -m engine.pipeline` (a simulated service, not your microphone).

`build_bible_db.py` also needs `requests`, which is not yet in `requirements.txt`: `pip install requests`.

### Packaging

A standalone Windows build of the prototype was produced with PyInstaller and ran successfully (about 94 MB executable plus a 461 MB model folder and the databases). Path resolution for source and packaged execution lives in `engine/paths.py`. Build output is not committed, and PyInstaller is not yet declared as a dependency.

---

## Testing

- **Desktop app:** Vitest and `cargo test`, plus the end-to-end self-test above.
- **Python:** `tests/test_lyric_detector.py` (6 tests) and `tests/test_state_machine.py` (8 tests) are real pytest suites, all passing: `pytest tests/test_lyric_detector.py tests/test_state_machine.py -v`.
- `tests/test_detection.py` is a standalone script with no assertions. Run `python tests/test_detection.py` for a precision/recall report. Its 100% / 100% / 0% result is on a short synthetic transcript, not real pulpit speech.
- No coverage yet for `audio_engine.py`, `display_engine.py`, `operator_console.py` or `pipeline.py`.

---

## Reliability and failure modes

- Malformed or impossible scripture references are rejected before reaching the operator. Failed lookups return a clearly bracketed message, never a false verse.
- Detected scripture is never displayed unconfirmed in the prototype's live path.
- No lyric match above threshold means nothing is displayed.
- Missing Bible database: the lookup tells the operator to run the build script instead of crashing.
- In the desktop app, every failed command raises a visible notification and is recorded in the audit log, and native calls that hang time out into a visible error instead of silence.
- Philosophy throughout: prefer a missed or deferred detection over an incorrect one shown to a congregation.

## Security and privacy

All audio is transcribed locally. No audio or transcript data leaves the machine, because nothing in the live path makes a network call. No claims are made about compliance certifications or encryption at rest, because none exist yet. The account backend and license signature in the desktop app are mocks.

---

## Known limitations

- The Python live entry point does not exercise the state machine or lyric detector, and the engine is not connected to the desktop app.
- Detection validation is thin: 100 real sermons are collected, but the only ground truth covers one synthetic file.
- The lyric threshold is untested against real Whisper output from worship.
- The state machine is keyword-based and can stay in the wrong state if a pastor never uses a trigger phrase.
- Most desktop screens are placeholders, and library data is not persisted.
- Scripture in the desktop app falls back to 18 sample verses (with a visible warning) until the Rust Bible lookup is built.
- The AI feed in Live Control is a scripted simulation.
- No CI, and one test file that cannot fail.
- Windows only has been verified.
- No license is declared.

---

## Roadmap

**Next**

- Persistence for library data (SQLite), then the Library, Presentation editor and Planner screens
- Python engine as a local sidecar the desktop app can talk to, with live transcription driving the AI panel
- Replace the browser microphone test with an engine-provided device list and level meter
- Model-pack install into an app-data folder (download plus load from USB or folder)
- Real-data validation: detection against the 100-transcript set, lyric threshold against real Whisper output
- Convert `tests/test_detection.py` into real pytest, add CI, choose a license

**Then**

- Remaining screens (Media, Designer, Templates, Looks, Props, Timers, Macros, Stage layouts)
- Swappable ASR backend (motivated by African-language ASR work in the sibling project Sauti Labs)
- Confidence-scored state classification
- Remote control, OBS/NDI adapters, post-service content, optional cloud sync

---

## Engineering decisions

- **Local speech recognition, not a cloud API:** a cloud dependency fails exactly when connectivity drops mid-service.
- **SQLite:** zero configuration, single file, no service to fail.
- **Regex for scripture, fuzzy matching for lyrics:** references have a rigid grammar. Sung lines filtered through ASR are noisy.
- **Tauri + React instead of Tkinter:** a slide editor, multi-window output and smooth video need a real UI stack, and Tauri keeps memory low on modest laptops.
- **Output state in Rust:** so the audience screen survives a Studio crash.
- **One Command Bus:** so the AI, macros, remote control and keyboard all reach every feature the same way.

## Content and licensing rules

- Only public-domain or openly licensed Bible translations are bundled (KJV). An importer for licensed translations is planned.
- No copyrighted lyrics are bundled. The songs in `data/songs_source` are original test songs.
- Bundled fonts are under the SIL Open Font License.
- Scribe AI matches ProPresenter's capabilities, not its look. No third-party assets, names or UI text are copied.

## Contributing

This is a solo project without an external contribution process yet. If you explore the code, read [`CLAUDE.md`](CLAUDE.md), work on a feature branch, run the checks above before and after a change, and keep `docs/FEATURE_STATUS.md` honest: unfinished features show a visible "Coming soon" state, never a button that silently does nothing.

## Project philosophy

Production software for a live event must keep working when the network doesn't. Everything else (which model, which database, which UI framework) is a detail that can change. Equally important is honesty about the gap between vision and implementation: this part works, this part is built but not connected, this part is still an idea.

## License

No license is currently declared. All rights reserved until one is added.

## Repository

[github.com/benardabuto081/-scribe-ai](https://github.com/benardabuto081/-scribe-ai)

# Scribe AI

**An engineering project exploring autonomous, offline-first church production intelligence - starting with real-time scripture and lyric detection from live speech.**

`Python 3.x` | `Faster-Whisper` | `SQLite` | `Tkinter` | `Status: Active R&D - Core Intelligence Loop`

---

## What Scribe Is

Scribe AI listens to a live church service through a microphone, transcribes speech locally using [Faster-Whisper](https://github.com/SYSTRAN/faster-whisper), and automatically detects when a preacher references a Bible verse - pulling the exact text from a local, offline Bible database and displaying it fullscreen for the congregation, with a human operator able to approve, dismiss, or manually override every detection before it goes on screen.

That loop - **speech -> transcription -> detection -> lookup -> human-gated display** - is implemented, tested, and runs end-to-end offline today. Everything beyond it (lyric detection during worship, service-phase awareness, cloud sync, multi-church deployment) is either an early module already in the codebase, or documented future architecture. This README draws that line explicitly and does not blur it.

Scribe AI is not a company or a commercial product. It is a personal, high-level engineering project - a deliberately hard systems problem (real-time, noisy, low-resource, must-never-fail production software) being used to build genuine autonomous-production and applied-AI engineering depth.

---

## The Problem

Manual church production is fragile in a specific, unglamorous way: someone has to be watching the preacher closely enough to catch a scripture reference and manually pull it up on a slide, in real time, without breaking the flow of the service. That job is usually done by a volunteer, on a laptop that may be years old, with production software that assumes a stable internet connection and a trained operator.

Scribe's founding constraint is that **the moment production software depends on the internet to keep running mid-service, it has failed its actual job.** A dropped connection five minutes before the sermon reaches its most important verse is not an edge case in the environments this project is designed around - it's a Sunday.

---

## Why This Architecture

### Local sovereignty, not "offline-first" as a slogan

Every component in the live path - audio capture, transcription, detection, database lookup, rendering - runs as a local process against local data. There is no network call anywhere in `run_live.py`'s execution path today. This isn't a design aspiration; it's what the current code actually does, verified by reading it, not assumed from documentation.

### AI as a detector, not a decision-maker

Whisper's job is transcription. A regex-based scripture engine's job is pattern recognition against known reference formats. Neither is trusted to put something on a church's screen unsupervised - every AI-detected scripture reference is routed through an **Operator Console** where a human approves or dismisses it before display. This is the project's current answer to "what happens when the AI is wrong": a human stays in the loop, always, for the one component (scripture display) that's wired into the live entry point.

### Modular by necessity, not just by preference

The speech-recognition layer, the detection engines, the state machine, and the display engine are separate, independently importable modules with clean function/class boundaries. This wasn't built for its own sake - a second project, **Sauti Labs**, is now building African-language ASR specifically because Whisper handles African languages poorly, and Scribe's audio layer is expected to eventually plug in a different transcription backend. The module boundary between `AudioEngine` and everything downstream of it is what makes that swap possible without a rewrite - though that abstraction hasn't been built yet (see Roadmap).

---

## Core Capabilities

| Capability | Status | Technology | Notes |
|---|---|---|---|
| Local speech transcription | [DONE] Implemented | Faster-Whisper (`small`, CPU, int8) | 5-second audio chunks, VAD-filtered |
| Scripture reference detection | [DONE] Implemented | Regex pattern matching | Covers all 66 books + common abbreviations, 4 reference formats |
| Offline Bible lookup | [DONE] Implemented | SQLite (KJV, 31,100 verses) | Reference normalization for spoken formats |
| Fullscreen scripture display | [DONE] Implemented | Tkinter | Auto-clears after configurable hold time |
| Human-in-the-loop operator gating | [DONE] Implemented | Tkinter (separate window) | Approve / Dismiss / Manual entry - **live path only covers scripture, not lyrics** |
| Lyric detection (fuzzy match) | [PARTIAL] Implemented, not wired into live entry point | RapidFuzz (`token_set_ratio`) | Exists and is tested; only reachable via the standalone `pipeline.py`, not `run_live.py` |
| Service state machine | [PARTIAL] Implemented, not wired into live entry point | Keyword heuristics, 6 states | Same caveat as above |
| Unified pipeline (state + lyrics + scripture) | [PARTIAL] Exists, simulation-only | - | `pipeline.py`'s runnable demo uses hardcoded text chunks, not live audio |
| Confidence-scored / probabilistic detection | [PLANNED] Planned | - | Current detection is rule-based (regex validity checks, fuzzy-match threshold), not a learned confidence model |
| ASR backend abstraction | [PLANNED] Planned | - | Whisper is currently hardcoded into `AudioEngine`, not behind an interface |
| First-run model download/cache | [PLANNED] Planned | - | Model is currently expected to already exist at a fixed local path |
| Cloud platform layer (auth, sync, planning, analytics, fleet mgmt) | [PLANNED] Planned / architectural direction only | - | No code in this repository implements any of these |

---

## An Important Correction: Live Path vs. Full Pipeline

This is worth stating plainly, because it's easy to assume otherwise from the module list alone.

**`run_live.py`** - the actual live, microphone-driven entry point - currently wires together only:

```
AudioEngine -> scripture_detector -> bible_db -> display_engine -> operator_console
```

It does **not** import or use the service state machine or the lyric detector. Live microphone input today results in scripture detection only, gated by the human operator console.

**`engine/pipeline.py`** (`ScribePipeline`) is a separate, more complete integration that *does* wire together the state machine, lyric detection (gated to the `WORSHIP` state), and scripture detection (gated to every other state). But its own `__main__` block runs against a hardcoded list of test text strings on a timer - it simulates a service, it does not listen to a microphone.

In short: **the state machine and lyric detector are real, tested, working code - they are just not yet connected to live audio.** Unifying `run_live.py` and `ScribePipeline` into one live-audio entry point is the most consequential near-term engineering task in this codebase.

---

## System Architecture

```
                    +----------------------+
                    |   Church Microphone   |
                    +-----------+------------+
                                |
                                v
                    +----------------------+
                    |      AudioEngine       |
                    |  Faster-Whisper (CPU)  |
                    |  5s chunks, VAD-filtered|
                    +-----------+------------+
                                | transcript text
                                v
                +-------------------------------+
                |   [Full pipeline only, not     |
                |    yet in the live entry point]|
                |      ServiceStateMachine       |
                |  PRE_SERVICE / WORSHIP / SERMON|
                |  / PRAYER / ANNOUNCEMENTS       |
                +---------------+-----------------+
                                |
                 +--------------+--------------+
                 v                              v
      +--------------------+         +--------------------+
      | Scripture Detector  |         |   Lyric Detector    |
      |  Regex-based, all   |         |  RapidFuzz fuzzy     |
      |  66 books           |         |  matching, threshold |
      +----------+-----------+         +----------+-----------+
                 |                                |
                 v                                v
      +--------------------+         +--------------------+
      |   Bible DB Lookup    |         |    Song DB Lookup    |
      | SQLite, 31,100 verses|         |  SQLite, local library|
      +----------+-----------+         +----------+-----------+
                 |                                |
                 v                                |
      +--------------------+                     |
      |  Operator Console    |                     |
      |  Approve / Dismiss / |                     |
      |  Manual entry        |  (live path: scripture only)
      +----------+-----------+                     |
                 +---------------+------------------+
                                 v
                    +----------------------+
                    |   ScriptureDisplay     |
                    |  Tkinter fullscreen,   |
                    |  gold=scripture,       |
                    |  blue=lyric            |
                    +----------+------------+
                                |
                                v
                    +----------------------+
                    |     Church Screen      |
                    +----------------------+
```

Every box above exists as real code in this repository. The bracketed note (state machine gating) marks the one piece not yet reachable from a live microphone, as explained above.

---

## Detection Pipeline, Stage by Stage

1. **Audio capture** - `AudioEngine` streams microphone input via `sounddevice`, buffering into 5-second chunks.
2. **Transcription** - Each chunk is transcribed locally by `faster-whisper` (`small` model, `int8` compute, CPU-only, VAD-filtered to skip silence).
3. **Text buffering** - If a chunk yields no detection, the last ~60 characters carry forward as context for the next chunk, so references split across chunk boundaries aren't lost.
4. **(Full pipeline only) State classification** - `ServiceStateMachine.update_from_text()` checks the transcript against keyword phrase lists for four states, transitioning only on a match; unmatched text leaves the state unchanged rather than guessing.
5. **Detection** - Depending on state (in the full pipeline) or unconditionally (in the live entry point): `detect_scripture_references()` runs four regex patterns covering `Book Ch:V`, `Book chapter Ch verse V`, `Book Ch V`, and compressed `Book ChVV` formats, validated against real chapter counts per book to reject impossible references.
6. **Lookup** - Matched references are normalized (spoken formats like "chapter 3 verse 16" or "John 316" are rewritten to `John 3:16`) and queried against the local `bible.db`.
7. **Confidence gating (scripture, live path)** - Every AI-detected reference is sent to the Operator Console, not directly to the display. A human must click Approve before it renders.
8. **Lyric matching (full pipeline only)** - `LyricDetector` compares transcript text against every known song line using RapidFuzz's `token_set_ratio`, returning the best match if its score clears `MATCH_THRESHOLD = 75` - deliberately conservative, chosen to favor missing a line over showing the wrong song.
9. **Presentation** - `ScriptureDisplay` renders fullscreen via Tkinter: gold text for scripture, sky-blue for lyrics, auto-clearing after a configurable hold time.

---

## Scripture Detection

- **Database:** SQLite, `data/bible.db`, single `verses` table (`book`, `chapter`, `verse`, `text`), indexed on `(book, chapter, verse)`.
- **Translation:** King James Version (KJV), sourced from a public JSON dataset at build time.
- **Verified size:** 31,100 verses (counted directly from the database).
- **Matching strategy:** not fuzzy - deterministic regex against a canonical book-name-and-abbreviation map (66 books, common abbreviations like `Jn`, `1 Cor`, `Rev`), plus a chapter-count validity table to reject out-of-range chapters (e.g. rejecting "Genesis 60" since Genesis only has 50 chapters).
- **Confidence handling:** there is no numeric confidence score for scripture detections today - validity is binary (matches a known pattern and a real book/chapter, or it doesn't). The safety layer is the human operator, not a probability threshold.
- **When lookup fails:** `lookup_verse()` returns a bracketed diagnostic string (e.g. `[Could not parse reference: ...]`) rather than throwing - the caller decides what to do with that.

---

## Lyric Detection

- **Database:** SQLite, `data/songs.db` - `songs` and `song_lines` tables, currently holding **6 placeholder songs and 72 lines**, explicitly written as substitute test data (titles like "Mighty God Reigns," "Faithful One") rather than a real licensed church song library.
- **Loader design:** `build_song_db.py` reads every `.txt` file in `data/songs_source/` - first non-blank line as the title, remaining lines as lyrics - and is explicitly designed so a real, licensed song library can replace the placeholder files later with no code changes.
- **Matching:** RapidFuzz `token_set_ratio` against every stored line, in-memory, no persistence between runs.
- **Threshold:** `MATCH_THRESHOLD = 75`. This is **untested against real transcription noise** - the existing unit tests validate it against clean, hand-written text (including one deliberately simulated ASR error), not against actual Whisper output from a real recorded worship session. Treat this threshold as reasonable-but-unvalidated.
- **State gating:** designed to only run during the `WORSHIP` state, so a stray lyric-shaped phrase during a sermon doesn't get matched against the song library - but as noted above, this gating only takes effect in `ScribePipeline`, not in the current live entry point.

---

## Service State Machine

```
PRE_SERVICE -> WORSHIP -> SERMON -> PRAYER -> ANNOUNCEMENTS
```

(`UNKNOWN` also exists as a state value but has no defined transition trigger in the current keyword lists.)

- **Implementation:** pure keyword-phrase matching (e.g. `"let's stand and worship"` -> `WORSHIP`, `"turn with me to"` -> `SERMON`, `"let's pray"` -> `PRAYER`) against lowercased transcript text - no machine learning, no confidence scoring.
- **Design intent (stated in code comments):** the class deliberately knows nothing about audio, Whisper, or the display engine - it only maps text to a state - and is meant to be replaceable by a probabilistic/ML classifier later without changing its public interface.
- **Unmatched text:** state does not change. The machine never guesses a transition without a keyword match.
- **Test coverage:** 8 pytest tests, covering initial state, each transition, no-change-on-unmatched-text, no-duplicate-history-entries on repeated phrases, and a full multi-state service simulation. All passing.

---

## Presentation Layer

`ScriptureDisplay` (Tkinter) opens a black fullscreen window with two stacked labels. `show()` renders scripture in bold gold with a longer hold time (default 8s); `show_lyric()` renders lyrics in sky-blue with a shorter hold time (default 4s), reflecting that sung lines change faster than sermon references. `Escape` exits fullscreen for local testing. A separate `OperatorConsole` window (always-on-top) shows pending AI detections with Approve/Dismiss buttons and a manual text-entry field for direct reference input, independent of what the AI has or hasn't caught.

---

## Offline Architecture

```
Internet unavailable during a live service
              v
run_live.py continues operating normally
              v
Transcription, detection, lookup, and display
all execute against local processes and local data
```

Everything currently wired into `run_live.py` - audio capture, Whisper inference, scripture detection, Bible lookup, rendering, operator controls - runs without a network call. There is no cloud layer in this repository today; the "Tier 2: Cloud-Enabled Platform" described in the project's broader architectural direction (authentication, sync, analytics, fleet management, planning tools) is a documented future direction, not implemented code, and nothing above should be read as describing an existing system.

---

## Data Architecture

| Database | Purpose | Technology | Size (verified) | Bundled? |
|---|---|---|---|---|
| `data/bible.db` | KJV verse lookup | SQLite, single indexed table | 31,100 rows | Yes - built once via `build_bible_db.py`, committed as data |
| `data/songs.db` | Song lyric lines for fuzzy matching | SQLite, 2 tables (`songs`, `song_lines`) | 6 songs, 72 lines (placeholder data) | Yes - rebuildable from `data/songs_source/*.txt` |
| Whisper model (`faster-whisper-small`) | Local speech recognition | CTranslate2 model files | Not stored in this repository | No - expected at a local path outside the repo; distribution mechanism is currently manual, not automated |

`data/raw_transcripts/` and `data/transcripts/` also hold a substantial collection of real sermon material - see **Known Limitations** for why this hasn't yet translated into broad validation.

---

## Repository Structure

```
scribe-ai/
+-- engine/
|   +-- audio/
|   |   +-- audio_engine.py         # Mic capture + local Whisper transcription
|   +-- bible/
|   |   +-- bible_db.py             # Verse lookup + reference normalization
|   |   +-- build_bible_db.py       # One-time KJV DB builder
|   +-- detection/
|   |   +-- scripture_detector.py   # Regex-based reference detection, all 66 books
|   |   +-- vtt_parser.py           # Cleans YouTube .vtt captions into plain sermon text
|   +-- display/
|   |   +-- display_engine.py       # Tkinter fullscreen renderer (scripture + lyric modes)
|   |   +-- operator_console.py     # Human approve/dismiss/manual-entry gate
|   +-- songs/
|   |   +-- song_db.py              # Song DB query interface
|   |   +-- build_song_db.py        # Builds songs.db from data/songs_source/*.txt
|   |   +-- lyric_detector.py       # RapidFuzz-based lyric matching
|   +-- state/
|   |   +-- service_state_machine.py # Keyword-based service phase tracking
|   +-- paths.py                    # Dual-mode path resolution (source vs. packaged .exe)
|   +-- pipeline.py                 # Full integration: state + lyrics + scripture (simulation-driven demo)
+-- data/
|   +-- bible.db
|   +-- songs.db
|   +-- songs_source/                # 6 placeholder song .txt files
|   +-- raw_transcripts/             # 100 real sermon .vtt caption files (YouTube-sourced)
|   +-- transcripts/                 # 101 cleaned plain-text transcripts (incl. 1 synthetic validation file)
|   +-- ground_truth/                # 1 ground-truth file, for the synthetic sermon_01.txt only
+-- tests/
|   +-- test_detection.py           # Standalone precision/recall script - NOT pytest, no asserts
|   +-- test_lyric_detector.py      # Real pytest, 6 tests, all passing
|   +-- test_state_machine.py       # Real pytest, 8 tests, all passing
+-- run_live.py                     # Live entry point (scripture-only, mic-driven)
+-- requirements.txt
+-- .gitignore
```

---

## Installation

### Requirements

- **OS:** Developed and tested on Windows 10; no OS-specific code beyond Tkinter and `sounddevice`, both cross-platform, but only Windows has been verified.
- **Python:** 3.x (project developed against 3.14.x locally; no version pin currently enforced in code).
- **Hardware:** No GPU required - Whisper runs on CPU with `int8` compute. A working microphone input device is required for live use.
- **Model:** The `faster-whisper-small` model must be present locally (see Model Setup below) - it is not fetched automatically.

### Setup

```bash
git clone https://github.com/benardabuto081/-scribe-ai.git
cd -scribe-ai
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

> **Note:** `requirements.txt` currently lists `regex`, `rapidfuzz`, `sounddevice`, `numpy`, and `faster-whisper`. `build_bible_db.py` additionally requires `requests`, which is not yet listed - install it manually (`pip install requests`) if you need to rebuild `bible.db` from source.

### Building the local databases (first-time setup)

```bash
python -m engine.bible.build_bible_db   # downloads KJV JSON once, builds data/bible.db
python -m engine.songs.build_song_db    # builds data/songs.db from data/songs_source/*.txt
```

Both are one-time, internet-required steps to *build* the local database. Once built, both databases are queried entirely offline.

---

## Model Setup

Model distribution is currently manual: place the `faster-whisper-small` model files in a `models/faster-whisper-small` folder relative to the project root (or relative to the `.exe`, when packaged - see `engine/paths.py`). There is no automated download-on-first-run mechanism yet; this is a known, explicitly planned gap (see Roadmap).

---

## Running Scribe

```bash
python run_live.py
```

Expect: a fullscreen black display window opens, followed by a smaller "Operator Console" window. The console shows "Listening..." while the microphone streams into Whisper in 5-second chunks. When a scripture reference is detected in the transcript, it appears in the console for approval - clicking **Approve** renders it on the main display; **Dismiss** discards it. The operator can also type a reference directly into the manual-entry field at any time, independent of detection.

> Live audio currently only exercises the scripture-detection path (see "Live Path vs. Full Pipeline" above). To see the state machine and lyric detection in action today, run `python -m engine.pipeline` instead - this runs a simulated service using hardcoded text, not your microphone.

---

## Example Usage

```
Speaker says:
"Turn with me to John chapter three verse sixteen."

Scribe:
-> Transcribes the audio locally via Faster-Whisper
-> Matches "John chapter 3 verse 16" against the reference patterns
-> Normalizes it to "John 3:16"
-> Looks up the verse text in the local Bible database
-> Sends it to the Operator Console for approval
-> On approval, renders it fullscreen in gold text
```

---

## Configuration

| Variable | Location | Default | Purpose |
|---|---|---|---|
| `chunk_seconds` | `AudioEngine.__init__` | `5` | Length of audio buffered before each transcription pass |
| `sample_rate` | `AudioEngine.__init__` | `16000` | Microphone sample rate (Whisper's expected rate) |
| `MATCH_THRESHOLD` | `lyric_detector.py` | `75` | Minimum RapidFuzz score to accept a lyric match (unvalidated against real ASR noise - see Lyric Detection) |
| `display_seconds` | `ScriptureDisplay` | `8` | How long a scripture stays on screen |
| `lyric_display_seconds` | `ScriptureDisplay` | `4` | How long a lyric line stays on screen |
| `LOCAL_MODEL_PATH` | `audio_engine.py` | `<base_dir>/models/faster-whisper-small` | Where the Whisper model is expected to live |
| `DB_PATH` (Bible) | `bible_db.py` | `<base_dir>/data/bible.db` | Resolved via `paths.get_data_path()` for source vs. packaged execution |

---

## Testing

Current testing maturity is mixed and should be represented honestly:

- **`tests/test_lyric_detector.py`** and **`tests/test_state_machine.py`** are real pytest suites - 14 tests total, all currently passing, run with:
  ```bash
  pytest tests/test_lyric_detector.py tests/test_state_machine.py -v
  ```
- **`tests/test_detection.py`** is **not** a pytest suite. It's a standalone script with no assertions - it prints a precision/recall/false-positive-rate report and exits. Run it directly:
  ```bash
  python tests/test_detection.py
  ```
  Its most recent run against `data/transcripts/sermon_01.txt` scored **100% precision, 100% recall, 0% false-positive rate** - but that file is a short, hand-written synthetic transcript with nine clean, unambiguous references, not one of the real sermon recordings in the dataset. Only one ground-truth file exists in the repository (`sermon_01_ground_truth.txt`), matching only that synthetic file.
- **No coverage yet** for `audio_engine.py`, `display_engine.py`, `operator_console.py`, `bible_db.py`'s lookup edge cases, or `pipeline.py`'s integration behavior.

---

## Performance

Formal performance benchmarking has not yet been established - no measured transcription latency, memory footprint, or startup-time data currently exists in this repository. The one available data point is the precision/recall result above, which reflects detection accuracy on a single synthetic transcript, not runtime performance.

---

## Reliability & Failure Modes

- **Low-confidence or malformed scripture matches:** rejected before reaching the operator - `is_valid_reference()` checks the chapter number against real per-book chapter counts, and `lookup_verse()` returns a clearly bracketed error string rather than a false verse when parsing fails.
- **Detected but unconfirmed scripture:** never displayed automatically. It waits in the Operator Console until a human approves or dismisses it.
- **No lyric match above threshold:** `LyricDetector.detect()` returns `None`; nothing is displayed, and no error is raised.
- **Internet unavailable:** no effect on the live path - nothing in `run_live.py`'s execution depends on network access.
- **Missing Bible database file:** `lookup_verse()` returns a diagnostic string telling the operator to run the build script, rather than crashing.
- **Missing song database file:** `get_all_song_lines()` raises `FileNotFoundError` with an explicit instruction to run `build_song_db.py` - this is a hard failure at `LyricDetector` construction time, not a silent one.
- **Unrecognized service-state text:** the state machine leaves the current state unchanged rather than guessing a transition.

The consistent underlying philosophy in the code that exists today: **prefer a missed or deferred detection over an incorrect one shown to a congregation.**

---

## Security & Privacy

All audio processed by `AudioEngine` is transcribed locally via Faster-Whisper - no audio or transcript data leaves the machine in the current implementation, since there is no network call anywhere in the live path. No claims are made here about compliance certifications, encryption at rest, or data-handling policy, because none currently exist in this codebase.

---

## Current Project Status

| Area | Status |
|---|---|
| Local speech transcription | [DONE] Working |
| Scripture detection + lookup | [DONE] Working, validated only on synthetic data |
| Human operator gating (scripture) | [DONE] Working |
| Lyric detection | [PARTIAL] Working in isolation, not wired into live audio |
| Service state machine | [PARTIAL] Working in isolation, not wired into live audio |
| Unified live pipeline (state + lyrics + scripture, mic-driven) | [MISSING] Not yet built |
| Real-world detection validation (100 collected sermons) | [MISSING] Not yet done - only 1 synthetic ground-truth file exists |
| Lyric threshold validation against real ASR noise | [MISSING] Not yet done |
| Automated test suite (pytest) | [PARTIAL] Partial - 2 of 3 test files are real pytest; 1 is a non-asserting script |
| Packaging (.exe) | [PARTIAL] Path-resolution logic exists (`paths.py`); PyInstaller not in `requirements.txt` |
| Model distribution | [MISSING] Manual only - no first-run download/cache mechanism |
| ASR backend abstraction | [MISSING] Not yet built - Whisper is hardcoded into `AudioEngine` |
| Cloud platform layer | [PLANNED] Planned / architectural direction only - no implementation |
| License | [MISSING] None declared |

---

## Known Limitations

- **The live entry point doesn't exercise the full pipeline.** This is the single most important thing to understand about the current state of the project (see "Live Path vs. Full Pipeline" above).
- **Detection validation is thin relative to available data.** 100 real sermon transcripts have been collected and cleaned (from real African preachers, via YouTube captions) - but only one ground-truth file exists, and it validates against a separate, synthetic, hand-written transcript, not the real dataset. The strong precision/recall numbers currently in this repo do not yet reflect performance on real, messy pulpit speech.
- **Lyric matching threshold is unvalidated against real transcription noise.** `MATCH_THRESHOLD = 75` was chosen deliberately conservatively, but tested only against clean text and one simulated error, not real Whisper output from a recorded worship session.
- **The service state machine is purely keyword-based.** It has no resilience to phrasing outside its hardcoded phrase lists, and no confidence scoring - a real sermon that never uses one of the trigger phrases could stay in the wrong state indefinitely.
- **The song library is placeholder data**, not a real, licensed church song set - six generic worship-style songs, clearly written as test fixtures.
- **One test file isn't a real test.** `tests/test_detection.py` produces useful output but has no assertions and won't fail CI even if detection quality regresses.
- **No CI/CD.** Tests are run manually; nothing currently blocks a broken commit from being pushed.
- **No license.** The repository currently has no declared license.
- **Packaging dependency gaps.** `requirements.txt` omits `requests` (used by `build_bible_db.py`) and doesn't declare PyInstaller, despite `paths.py` being explicitly written to support a packaged `.exe` build.
- **Windows-verified only.** No cross-platform testing has been done, despite using cross-platform libraries.

A technically honest account of these gaps is more useful here than smoothing over them - most represent clear, well-scoped next tasks rather than deep design flaws.

---

## Roadmap

Organized by what's actually next given the state above, not by aspirational phase names:

### Near-term - closing the gap between what's built and what's live
- Unify `run_live.py` and `pipeline.py` into a single live-audio entry point that actually exercises the state machine and lyric detector, not just scripture detection
- Convert `tests/test_detection.py` into a real pytest suite
- Validate the lyric `MATCH_THRESHOLD` against real Whisper output, not clean text
- Run scripture detection validation against the real 100-transcript dataset, not only the synthetic sermon_01 file
- Add `requests` to `requirements.txt`; formally declare PyInstaller as a build dependency
- Choose and declare a license

### Mid-term - production hardening
- Abstract the ASR backend behind a swappable interface (motivated directly by a sibling project, Sauti Labs, building African-language ASR)
- Replace manual model placement with a first-run download-and-cache mechanism, with a documented offline/USB fallback for install-time zero-connectivity scenarios
- Expand automated coverage to `audio_engine.py`, `display_engine.py`, `operator_console.py`, and `bible_db.py`

### Long-term - architectural direction (not yet implemented)
- Replace keyword-heuristic state detection with a confidence-scored classifier, without breaking the existing `ServiceStateMachine` interface
- A cloud-enabled platform layer (authentication, service planning, sync, analytics, fleet management) - explicitly designed to remain optional to and never a dependency of the live production path
- Post-service intelligence (transcripts, summaries, content generation)
- Multi-language support via Sauti Labs ASR integration

---

## Engineering Decisions

**Why local speech recognition instead of a cloud API?**
A cloud STT dependency would make the live path fail exactly when reliability matters most - mid-service, if connectivity drops. Faster-Whisper on CPU trades some accuracy and latency for a hard reliability guarantee.

**Why SQLite instead of a client-server database?**
Zero-configuration, single-file, no separate service to run or fail - appropriate for a single-machine, offline-first application with modest data volume (tens of thousands of rows, not millions).

**Why regex-based scripture detection instead of an ML model?**
Bible references follow a small, well-defined set of spoken formats. A deterministic pattern-matcher is explainable, debuggable, and doesn't require training data - appropriate for a problem this constrained, at this stage.

**Why fuzzy matching for lyrics but not for scripture?**
Scripture references have a rigid grammar (`Book Chapter:Verse`) that regex handles well. Sung lyrics, filtered through live ASR, are far noisier - RapidFuzz's tolerance for near-misses is suited to that noise in a way regex isn't.

**Why gate scripture display behind a human operator, but not (yet) lyric display?**
Displaying the wrong Bible verse on a church screen is a more consequential mistake than displaying the wrong line of a familiar worship song for a few seconds - the current design reflects that asymmetry, though it's worth noting this is an implicit consequence of what got wired into `run_live.py`, not a documented policy decision.

**Why keep the state machine's public interface stable even though its internals are "basic"?**
So a future, smarter implementation (confidence-scored or ML-based) can be dropped in without touching `pipeline.py` or anything else that depends on `get_current_state()` / `update_from_text()`.

---

## Contributing

This is currently a solo engineering project without an established external contribution process. If you're exploring the code:

1. Fork and clone the repository
2. Create a virtual environment and install `requirements.txt` (plus `requests`, per the note above)
3. Build the local databases (`build_bible_db.py`, `build_song_db.py`)
4. Run the real test suites (`pytest tests/test_lyric_detector.py tests/test_state_machine.py`) before and after any change
5. Open an issue or pull request describing the change and why

---

## Project Philosophy

Scribe AI is built around a single non-negotiable idea: **production software for a live event must keep working when the network doesn't.** Everything else - which AI model, which database, which UI framework - is a detail that can change. That constraint is the one thing that shouldn't.

Equally important is honesty about the gap between vision and implementation. It would be easy to describe the full autonomous-production platform this project is aimed at as though it already existed. It doesn't, yet - and a codebase (and a README) that pretends otherwise is worse than one that says plainly: this part works, this part is built but not connected, this part is still just an idea.

---

## License

No license is currently declared in this repository.

---

## Repository

[github.com/benardabuto081/-scribe-ai](https://github.com/benardabuto081/-scribe-ai)

# Scribe AI — Product Specification

Goal: ProPresenter-class capability, a sleek modern design, and an AI that can drive every feature through the Command Bus. This document lists everything to build. Build order is in section 12.

---

## 1. Design system

**Feel:** sleek, calm, modern, confident. Dark-first with a light theme. Glass-like layered surfaces, soft shadows, thin 1 px borders, generous spacing, subtle motion.

- **Tokens:** color (brand from logo, neutral scale, semantic: success/warn/danger/info, state colors for AI), typography scale, spacing (4 px grid), radii, elevation, motion (fast 120 ms, base 200 ms, slow 320 ms, one easing curve).
- **Typography:** Inter (UI), a display face for headings. Bundled locally.
- **Components:** Button, IconButton, Input, Select, Slider, Switch, Tabs, Segmented, Dialog, Drawer, Popover, Tooltip, Toast, ContextMenu, CommandPalette, Table, Tree, Thumbnail grid, Timeline, Meter, Chip/Badge, Card, Split pane (resizable, persistent), Color picker, Font picker, Gradient editor, Shortcut-key recorder, Empty state, Skeleton.
- **Themes:** dark (default), light, high-contrast. Density: comfortable / compact.
- **Motion:** purposeful only. Respect reduced-motion.

## 2. Windows and layout

- **Studio window:** left rail navigation, top status bar, main workspace, optional right inspector, bottom status strip. Command palette on `Ctrl+K`.
- **Status bar (always visible):** service state chip (Pre-service / Worship / Sermon / Prayer / Announcements), AI mode switch (Manual / Assist / Auto) and confidence, mic level meter, online/offline, LIVE indicator, active Look, clock.
- **Output windows:** Audience, Stage (confidence monitor), Stream/Alpha. Each is its own window, assignable to any display, with test patterns and edge-blend/arrangement support for multi-screen and LED walls.

## 3. Authentication and onboarding

Screens: Splash and license check (never blocks offline), Sign in (email/password, Google, **Continue in Local Mode**), Create account, Forgot/reset password, Church workspace create/join, Role pick.

**First-run wizard** (one step per screen, progress indicator, skippable where safe): church profile and logo, languages and Bible translations, hardware check (RAM, CPU, displays, mic), audio source setup with live level meter and "say something" test, model pack install (with **load from USB/folder**), display assignment, import songs and media, invite team, finish with a guided practice service.

## 4. Studio modules (everything below must exist)

### 4.1 Home
Next service countdown, system health (audio, displays, engine, storage), quick actions (New service, Open last, Start live), last service recap, recent presentations, tips.

### 4.2 Library
- Libraries (folders) of Presentations; tags, colors, favorites, recents, search, sort, bulk actions.
- Thumbnails view and list view. Duplicate, rename, move, delete with trash and restore.
- Presentation metadata: title, author, tags, copyright/CCLI-style fields, language.

### 4.3 Presentation editor (slide editor)
- Slides organized in **Groups** (Verse, Chorus, Bridge, Intro, Outro, Tag, Pre-chorus, Interlude, Sermon point, Scripture, Announcement, custom) with group colors.
- **Arrangements:** reorder and repeat groups without duplicating slides; multiple arrangements per presentation.
- Canvas editor: text boxes, shapes, images, video, live video, web view, ticker, clock/timer, tables, line/arrow, groups of objects, layers panel, z-order, lock/hide, align and distribute, snap and guides, rulers, grid, rotate, flip, opacity, shadow, outline, corner radius, blend modes, masks, crop, chroma key, color adjust (brightness, contrast, saturation, blur).
- Text: font, size, weight, tracking, line spacing, alignment, case, auto-fit, shrink-to-fit, columns, bullets, text fill (solid, gradient, image), stroke, shadow, glow, per-range styling, find/replace, spellcheck (en, sw).
- **Reflow:** auto-split long lyrics or scripture into slides by line count.
- Slide notes, per-slide transition, per-slide actions/cues, slide labels and colors, slide duration/auto-advance.
- **Slide master / layouts** and per-slide Look override.
- Undo/redo with history, copy/paste between presentations, multi-select, keyboard-first editing.
- Import: text, PDF, PowerPoint (.pptx), images, OpenSong/EasyWorship/OpenLP lyrics formats where feasible, Scribe bundles. Export: PDF, images, text, `.scribe` bundle.

### 4.4 Playlists / Service plan (Planner)
- Playlists with ordered items (presentation, song, scripture, media, audio, video input, announcement, message, macro) and sub-playlists/headers.
- **Service templates** (Sunday service, midweek, youth, funeral, wedding, crusade, vigil, communion, baptism).
- Timeline view with item durations and running total, service start time and countdown.
- Volunteer assignments per item and per role, availability, notifications.
- Duplicate last week, drag items from library, sermon outline attached to plan, plan feeds the AI's expectations (expected songs, scriptures, order).
- Print/PDF run sheet.

### 4.5 Live Control (the operating screen)
Three-pane layout, resizable and saved per user:
- **Left:** playlist queue and quick search (songs, scripture, media, props).
- **Center:** Preview and Program monitors, slide grid of the current presentation with group colors, **Take / Next / Previous / Clear / Blackout / Logo hold** buttons, slide-cue indicator, transitions, per-output clear (slide, media, props, messages, audio) layers.
- **Right:** **AI panel** with live transcript, detection cards (scripture, lyric, state change) with confidence and explanation, **Approve / Dismiss**, autonomy mode switch, Pause AI, Undo last AI action, manual entry box that accepts any scripture format.
- Bottom: audio meter, timers, props, messages, macros quick-bar.
- Fully keyboard operable, configurable shortcuts.

### 4.6 Looks, Themes and Templates
- **Looks:** saved screen configurations (which layers show: slide, media, props, messages, stage layout, background) applied per output, one-click switch with transitions.
- **Themes:** reusable style sets (fonts, colors, backgrounds, text styles, layouts) applied to a presentation or whole library; theme editor with live preview.
- **Template system:** every template type in section 5 is browseable in a **Template Gallery** with search, tags, favorites, preview, "use", "duplicate and edit", import/export, and a user-created templates area.

### 4.7 Props
Persistent overlay objects shown above slides: lower thirds, logos/watermarks, social handles, giving/M-Pesa info, QR codes, live clock, countdown, ticker, bug. Triggerable, with entrance/exit animation, scheduled show/hide, per-output assignment.

### 4.8 Messages
On-screen messages with tokens (e.g. "Parent of {name}, please come to nursery"), message templates, show/hide with timers, nursery alerts, per-output control, history.

### 4.9 Timers and Clocks
Countdown to time, countdown for duration, elapsed, clock (12/24 h), multiple concurrent timers, timer styles, overrun behavior (flash, color change), start/stop/reset/add-time controls, show on audience and/or stage.

### 4.10 Media bin
Images, video, motion backgrounds, GIF, audio. Folders, tags, search, thumbnails (cached), metadata, trim in/out, loop, fit modes (fill/fit/stretch), per-item playback options, playlist of media, relink missing files, transcoding/proxy for weak hardware, drag to slide/background/playlist.

### 4.11 Audio bin
Music and sound playlists, crossfade, fade in/out, volume, loop, cue points, output device selection, ducking when AI is "hearing" the pastor, per-item "play on trigger". Audio that plays from slide/cue.

### 4.12 Live video and capture
Camera/capture-card inputs as sources, preview, use as slide background or full layer, picture-in-picture, chroma key, recording of program output, NDI in/out later, RTMP streaming later.

### 4.13 Transitions and effects
Cut, fade, dissolve, push, slide, wipe, zoom, blur, custom duration and easing; media loop and end behaviors; text builds (line-by-line, word-by-word); slide-to-slide auto transitions.

### 4.14 Macros, Actions, Cues and Triggers
- **Actions** attached to slides/items/buttons: change Look, play media, start timer, show prop/message, run macro, send OBS/HTTP/MIDI/OSC command, change audio, go to next item, delay.
- **Macros:** ordered or parallel action lists with delays, triggered by button, shortcut, MIDI, remote or AI.
- **Triggers:** on slide enter/exit, on timer end, on service-state change, on schedule, on AI detection.
- Macro editor with test button. All implemented on the Command Bus.

### 4.15 Timeline
Timeline editor for a presentation: tracks for media, audio, text builds, actions; scrub, markers, snap, playback sync with audio/video, trigger cues at times.

### 4.16 Scripture (Bible module)
- Translations manager (public-domain bundled; importer for licensed), multiple translations side by side, search by reference and by keyword, any reference format ("Mat 316", "John chapter 3 verse 16", Kiswahili book names), ranges, verse lists, cross references, recent and favorites.
- Display options: reference position, verse numbers, multi-verse layout, auto-split long passages, per-translation fonts, bilingual layout.
- Scripture templates (see section 5). "Send to playlist", "show now".

### 4.17 Songs
- Song library with search (title, lyrics, author, theme), tags, key/BPM/CCLI-style number, languages, arrangement, notes, usage count.
- Song editor: section-based editing (verse/chorus/bridge), auto-format paste, auto-reflow into slides, chords (optional), translation line (bilingual), per-song theme.
- Importers: text/folder import, paste lyrics, licensed-library connectors later. **Never bundle copyrighted lyrics.**
- **Song usage reporting** (export for licensing reports), recents, "most used".
- Feeds the AI lyric index (engine rebuilds `songs.db` from the library automatically).

### 4.18 Stage display
Stage layouts: current slide, next slide, notes, clock, timers, messages, service-state, chord chart, AI transcript line. Layout editor, multiple stage screens, per-person layouts, color and size options.

### 4.19 Screens and Outputs
Detect displays, assign Audience / Stage / Stream / Alpha, resolution and scaling, rotate, test patterns and identify-screen, **multi-screen arrangement with edge blending and LED-wall tiling**, per-output Look, output health indicators, safe-area guides.

### 4.20 Director (livestream and production automation)
Scenes, sources (camera, slides, video, browser), overlays, lower thirds, transitions, OBS/vMix/ATEM/NDI adapters, camera mapping, recording, stream destinations, AI camera/scene suggestions. Phased late; screens designed now.

### 4.21 Remote control and API
- Web remote (phone/tablet on local network): slide control, clear, playlist, messages, timers, with PIN and roles. Works with no internet.
- Stage companion view in browser.
- Local HTTP/WebSocket API and OSC/MIDI mapping for every command. API docs generated from the command registry.

### 4.22 AI Brain
Service state monitor and timeline, confidence thresholds per detector, custom vocabulary and names, accent/language profiles, ASR backend selector (Whisper now; pluggable for Sauti Labs), correction log (every operator correction becomes learning data stored locally), detector toggles (scripture, lyrics, prayer, offering, announcements), model manager (install, update, load from USB), diagnostics (latency, word error estimates), privacy controls (no raw audio leaves the device).

### 4.23 Post-Service
Transcript (timestamped, searchable), sermon summary, key points, scripture list, study guide, devotional, WhatsApp newsletter, social clips (9:16 with captions), highlight timestamps, searchable archive, one-click export/share, review/approve before send.

### 4.24 Analytics and Reports
Service timing, song usage, scripture frequency, AI detection accuracy and correction trends, operator activity, trends over weeks.

### 4.25 Team and Permissions
Roles (Admin, Operator, Planner, Designer, Viewer), invites, per-role command permissions, activity/audit log, volunteer roster and scheduling.

### 4.26 Search
Global search (Ctrl+K and Ctrl+F): presentations, songs by lyric text, scripture, media, templates, commands, settings.

### 4.27 Settings
General, appearance (theme, density, language), audio (input device, gain, meter, noise handling), displays, shortcuts editor, MIDI mapping, AI, languages and translations, storage and media paths, backup and restore, cloud sync, updates, licensing/account, network and remote, diagnostics (logs bundle, system report), advanced (safe mode, reset).

### 4.28 Help
Guided tour, searchable docs, shortcut cheat-sheet, keyboard overlay, "report a problem" with log bundle, what's new.

## 5. Template catalog (build all of these as real, editable templates)

Every template is a data-driven asset: JSON definition plus preview thumbnail, tagged, themable, localizable, importable and exportable.

1. **Backgrounds:** solid, gradients (static and animated), mesh/aurora gradients, textures (paper, linen, concrete, grain), light leaks, bokeh, particles, abstract shapes, nature-inspired procedural scenes, geometric patterns, cross/dove/flame/crown motifs (original vector art), seasonal sets (Christmas, Advent, Good Friday, Easter, Pentecost, Harvest, Thanksgiving, New Year, Independence/National days, Mother's/Father's Day, Youth Sunday, Missions), motion loops (slow gradients, floating particles, waves) with a low-power static fallback.
2. **Thumbnail templates:** sermon series art, single-sermon cover, YouTube/stream thumbnails (16:9), social posts (1:1, 4:5), stories/reels covers (9:16), event flyers, WhatsApp status graphics, podcast cover.
3. **Font templates:** curated pairings (heading + body) in bundled OFL fonts, plus text style presets (bold title, elegant serif, modern sans, script accent, all-caps impact, minimal), size presets for lyrics, scripture and announcements, readability-checked.
4. **Text style presets:** outline, shadow, glow, gradient fill, highlight bar, quote style, reference style.
5. **Song/lyric themes:** centered lyrics, bottom-third lyrics, left-aligned, two-line, bilingual stacked, translucent panel, big-type, with and without song title/author/CCLI line.
6. **Scripture themes:** classic, modern, split (reference left), lower-third verse, bilingual, big-reference, verse-of-the-day.
7. **Lower thirds:** speaker name and title, song title, scripture reference, announcement tag, offering/giving, social handles, guest intro, translator credit, news-style bug, animated variants.
8. **Announcement templates:** single event, multi-event list, upcoming week, volunteer call, youth/children, prayer meeting, fundraising, giving thermometer, birthday/anniversary, new members, funerals/condolences, baby dedication.
9. **Countdown and pre-service:** countdown screens, welcome loops, "service starting soon", pre-service slideshow, house-rules, connect cards.
10. **Sermon templates:** series bumper, title slide, point slide (numbered), quote, key-verse, illustration/image, fill-in-the-blank, summary, call to action, notes slide.
11. **Giving and connect:** M-Pesa paybill/till, bank details, QR code, text-to-give, website/social, WiFi info, next steps, visitor welcome.
12. **Special service moments:** communion, baptism, dedication, wedding, funeral, prayer, altar call, testimony, offering, benediction, worship intro, blackout/logo hold.
13. **Stage layouts:** lyrics + next, scripture + clock, sermon notes, drummer/band layout, pastor timer layout, minimal.
14. **Playlist/Service templates:** see 4.4.
15. **Message templates:** nursery alert, lost item, parking, emergency, welcome.
16. **Video intro/outro bumpers:** short animated title cards generated procedurally (no copyrighted footage).
17. **Print and share:** run sheet, bulletin, newsletter, WhatsApp newsletter, devotional card, social caption pack.
18. **Looks presets:** Worship, Sermon, Scripture, Announcements, Prayer, Offering, Blackout, Logo, Countdown, Stream.

Provide at least 8 high-quality templates per category initially, designed to a consistent visual language, then grow the catalog.

## 6. AI layer

**Capabilities** (each implemented as commands the AI can call): detect and show scripture, detect and show lyrics, advance slides while a song is sung, track service state, trigger Looks and props by state, start timers, run macros, suggest next item from the plan, name/lower-third suggestions, natural-language command bar ("show John 3 verses 16 to 18", "next song", "clear", "start the offering timer"), optional voice commands with a wake phrase, plan deviation handling (pastor goes off-script), learn corrections and church vocabulary, code-switching tolerance (English, Kiswahili, Dholuo and others as models allow), post-service content generation.

**Control model:** Manual, Assist (default), Auto. Confidence-gated. Pause AI hotkey. Undo last AI action. Every action explained. Per-command AI permissions (e.g. AI may show scripture but not blackout the screen unless allowed).

**Engine integration:** sidecar API exposes: transcript stream, detections with confidence, service-state events, library index sync (songs, plan), health and latency. The UI never calls Whisper directly.

## 7. Data, offline, sync, licensing

- SQLite schema with migrations; autosave every change; crash recovery restores last session; versioned backups.
- Local Mode first. Cloud sync (optional) with conflict resolution, queue-when-offline, selective sync. Team workspaces.
- Signed license, cached, long offline grace, device list. Auto-update via signed releases with rollback.

## 8. Reliability

Output isolation, watchdog for sidecar and outputs, safe mode (disable AI and plugins), structured logs, in-app log viewer and exportable bundle, "service in progress" lock that blocks updates and heavy tasks, preflight checklist before going live (audio, displays, plan, engine, storage, battery/power).

## 9. Accessibility and i18n

English and Kiswahili; full keyboard operation; visible focus; high-contrast theme; scalable UI text; screen-reader labels for Studio controls; optional large-text operator mode.

## 10. Extensibility

Plugin API (later) over the Command Bus and event stream: translation, sign-language avatar, donation overlays, lighting control, signage.

## 11. Non-goals for now

Native mobile apps, macOS/Linux builds (keep code portable), cloud-hosted AI inference as a requirement, full broadcast switcher replacement.

## 12. Phases and exit criteria

- **Phase A, Foundation and design:** scaffold, design system, shell, every screen above as high-fidelity mock with seeded data, Command Bus with registry and audit log, Audience and Stage output windows rendering a slide from state, sidecar health connection, `FEATURE_STATUS.md`.
- **Phase B, Core presenter:** persistence (SQLite), Library, Presentation editor, Groups/Arrangements, Playlists, Live Control, Looks, Themes, Props, Messages, Timers, Media bin, Scripture, Songs, Screens/Outputs, keyboard shortcuts. Exit: run a full service without AI.
- **Phase C, AI integration:** sidecar wiring, transcript feed, scripture and lyric detection through commands, service state, autonomy modes, AI panel, corrections, AI Brain screen. Exit: shadow-mode and Assist-mode service validated.
- **Phase D, Templates and design depth:** full Template Gallery and all catalog categories, Designer polish, Timeline, Macros/Triggers, Stage layouts, audio bin.
- **Phase E, Production:** Director, remote control and API, MIDI, NDI/OBS adapters, recording and streaming.
- **Phase F, Cloud and post-service:** accounts, sync, team, updates, post-service content, analytics, installer and offline distribution pack.

Each phase ends with typecheck, lint, tests passing, `FEATURE_STATUS.md` updated, and a packaged build smoke test.

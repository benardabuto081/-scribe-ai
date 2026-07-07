# engine/pipeline.py
# Scribe AI — Unified Pipeline
# Connects: Detection Engine → Bible Database → Display Engine
# Tracks Service State. Scripture detection active outside WORSHIP.
# Lyric detection + display active only during WORSHIP.

import threading
import time
from engine.detection.scripture_detector import detect_scripture_references
from engine.bible.bible_db import lookup_verse
from engine.display.display_engine import ScriptureDisplay
from engine.state.service_state_machine import ServiceStateMachine, ServiceState
from engine.songs.lyric_detector import LyricDetector


class ScribePipeline:
    def __init__(self, display_seconds: int = 8, lyric_display_seconds: int = 4):
        self.display_seconds = display_seconds
        self.display = ScriptureDisplay(
            display_seconds=display_seconds,
            lyric_display_seconds=lyric_display_seconds
        )
        self.state_machine = ServiceStateMachine()
        self.lyric_detector = LyricDetector()

    def process_text(self, text: str):
        """
        Takes a block of text:
        1. Updates the Service State Machine
        2. If WORSHIP: runs lyric detection and displays confident matches
        3. If not WORSHIP: runs scripture detection -> lookup -> display
        """
        previous_state = self.state_machine.get_current_state()
        self.state_machine.update_from_text(text)
        current_state = self.state_machine.get_current_state()

        if current_state != previous_state:
            print(f"[STATE] Transitioned: {previous_state.value} -> {current_state.value}")
        else:
            print(f"[STATE] No change (still {current_state.value})")

        # --- WORSHIP: lyric detection and display ---
        if current_state == ServiceState.WORSHIP:
            match = self.lyric_detector.detect(text)
            if match:
                print(f"[LYRIC] Detected '{match['song_title']}' "
                      f"(line {match['line_number']}, score {match['score']}): "
                      f"\"{match['line_text']}\"")
                self.display.show_lyric(match['song_title'], match['line_text'])
            else:
                print("[LYRIC] No confident song match.")
            return

        # --- Non-WORSHIP: scripture detection (unchanged) ---
        references = detect_scripture_references(text)

        if not references:
            print("No scripture references detected.")
            return

        for ref in references:
            reference_str = ref["reference"]
            verse_text = lookup_verse(reference_str)
            print(f"Displaying: {reference_str}")
            self.display.show(reference_str, verse_text)
            time.sleep(self.display_seconds + 1)

    def run(self, test_chunks: list = None, chunk_delay: float = 1.0):
        """
        Starts the display engine.
        If test_chunks is provided, processes each chunk sequentially
        after a short delay, simulating live transcript segments arriving
        one at a time.

        chunk_delay: seconds to wait between chunks. Use ~1.0 for spoken
            sermon-style text, ~3.5 for sung worship lyrics (matches
            realistic singing pace).
        """
        if test_chunks:
            def delayed_process():
                time.sleep(1)
                for chunk in test_chunks:
                    self.process_text(chunk)
                    time.sleep(chunk_delay)

            t = threading.Thread(target=delayed_process, daemon=True)
            t.start()

        self.display.run()


if __name__ == "__main__":
    # Full-song test: simulates "Mighty God Reigns" sung start to end,
    # at a realistic singing pace (~3.5s between lines), followed by
    # a short sermon segment to confirm the state transition still works.
    worship_intro = ["Alright church, let's stand and worship the Lord together."]

    full_song_lines = [
        "You are mighty, You are holy",
        "Seated high above it all",
        "Every knee will bow before You",
        "Every tongue will hear the call",
        "Mighty God, You reign forever",
        "Mighty God, Your throne is high",
        "Nothing in this world can shake You",
        "Mighty God, we lift You high",
        "Your love is strong, Your grace is endless",
        "You are faithful, You are true",
        "In the morning, in the evening",
        "Lord our hearts belong to You",
    ]

    sermon_segment = [
        "Turn with me to John 3:16, which tells us about God's love.",
        "The Bible says in Philippians 4:13 that I can do all things.",
    ]

    test_chunks = worship_intro + full_song_lines + sermon_segment

    pipeline = ScribePipeline(display_seconds=6, lyric_display_seconds=4)

    # Worship intro + full song get paced like real singing (3.5s/line).
    # Note: this simple test harness uses one delay for the whole run,
    # so the sermon lines at the end will also be spaced 3.5s apart —
    # that's fine for this test since we're validating lyric pacing,
    # not sermon pacing.
    pipeline.run(test_chunks=test_chunks, chunk_delay=3.5)
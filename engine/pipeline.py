# engine/pipeline.py
# Scribe AI — Unified Pipeline
# Connects: Detection Engine → Bible Database → Display Engine
# Tracks Service State. Scripture detection active outside WORSHIP.
# Lyric detection active only during WORSHIP (log-only, not yet displayed).

import threading
import time
from engine.detection.scripture_detector import detect_scripture_references
from engine.bible.bible_db import lookup_verse
from engine.display.display_engine import ScriptureDisplay
from engine.state.service_state_machine import ServiceStateMachine, ServiceState
from engine.songs.lyric_detector import LyricDetector


class ScribePipeline:
    def __init__(self, display_seconds: int = 8):
        self.display_seconds = display_seconds
        self.display = ScriptureDisplay(display_seconds=display_seconds)
        self.state_machine = ServiceStateMachine()
        self.lyric_detector = LyricDetector()

    def process_text(self, text: str):
        """
        Takes a block of text:
        1. Updates the Service State Machine
        2. If WORSHIP: runs lyric detection (log-only for now, no display yet)
        3. If not WORSHIP: runs scripture detection -> lookup -> display
        """
        # --- Service State tracking ---
        previous_state = self.state_machine.get_current_state()
        self.state_machine.update_from_text(text)
        current_state = self.state_machine.get_current_state()

        if current_state != previous_state:
            print(f"[STATE] Transitioned: {previous_state.value} -> {current_state.value}")
        else:
            print(f"[STATE] No change (still {current_state.value})")

        # --- WORSHIP: lyric detection only ---
        if current_state == ServiceState.WORSHIP:
            match = self.lyric_detector.detect(text)
            if match:
                print(f"[LYRIC] Detected '{match['song_title']}' "
                      f"(line {match['line_number']}, score {match['score']}): "
                      f"\"{match['line_text']}\"")
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

    def run(self, test_chunks: list = None):
        """
        Starts the display engine.
        If test_chunks is provided, processes each chunk sequentially
        after a short delay, simulating live transcript segments arriving
        one at a time (as Whisper would produce in the real pipeline).
        """
        if test_chunks:
            def delayed_process():
                time.sleep(1)
                for chunk in test_chunks:
                    self.process_text(chunk)
                    time.sleep(1)  # simulate gap between live transcript segments

            t = threading.Thread(target=delayed_process, daemon=True)
            t.start()

        self.display.run()


if __name__ == "__main__":
    # Simulates a live transcript arriving in sequential chunks.
    # Worship section now includes an actual synthetic song line
    # (from Mighty God Reigns) to prove lyric detection fires correctly.
    test_chunks = [
        "Alright church, let's stand and worship the Lord together.",
        "You are mighty, You are holy",
        "Seated high above it all",
        "Turn with me to John 3:16, which tells us about God's love.",
        "The Bible says in Philippians 4:13 that I can do all things.",
        "Let's pray together before we continue.",
        "Just a few announcements before you go today.",
    ]

    pipeline = ScribePipeline(display_seconds=6)
    pipeline.run(test_chunks=test_chunks)
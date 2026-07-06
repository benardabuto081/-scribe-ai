# engine/pipeline.py
# Scribe AI — Unified Pipeline
# Connects: Detection Engine → Bible Database → Display Engine

import threading
import time
from engine.detection.scripture_detector import detect_scripture_references
from engine.bible.bible_db import lookup_verse
from engine.display.display_engine import ScriptureDisplay


class ScribePipeline:
    def __init__(self, display_seconds: int = 8):
        self.display_seconds = display_seconds
        self.display = ScriptureDisplay(display_seconds=display_seconds)

    def process_text(self, text: str):
        """
        Takes a block of text, detects scripture references,
        looks up verse text, and sends each one to the display engine.
        Waits between each reference so they display sequentially.
        """
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

    def run(self, test_text: str = None):
        """
        Starts the display engine.
        If test_text is provided, processes it after a short delay.
        """
        if test_text:
            def delayed_process():
                time.sleep(1)
                self.process_text(test_text)

            t = threading.Thread(target=delayed_process, daemon=True)
            t.start()

        self.display.run()


if __name__ == "__main__":
    test_sermon = """
    Today we are looking at John 3:16, which tells us about God's love.
    Turn with me to Philippians 4:13.
    The Bible says in Psalm 23:1 that the Lord is my shepherd.
    Let us also read Jeremiah 29:11.
    """

    pipeline = ScribePipeline(display_seconds=6)
    pipeline.run(test_text=test_sermon)
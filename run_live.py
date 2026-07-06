# run_live.py
# Scribe AI — Live Entry Point
# Milestone 7: Operator Console integrated

import threading
import time
from engine.audio.audio_engine import AudioEngine
from engine.detection.scripture_detector import detect_scripture_references
from engine.bible.bible_db import lookup_verse
from engine.display.display_engine import ScriptureDisplay
from engine.display.operator_console import OperatorConsole


def main():
    display = ScriptureDisplay(display_seconds=8)

    def show_on_screen(reference_str, verse_text):
        display.root.after(0, display.show, reference_str, verse_text)

    def on_approve(reference_str, verse_text):
        print(f"Operator approved: {reference_str}")
        show_on_screen(reference_str, verse_text)

    def on_dismiss():
        print("Operator dismissed detection.")

    def on_manual(reference_str):
        results = detect_scripture_references(reference_str)
        if results:
            ref = results[0]["reference"]
            verse_text = lookup_verse(ref)
        else:
            ref = reference_str
            verse_text = lookup_verse(reference_str)
        print(f"Manual display: {ref}")
        show_on_screen(ref, verse_text)

    def on_transcript(text):
        references = detect_scripture_references(text)
        if references:
            ref = references[0]["reference"]
            verse_text = lookup_verse(ref)
            print(f"AI detected: {ref}")
            display.root.after(0, console.notify, ref, verse_text)
            return True
        return False

    def start_audio():
        time.sleep(0.5)
        engine = AudioEngine(
            on_transcript=on_transcript,
            device_index=None,
        )
        engine.start()
        while True:
            time.sleep(1)

    def after_mainloop_starts():
        global console
        console = OperatorConsole(
            on_approve=on_approve,
            on_dismiss=on_dismiss,
            on_manual=on_manual,
        )
        audio_thread = threading.Thread(target=start_audio, daemon=True)
        audio_thread.start()

    display.root.after(500, after_mainloop_starts)
    display.run()


if __name__ == "__main__":
    console = None
    main()
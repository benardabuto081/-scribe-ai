# engine/display/display_engine.py
# Scribe AI — Local Display Engine
# Milestone 4: Fullscreen Scripture Display using Tkinter
# Extended: Lyric display mode (shorter hold time, distinct styling)

import tkinter as tk
import threading
import time


class ScriptureDisplay:
    def __init__(self, display_seconds: int = 8, lyric_display_seconds: int = 4):
        """
        Initializes the fullscreen display window.
        display_seconds: how long each scripture stays on screen before clearing.
        lyric_display_seconds: how long each lyric line stays on screen before clearing
            (shorter than scripture, since song lines change every few seconds).
        """
        self.display_seconds = display_seconds
        self.lyric_display_seconds = lyric_display_seconds
        self.root = tk.Tk()
        self.root.title("Scribe AI Display")
        self.root.configure(bg="black")
        self.root.attributes("-fullscreen", True)

        # Allow ESC key to exit fullscreen during testing
        self.root.bind("<Escape>", lambda e: self.root.destroy())

        # Top label — used for scripture reference (gold) OR song title (sky blue)
        self.reference_label = tk.Label(
            self.root,
            text="",
            font=("Helvetica", 48, "bold"),
            fg="#FFD700",  # Gold (default, scripture mode)
            bg="black",
            wraplength=1200,
            justify="center",
        )
        self.reference_label.pack(expand=True, pady=(200, 10))

        # Bottom label — used for verse text OR lyric line
        self.verse_label = tk.Label(
            self.root,
            text="",
            font=("Helvetica", 36),
            fg="white",
            bg="black",
            wraplength=1200,
            justify="center",
        )
        self.verse_label.pack(expand=True, pady=(10, 200))

        self._clear_timer = None

    def show(self, reference: str, verse_text: str):
        """Displays a scripture reference + verse text (gold styling, longer hold)."""
        if self._clear_timer:
            self.root.after_cancel(self._clear_timer)
        self.reference_label.config(text=reference, fg="#FFD700", font=("Helvetica", 48, "bold"))
        self.verse_label.config(text=verse_text)
        self._clear_timer = self.root.after(
            self.display_seconds * 1000, self._clear
        )

    def show_lyric(self, song_title: str, line_text: str):
        """Displays a song title + lyric line (sky-blue styling, shorter hold)."""
        if self._clear_timer:
            self.root.after_cancel(self._clear_timer)
        self.reference_label.config(text=song_title, fg="#87CEEB", font=("Helvetica", 32, "bold"))
        self.verse_label.config(text=line_text)
        self._clear_timer = self.root.after(
            self.lyric_display_seconds * 1000, self._clear
        )

    def _clear(self):
        self.reference_label.config(text="")
        self.verse_label.config(text="")
        self._clear_timer = None

    def run(self):
        """Starts the display window. Blocks until window is closed."""
        self.root.mainloop()


if __name__ == "__main__":
    # Test mode: show a sample scripture, then a sample lyric
    display = ScriptureDisplay(display_seconds=8, lyric_display_seconds=4)

    def test_sequence():
        time.sleep(1)
        display.show(
            "John 3:16",
            "For God so loved the world that he gave his one and only Son, "
            "that whoever believes in him shall not perish but have eternal life."
        )
        time.sleep(10)
        display.show_lyric(
            "Mighty God Reigns",
            "You are mighty, You are holy"
        )

    t = threading.Thread(target=test_sequence, daemon=True)
    t.start()
    display.run()
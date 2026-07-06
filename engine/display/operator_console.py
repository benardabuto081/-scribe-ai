# engine/display/operator_console.py
# Scribe AI — Operator Console
# Milestone 7: Human-in-the-loop safety layer

import tkinter as tk
from tkinter import font


class OperatorConsole:
    def __init__(self, on_approve, on_dismiss, on_manual):
        """
        on_approve: called with (reference, verse_text) when operator approves
        on_dismiss: called when operator dismisses a detection
        on_manual:  called with (reference) when operator manually enters a reference
        """
        self.on_approve = on_approve
        self.on_dismiss = on_dismiss
        self.on_manual = on_manual

        self.pending_reference = None
        self.pending_verse = None

        self.window = tk.Toplevel()
        self.window.title("Scribe AI — Operator Console")
        self.window.geometry("500x320")
        self.window.configure(bg="#1a1a2e")
        self.window.attributes("-topmost", True)
        self.window.resizable(False, False)

        self._build_ui()

    def _build_ui(self):
        # Header
        tk.Label(
            self.window,
            text="SCRIBE AI — OPERATOR",
            font=("Helvetica", 12, "bold"),
            fg="#FFD700",
            bg="#1a1a2e",
        ).pack(pady=(12, 4))

        # Status label
        self.status_label = tk.Label(
            self.window,
            text="Listening...",
            font=("Helvetica", 10),
            fg="#aaaaaa",
            bg="#1a1a2e",
        )
        self.status_label.pack()

        # Detected reference display
        self.reference_label = tk.Label(
            self.window,
            text="—",
            font=("Helvetica", 18, "bold"),
            fg="white",
            bg="#1a1a2e",
        )
        self.reference_label.pack(pady=(10, 2))

        # Verse preview
        self.verse_preview = tk.Label(
            self.window,
            text="",
            font=("Helvetica", 9),
            fg="#cccccc",
            bg="#1a1a2e",
            wraplength=460,
            justify="center",
        )
        self.verse_preview.pack(padx=10)

        # Approve and Dismiss buttons
        btn_frame = tk.Frame(self.window, bg="#1a1a2e")
        btn_frame.pack(pady=12)

        self.approve_btn = tk.Button(
            btn_frame,
            text="✓ APPROVE",
            font=("Helvetica", 11, "bold"),
            fg="white",
            bg="#16a34a",
            activebackground="#15803d",
            width=12,
            command=self._approve,
            state=tk.DISABLED,
        )
        self.approve_btn.grid(row=0, column=0, padx=8)

        self.dismiss_btn = tk.Button(
            btn_frame,
            text="✕ DISMISS",
            font=("Helvetica", 11, "bold"),
            fg="white",
            bg="#dc2626",
            activebackground="#b91c1c",
            width=12,
            command=self._dismiss,
            state=tk.DISABLED,
        )
        self.dismiss_btn.grid(row=0, column=1, padx=8)

        # Divider
        tk.Frame(self.window, height=1, bg="#333355").pack(fill="x", padx=16, pady=8)

        # Manual entry
        tk.Label(
            self.window,
            text="Manual Entry (e.g. John 3:16)",
            font=("Helvetica", 9),
            fg="#aaaaaa",
            bg="#1a1a2e",
        ).pack()

        manual_frame = tk.Frame(self.window, bg="#1a1a2e")
        manual_frame.pack(pady=6)

        self.manual_entry = tk.Entry(
            manual_frame,
            font=("Helvetica", 11),
            width=22,
            bg="#2a2a4a",
            fg="white",
            insertbackground="white",
        )
        self.manual_entry.grid(row=0, column=0, padx=6)

        tk.Button(
            manual_frame,
            text="DISPLAY",
            font=("Helvetica", 10, "bold"),
            fg="white",
            bg="#2563eb",
            activebackground="#1d4ed8",
            command=self._manual_display,
        ).grid(row=0, column=1)

    def notify(self, reference: str, verse_text: str):
        """Called when AI detects a scripture reference."""
        self.pending_reference = reference
        self.pending_verse = verse_text

        self.status_label.config(text="AI Detected:")
        self.reference_label.config(text=reference)
        preview = verse_text[:120] + "..." if len(verse_text) > 120 else verse_text
        self.verse_preview.config(text=preview)
        self.approve_btn.config(state=tk.NORMAL)
        self.dismiss_btn.config(state=tk.NORMAL)

    def _approve(self):
        if self.pending_reference and self.pending_verse:
            self.on_approve(self.pending_reference, self.pending_verse)
            self._reset()

    def _dismiss(self):
        self.on_dismiss()
        self._reset()

    def _manual_display(self):
        ref = self.manual_entry.get().strip()
        if ref:
            self.on_manual(ref)
            self.manual_entry.delete(0, tk.END)

    def _reset(self):
        self.pending_reference = None
        self.pending_verse = None
        self.status_label.config(text="Listening...")
        self.reference_label.config(text="—")
        self.verse_preview.config(text="")
        self.approve_btn.config(state=tk.DISABLED)
        self.dismiss_btn.config(state=tk.DISABLED)
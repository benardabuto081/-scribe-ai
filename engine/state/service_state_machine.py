"""
Service State Machine — Scribe AI

Tracks the current phase of a live church service so downstream
modules (scripture detection, future lyric detection, etc.) can
make context-aware decisions instead of acting blindly on every
audio signal.

This is a BASIC MVP version:
- Heuristic keyword-based transitions (no ML, no confidence scoring yet)
- Single source of truth for "what is happening right now"
- Designed to be replaced by a Probabilistic State Machine in a later generation
  without breaking the interface other modules depend on.
"""

from enum import Enum
from datetime import datetime


class ServiceState(Enum):
    PRE_SERVICE = "PRE_SERVICE"
    WORSHIP = "WORSHIP"
    SERMON = "SERMON"
    PRAYER = "PRAYER"
    ANNOUNCEMENTS = "ANNOUNCEMENTS"
    UNKNOWN = "UNKNOWN"


class ServiceStateMachine:
    """
    Holds the current state of the service and the logic to transition
    between states based on live transcript text.

    This class deliberately does NOT know anything about audio, Whisper,
    or the display engine. It only knows: given a piece of text, does the
    state change? This keeps it independently testable and replaceable.
    """

    def __init__(self):
        self._state = ServiceState.PRE_SERVICE
        self._last_changed = datetime.now()
        self._history = [(self._state, self._last_changed)]

    def get_current_state(self) -> ServiceState:
        """Returns the current service state."""
        return self._state

    def get_history(self):
        """Returns the full list of (state, timestamp) transitions this session."""
        return self._history

    def _set_state(self, new_state: ServiceState):
        """Internal: updates state and records the transition, only if it changed."""
        if new_state != self._state:
            self._state = new_state
            self._last_changed = datetime.now()
            self._history.append((self._state, self._last_changed))

    def update_from_text(self, text: str):
        """
        Given a chunk of live transcript text, determine if the service
        state should change, and update it if so.

        This is intentionally simple keyword matching for the MVP.
        It will be replaced by a confidence-scored classifier later,
        but the method signature will stay the same so nothing downstream
        needs to change when that happens.
        """
        if not text:
            return

        normalized = text.lower()

        worship_phrases = [
            "let's stand and worship", "let's worship", "praise and worship",
            "let's sing", "worship team", "lift your hands"
        ]
        sermon_phrases = [
            "turn with me to", "let's turn to the word", "open your bibles",
            "today's message", "let's dive into the word", "the word of god says"
        ]
        prayer_phrases = [
            "let's pray", "bow your heads", "let us pray", "in prayer"
        ]
        announcement_phrases = [
            "a few announcements", "before we continue", "quick announcement",
            "let's look at the announcements"
        ]

        if any(p in normalized for p in sermon_phrases):
            self._set_state(ServiceState.SERMON)
        elif any(p in normalized for p in worship_phrases):
            self._set_state(ServiceState.WORSHIP)
        elif any(p in normalized for p in prayer_phrases):
            self._set_state(ServiceState.PRAYER)
        elif any(p in normalized for p in announcement_phrases):
            self._set_state(ServiceState.ANNOUNCEMENTS)
        # If nothing matches, state stays unchanged — we don't guess.
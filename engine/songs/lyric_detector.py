"""
Lyric Detector — Scribe AI

Matches live transcript text against the known song library
(data/songs.db) using fuzzy string matching, tolerant of ASR
transcription errors.

This is an MVP-level detector: text-based fuzzy matching only.
No audio/melody analysis. Only detects songs already present
in the song library.
"""

from rapidfuzz import fuzz
from engine.songs.song_db import get_all_song_lines

# Minimum similarity score (0-100) required to consider a match valid.
# Deliberately conservative to avoid false positives — per "reliability
# before intelligence," we would rather miss a match than show the wrong song.
MATCH_THRESHOLD = 75


class LyricDetector:
    def __init__(self):
        self._line_index = get_all_song_lines()

    def detect(self, text: str):
        """
        Given a chunk of live transcript text, returns the best matching
        song line if confidence is above MATCH_THRESHOLD, else None.

        Returns:
            dict with keys: song_title, line_number, line_text, score
            or None if no confident match found.
        """
        if not text or not text.strip():
            return None

        best_match = None
        best_score = 0

        for entry in self._line_index:
            score = fuzz.token_set_ratio(text, entry["line_text"])
            if score > best_score:
                best_score = score
                best_match = entry

        if best_match and best_score >= MATCH_THRESHOLD:
            return {
                "song_title": best_match["song_title"],
                "line_number": best_match["line_number"],
                "line_text": best_match["line_text"],
                "score": best_score
            }

        return None
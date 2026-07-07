"""
Tests for the Lyric Detector.

Run with: pytest tests/test_lyric_detector.py -v

Requires data/songs.db to exist — run this first if not already done:
    python -m engine.songs.build_song_db
"""

import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from engine.songs.lyric_detector import LyricDetector


def test_detects_exact_line_match():
    detector = LyricDetector()
    result = detector.detect("You are mighty, You are holy")
    assert result is not None
    assert result["song_title"] == "Mighty God Reigns"


def test_detects_line_with_minor_asr_error():
    detector = LyricDetector()
    # Simulates a plausible Whisper mis-transcription (holy -> wholly)
    result = detector.detect("You are mighty, You are wholly")
    assert result is not None
    assert result["song_title"] == "Mighty God Reigns"


def test_detects_different_song_correctly():
    detector = LyricDetector()
    result = detector.detect("Open heaven over this house tonight")
    assert result is not None
    assert result["song_title"] == "Open Heaven"


def test_no_match_on_unrelated_sermon_text():
    detector = LyricDetector()
    result = detector.detect("Turn with me to the book of Romans chapter eight")
    assert result is None


def test_no_match_on_empty_text():
    detector = LyricDetector()
    result = detector.detect("")
    assert result is None


def test_returns_score_in_result():
    detector = LyricDetector()
    result = detector.detect("Faithful One, You keep Your word")
    assert result is not None
    assert "score" in result
    assert result["score"] >= 75
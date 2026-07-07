"""
Song Database Query Interface — Scribe AI

Read-only access to data/songs.db. The lyric detector uses this
module to fetch all known song lines for matching — it never
touches SQL directly.
"""

import os
import sqlite3

DB_PATH = os.path.join("data", "songs.db")


def get_all_song_lines():
    """
    Returns a list of dicts, one per stored lyric line:
    [{ "song_title": str, "line_number": int, "line_text": str }, ...]

    Used by the lyric detector to build its in-memory matching index.
    """
    if not os.path.exists(DB_PATH):
        raise FileNotFoundError(
            f"{DB_PATH} not found. Run: python -m engine.songs.build_song_db"
        )

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    rows = conn.execute("""
        SELECT songs.title AS song_title,
               song_lines.line_number,
               song_lines.line_text
        FROM song_lines
        JOIN songs ON song_lines.song_id = songs.id
        ORDER BY songs.title, song_lines.line_number
    """).fetchall()

    conn.close()

    return [dict(row) for row in rows]


def get_song_titles():
    """Returns a list of all song titles currently in the database."""
    if not os.path.exists(DB_PATH):
        raise FileNotFoundError(
            f"{DB_PATH} not found. Run: python -m engine.songs.build_song_db"
        )

    conn = sqlite3.connect(DB_PATH)
    rows = conn.execute("SELECT title FROM songs ORDER BY title").fetchall()
    conn.close()

    return [row[0] for row in rows]
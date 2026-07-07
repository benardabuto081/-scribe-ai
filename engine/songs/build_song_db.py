"""
Build Song Database — Scribe AI

Reads every .txt file in data/songs_source/ and imports it into
data/songs.db as a structured, queryable song + lyric-line database.

Designed for zero-code-change replacement: to load a real church
song library later, simply replace the files in data/songs_source/
with licensed lyrics and re-run this script. No code changes needed.

Usage:
    python -m engine.songs.build_song_db
"""

import os
import sqlite3

SOURCE_DIR = os.path.join("data", "songs_source")
DB_PATH = os.path.join("data", "songs.db")


def create_schema(conn: sqlite3.Connection):
    conn.execute("""
        CREATE TABLE IF NOT EXISTS songs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL UNIQUE
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS song_lines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            song_id INTEGER NOT NULL,
            line_number INTEGER NOT NULL,
            line_text TEXT NOT NULL,
            FOREIGN KEY (song_id) REFERENCES songs (id)
        )
    """)


def clear_existing_data(conn: sqlite3.Connection):
    """Wipe existing song data so re-running this script is safe and repeatable."""
    conn.execute("DELETE FROM song_lines")
    conn.execute("DELETE FROM songs")


def import_song_file(conn: sqlite3.Connection, filepath: str):
    """
    Imports a single .txt file as one song.
    - First non-blank line is treated as the title.
    - All subsequent non-blank lines are treated as lyric lines.
    - Blank lines (verse/chorus separators) are ignored for matching purposes.
    """
    with open(filepath, "r", encoding="utf-8-sig") as f:
        raw_lines = [line.strip() for line in f.readlines()]

    non_blank_lines = [line for line in raw_lines if line]

    if not non_blank_lines:
        print(f"[SKIP] {filepath} is empty.")
        return

    title = non_blank_lines[0]
    lyric_lines = non_blank_lines[1:]

    conn.execute(
        "INSERT OR IGNORE INTO songs (title) VALUES (?)", (title,)
    )
    song_id = conn.execute(
        "SELECT id FROM songs WHERE title = ?", (title,)
    ).fetchone()[0]

    for idx, line_text in enumerate(lyric_lines, start=1):
        conn.execute(
            "INSERT INTO song_lines (song_id, line_number, line_text) VALUES (?, ?, ?)",
            (song_id, idx, line_text)
        )

    print(f"[OK] Imported '{title}' ({len(lyric_lines)} lines)")


def build_database():
    if not os.path.isdir(SOURCE_DIR):
        print(f"[ERROR] Source directory not found: {SOURCE_DIR}")
        return

    txt_files = [
        f for f in os.listdir(SOURCE_DIR)
        if f.lower().endswith(".txt")
    ]

    if not txt_files:
        print(f"[ERROR] No .txt files found in {SOURCE_DIR}")
        return

    conn = sqlite3.connect(DB_PATH)
    create_schema(conn)
    clear_existing_data(conn)

    for filename in txt_files:
        filepath = os.path.join(SOURCE_DIR, filename)
        import_song_file(conn, filepath)

    conn.commit()
    conn.close()
    print(f"\nDone. {len(txt_files)} song file(s) processed into {DB_PATH}")


if __name__ == "__main__":
    build_database()
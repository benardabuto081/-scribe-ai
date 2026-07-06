# engine/bible/build_bible_db.py
# Scribe AI — Bible Database Builder
# Run once to create the local SQLite Bible database
# After this runs, no internet is needed for verse lookup

import sqlite3
import requests
import os

DB_PATH = "data/bible.db"
KJV_URL = "https://raw.githubusercontent.com/thiagobodruk/bible/master/json/en_kjv.json"

def download_bible():
    print("Downloading KJV Bible JSON...")
    response = requests.get(KJV_URL, timeout=60)
    response.raise_for_status()
    print("Download complete.")
    return __import__('json').loads(response.content.decode('utf-8-sig'))

def build_database(bible_data):
    os.makedirs("data", exist_ok=True)

    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS verses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            book TEXT NOT NULL,
            chapter INTEGER NOT NULL,
            verse INTEGER NOT NULL,
            text TEXT NOT NULL
        )
    """)

    cursor.execute("CREATE INDEX IF NOT EXISTS idx_lookup ON verses (book, chapter, verse)")

    print("Building database...")
    total = 0

    for book in bible_data:
        book_name = book["name"]
        for chapter_index, chapter_verses in enumerate(book["chapters"], start=1):
            for verse_index, verse_text in enumerate(chapter_verses, start=1):
                cursor.execute(
                    "INSERT INTO verses (book, chapter, verse, text) VALUES (?, ?, ?, ?)",
                    (book_name, chapter_index, verse_index, verse_text)
                )
                total += 1

    conn.commit()
    conn.close()
    print(f"Database built successfully. {total} verses stored at {DB_PATH}")

if __name__ == "__main__":
    bible_data = download_bible()
    build_database(bible_data)
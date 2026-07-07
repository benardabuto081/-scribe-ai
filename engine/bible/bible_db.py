# engine/bible/bible_db.py
# Scribe AI — Offline Bible Database
# Milestone 6: Full SQLite Bible — 31,100 verses, no internet required

import sqlite3
import os

from engine.paths import get_data_path

DB_PATH = get_data_path("bible.db")

# Canonical book name resolver — maps abbreviations to full names in the database
BOOK_NAME_MAP = {
    "gen": "Genesis", "gn": "Genesis",
    "ex": "Exodus", "exod": "Exodus",
    "lev": "Leviticus", "lv": "Leviticus",
    "num": "Numbers", "nm": "Numbers",
    "deut": "Deuteronomy", "dt": "Deuteronomy",
    "josh": "Joshua", "jos": "Joshua",
    "judg": "Judges", "jdg": "Judges",
    "rut": "Ruth",
    "1sam": "1 Samuel", "1 sam": "1 Samuel",
    "2sam": "2 Samuel", "2 sam": "2 Samuel",
    "1kgs": "1 Kings", "1 kgs": "1 Kings",
    "2kgs": "2 Kings", "2 kgs": "2 Kings",
    "1chr": "1 Chronicles", "1 chr": "1 Chronicles",
    "2chr": "2 Chronicles", "2 chr": "2 Chronicles",
    "ezr": "Ezra",
    "neh": "Nehemiah",
    "est": "Esther",
    "jb": "Job",
    "ps": "Psalms", "psa": "Psalms", "psalm": "Psalms", "psalms": "Psalms",
    "prov": "Proverbs", "prv": "Proverbs",
    "eccl": "Ecclesiastes", "ecc": "Ecclesiastes",
    "song": "Song of Solomon", "sos": "Song of Solomon", "ss": "Song of Solomon",
    "isa": "Isaiah",
    "jer": "Jeremiah",
    "lam": "Lamentations",
    "ezek": "Ezekiel", "eze": "Ezekiel",
    "dan": "Daniel", "dn": "Daniel",
    "hos": "Hosea",
    "jl": "Joel",
    "am": "Amos",
    "obad": "Obadiah", "ob": "Obadiah",
    "jon": "Jonah",
    "mic": "Micah",
    "nah": "Nahum",
    "hab": "Habakkuk",
    "zeph": "Zephaniah", "zep": "Zephaniah",
    "hag": "Haggai",
    "zech": "Zechariah", "zec": "Zechariah",
    "mal": "Malachi",
    "matt": "Matthew", "mt": "Matthew", "mat": "Matthew",
    "mk": "Mark", "mrk": "Mark",
    "lk": "Luke", "luk": "Luke",
    "jn": "John", "jhn": "John",
    "act": "Acts",
    "rom": "Romans", "rm": "Romans",
    "1cor": "1 Corinthians", "1 cor": "1 Corinthians",
    "2cor": "2 Corinthians", "2 cor": "2 Corinthians",
    "gal": "Galatians",
    "eph": "Ephesians",
    "phil": "Philippians", "php": "Philippians",
    "col": "Colossians",
    "1thess": "1 Thessalonians", "1 thess": "1 Thessalonians",
    "2thess": "2 Thessalonians", "2 thess": "2 Thessalonians",
    "1tim": "1 Timothy", "1 tim": "1 Timothy",
    "2tim": "2 Timothy", "2 tim": "2 Timothy",
    "tit": "Titus",
    "phlm": "Philemon", "phm": "Philemon",
    "heb": "Hebrews",
    "jas": "James", "jms": "James",
    "1pet": "1 Peter", "1 pet": "1 Peter",
    "2pet": "2 Peter", "2 pet": "2 Peter",
    "1jn": "1 John", "1 jn": "1 John",
    "2jn": "2 John", "2 jn": "2 John",
    "3jn": "3 John", "3 jn": "3 John",
    "jud": "Jude",
    "rev": "Revelation", "rv": "Revelation",
}


def resolve_book(raw_book: str) -> str:
    cleaned = raw_book.strip().lower()
    return BOOK_NAME_MAP.get(cleaned, raw_book.strip().title())


def lookup_verse(reference: str) -> str:
    if not os.path.exists(DB_PATH):
        return f"[Bible database not found. Run build_bible_db.py first.]"

    try:
        import regex
        ref = reference.strip()

        # Normalize written-out format: "chapter 22 verse 21" -> "22:21"
        written = regex.search(r'chapter\s*(\d+)\s*(?:verse\s*)?(\d+)', ref, regex.IGNORECASE)
        if written:
            book_part = ref[:written.start()].strip()
            ref = f"{book_part} {written.group(1)}:{written.group(2)}"

        # Normalize space-separated format: "Revelation 22 21" -> "Revelation 22:21"
        space_sep = regex.match(r'^(.*?)\s+(\d+)\s+(\d+)$', ref.strip())
        if space_sep and ":" not in ref:
            ref = f"{space_sep.group(1)} {space_sep.group(2)}:{space_sep.group(3)}"

        # Normalize compressed format: "John 316" -> "John 3:16"
        compressed = regex.match(r'^(.*?)\s+(\d{1,3})(\d{2})$', ref.strip())
        if compressed and ":" not in ref:
            ref = f"{compressed.group(1)} {compressed.group(2)}:{compressed.group(3)}"

        parts = ref.strip().split()
        if len(parts) < 2:
            return f"[Could not parse reference: {reference}]"

        chapter_verse = parts[-1]
        raw_book = " ".join(parts[:-1])

        if ":" not in chapter_verse:
            return f"[Could not parse reference: {reference}]"

        chapter_str, verse_str = chapter_verse.split(":", 1)
        verse_str = verse_str.split("-")[0]

        chapter = int(chapter_str.strip())
        verse = int(verse_str.strip())
        book = resolve_book(raw_book)

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT text FROM verses WHERE book=? AND chapter=? AND verse=?",
            (book, chapter, verse)
        )
        row = cursor.fetchone()
        conn.close()

        if row:
            return row[0]
        else:
            return f"[{reference}] — Verse not found in local database."

    except Exception as e:
        return f"[Lookup error for {reference}: {e}]"
    
def is_in_database(reference: str) -> bool:
    result = lookup_verse(reference)
    return not result.startswith("[")
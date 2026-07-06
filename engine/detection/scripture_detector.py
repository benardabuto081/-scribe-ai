# engine/detection/scripture_detector.py
# Scribe AI — Scripture Detection Engine
# Milestone 6: Live Audio Normalization

BIBLE_BOOKS = {
    "Genesis": ["Gen", "Gn"],
    "Exodus": ["Ex", "Exod"],
    "Leviticus": ["Lev", "Lv"],
    "Numbers": ["Num", "Nm"],
    "Deuteronomy": ["Deut", "Dt"],
    "Joshua": ["Josh", "Jos"],
    "Judges": ["Judg", "Jdg"],
    "Ruth": ["Rut"],
    "1 Samuel": ["1Sam", "1 Sam"],
    "2 Samuel": ["2Sam", "2 Sam"],
    "1 Kings": ["1Kgs", "1 Kgs"],
    "2 Kings": ["2Kgs", "2 Kgs"],
    "1 Chronicles": ["1Chr", "1 Chr"],
    "2 Chronicles": ["2Chr", "2 Chr"],
    "Ezra": ["Ezr"],
    "Nehemiah": ["Neh"],
    "Esther": ["Est"],
    "Job": ["Jb"],
    "Psalms": ["Ps", "Psa", "Psalm"],
    "Proverbs": ["Prov", "Prv"],
    "Ecclesiastes": ["Eccl", "Ecc"],
    "Song of Solomon": ["Song", "SOS", "SS"],
    "Isaiah": ["Isa"],
    "Jeremiah": ["Jer"],
    "Lamentations": ["Lam"],
    "Ezekiel": ["Ezek", "Eze"],
    "Daniel": ["Dan", "Dn"],
    "Hosea": ["Hos"],
    "Joel": ["Jl"],
    "Amos": ["Am"],
    "Obadiah": ["Obad", "Ob"],
    "Jonah": ["Jon"],
    "Micah": ["Mic"],
    "Nahum": ["Nah"],
    "Habakkuk": ["Hab"],
    "Zephaniah": ["Zeph", "Zep"],
    "Haggai": ["Hag"],
    "Zechariah": ["Zech", "Zec"],
    "Malachi": ["Mal"],
    "Matthew": ["Matt", "Mt", "Mat"],
    "Mark": ["Mk", "Mrk"],
    "Luke": ["Lk", "Luk"],
    "John": ["Jn", "Jhn"],
    "Acts": ["Act"],
    "Romans": ["Rom", "Rm"],
    "1 Corinthians": ["1Cor", "1 Cor"],
    "2 Corinthians": ["2Cor", "2 Cor"],
    "Galatians": ["Gal"],
    "Ephesians": ["Eph"],
    "Philippians": ["Phil", "Php"],
    "Colossians": ["Col"],
    "1 Thessalonians": ["1Thess", "1 Thess"],
    "2 Thessalonians": ["2Thess", "2 Thess"],
    "1 Timothy": ["1Tim", "1 Tim"],
    "2 Timothy": ["2Tim", "2 Tim"],
    "Titus": ["Tit"],
    "Philemon": ["Phlm", "Phm"],
    "Hebrews": ["Heb"],
    "James": ["Jas", "Jms"],
    "1 Peter": ["1Pet", "1 Pet"],
    "2 Peter": ["2Pet", "2 Pet"],
    "1 John": ["1Jn", "1 Jn"],
    "2 John": ["2Jn", "2 Jn"],
    "3 John": ["3Jn", "3 Jn"],
    "Jude": ["Jud"],
    "Revelation": ["Rev", "Rv"],
}

BIBLE_CHAPTER_COUNTS = {
    "Genesis": 50, "Exodus": 40, "Leviticus": 27, "Numbers": 36,
    "Deuteronomy": 34, "Joshua": 24, "Judges": 21, "Ruth": 4,
    "1 Samuel": 31, "2 Samuel": 24, "1 Kings": 22, "2 Kings": 25,
    "1 Chronicles": 29, "2 Chronicles": 36, "Ezra": 10, "Nehemiah": 13,
    "Esther": 10, "Job": 42, "Psalms": 150, "Proverbs": 31,
    "Ecclesiastes": 12, "Song of Solomon": 8, "Isaiah": 66,
    "Jeremiah": 52, "Lamentations": 5, "Ezekiel": 48, "Daniel": 12,
    "Hosea": 14, "Joel": 3, "Amos": 9, "Obadiah": 1, "Jonah": 4,
    "Micah": 7, "Nahum": 3, "Habakkuk": 3, "Zephaniah": 3,
    "Haggai": 2, "Zechariah": 14, "Malachi": 4, "Matthew": 28,
    "Mark": 16, "Luke": 24, "John": 21, "Acts": 28, "Romans": 16,
    "1 Corinthians": 16, "2 Corinthians": 13, "Galatians": 6,
    "Ephesians": 6, "Philippians": 4, "Colossians": 4,
    "1 Thessalonians": 5, "2 Thessalonians": 3, "1 Timothy": 6,
    "2 Timothy": 4, "Titus": 3, "Philemon": 1, "Hebrews": 13,
    "James": 5, "1 Peter": 5, "2 Peter": 3, "1 John": 5,
    "2 John": 1, "3 John": 1, "Jude": 1, "Revelation": 22,
}

import regex


def normalize_reference(ref: str, chapter: str = None, verse: str = None) -> str:
    ref = regex.sub(r'\s*:\s*', ':', ref)
    ref = regex.sub(r'\s+', ' ', ref)
    ref = ref.strip()

    # If chapter and verse are provided, ensure colon format is used
    if chapter and verse:
        # Fix compressed format: "John 316" -> "John 3:16"
        compressed = regex.match(r'^(.*?)(\d+)(\d{2})$', ref)
        if compressed and ':' not in ref:
            ref = f"{compressed.group(1).strip()} {chapter}:{verse}"

    return ref

def resolve_book_name(detected_name: str) -> str:
    detected_lower = detected_name.strip().lower()
    for canonical, abbreviations in BIBLE_BOOKS.items():
        if detected_lower == canonical.lower():
            return canonical
        for abbr in abbreviations:
            if detected_lower == abbr.lower():
                return canonical
    return detected_name


def is_valid_reference(canonical_book: str, chapter: int) -> bool:
    max_chapters = BIBLE_CHAPTER_COUNTS.get(canonical_book)
    if max_chapters is None:
        return True
    return 1 <= chapter <= max_chapters


def detect_scripture_references(text: str, deduplicate: bool = True) -> list:
    results = []

    all_names = []
    for full_name, abbreviations in BIBLE_BOOKS.items():
        all_names.append(regex.escape(full_name))
        for abbr in abbreviations:
            all_names.append(regex.escape(abbr))

    all_names.sort(key=len, reverse=True)
    book_pattern = "|".join(all_names)

    patterns = [
        r"(?P<book>" + book_pattern + r")\.?\s*(?P<chapter>\d+)\s*:\s*(?P<verse>\d+)(?:-(?P<verse_end>\d+))?",
        r"(?P<book>" + book_pattern + r")\.?\s*chapter\s*(?P<chapter>\d+)\s*(?:verse\s*)?(?P<verse>\d+)(?:-(?P<verse_end>\d+))?",
        r"(?P<book>" + book_pattern + r")\.?\s*(?P<chapter>\d+)\s+(?P<verse>\d+)(?:-(?P<verse_end>\d+))?",
        r"(?P<book>" + book_pattern + r")\s+(?P<chapter>\d{1,3})(?P<verse>\d{2})(?!\d)(?P<verse_end>)?",
    ]

    seen_positions = set()
    seen_normalized = set()

    for pat in patterns:
        for match in regex.finditer(pat, text, regex.IGNORECASE):
            if match.start() in seen_positions:
                continue

            raw_reference = match.group(0).strip()
            normalized = normalize_reference(
                raw_reference,
                chapter=match.group("chapter"),
                verse=match.group("verse")
            )
            normalized_lower = normalized.lower()

            canonical_book = resolve_book_name(match.group("book"))
            chapter = int(match.group("chapter"))

            if not is_valid_reference(canonical_book, chapter):
                continue

            if deduplicate and normalized_lower in seen_normalized:
                continue

            seen_positions.add(match.start())
            seen_normalized.add(normalized_lower)

            results.append({
                "reference": normalized,
                "book": canonical_book,
                "chapter": chapter,
                "verse": match.group("verse"),
                "verse_end": match.group("verse_end"),
                "position": match.start(),
            })

    results.sort(key=lambda x: x["position"])
    return results
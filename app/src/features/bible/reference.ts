import { BOOKS, type Book } from './books';

export type ScriptureRef = { book: Book; chapter: number; verseStart: number; verseEnd: number };

const ORDINALS: Record<string, string> = {
  first: '1',
  second: '2',
  third: '3',
  '1st': '1',
  '2nd': '2',
  '3rd': '3',
  i: '1',
  ii: '2',
  iii: '3',
  kwanza: '1',
  pili: '2',
  tatu: '3',
};

const WORD_NUMBERS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Lookup table: normalized name/abbreviation → book. Longest keys tried first. */
const KEYS: { key: string; book: Book }[] = BOOKS.flatMap((b) =>
  [b.en, b.sw, ...b.abbr].map((k) => ({ key: norm(k), book: b })),
).sort((a, b) => b.key.length - a.key.length);

function wordsToNumbers(s: string): string {
  // "twenty three" -> "23", "sixteen" -> "16"
  return s
    .replace(
      /\b(twenty|thirty|forty|fifty)[\s-]+(one|two|three|four|five|six|seven|eight|nine)\b/g,
      (_, t: string, u: string) => String((WORD_NUMBERS[t] ?? 0) + (WORD_NUMBERS[u] ?? 0)),
    )
    .replace(/\b[a-z]+\b/g, (w) => (WORD_NUMBERS[w] !== undefined ? String(WORD_NUMBERS[w]) : w));
}

/**
 * Parses free-form references, e.g.
 *   "John 3:16", "Jn 3 16", "Mat 316"?? (ambiguous; see below), "John chapter 3 verse 16",
 *   "1 Cor 13:4-7", "First Corinthians 13 verses 4 to 7", "Yohana 3:16", "Zaburi 23", "Psalm 23:1-6".
 * A compact number like "316" after a book is read as chapter 3 verse 16 only if chapter 316 doesn't exist.
 * Returns null when no book can be recognised.
 */
export function parseReference(input: string): ScriptureRef | null {
  let s = ` ${input.toLowerCase().trim()} `;
  s = s.replace(/\b(first|second|third|1st|2nd|3rd|kwanza|pili|tatu)\b/g, (m) => ORDINALS[m] ?? m);
  s = s.replace(/^\s*(iii|ii|i)\s+(?=[a-z])/, (m) => `${ORDINALS[m.trim()] ?? m} `);
  s = wordsToNumbers(s);
  s = s.replace(/\b(chapter|chap|ch|sura|mlango)\b\.?/g, ' ');
  s = s.replace(/\b(verses?|vv?|vs|mstari|mistari|aya)\b\.?/g, ':');
  s = s.replace(/\b(to|through|thru|hadi|mpaka)\b/g, '-');
  s = s.replace(/[–—]/g, '-');

  // Find book: try progressively longer leading word sequences.
  const m = /^\s*([1-3]?\s*[a-z][a-z\s.]*?)\s*(\d.*)?$/.exec(s);
  if (!m) return null;
  const bookPart = norm(m[1] ?? '');
  const rest = (m[2] ?? '').trim();
  const hit =
    KEYS.find((k) => k.key === bookPart) ?? KEYS.find((k) => bookPart.startsWith(k.key) && k.key.length >= 3);
  if (!hit) return null;
  const book = hit.book;

  // Normalise separators: "3 : 16", "3.16", "3,16" → "3:16"; "16 - 18" → "16-18".
  const tokens = rest
    .replace(/\s*[:.,]\s*/g, ':')
    .replace(/\s*-\s*/g, '-')
    .replace(/:+/g, ':')
    .trim();

  if (!tokens) return { book, chapter: 1, verseStart: 1, verseEnd: 1 };

  let chapter: number;
  let verseStart: number;
  let verseEnd: number;

  const full = /^(\d+)(?::|\s+)(\d+)(?:-(?:(\d+):)?(\d+))?$/.exec(tokens);
  const chapOnly = /^(\d+)$/.exec(tokens);
  const chapRange = /^(\d+)-(\d+)$/.exec(tokens);

  if (full) {
    chapter = Number(full[1]);
    verseStart = Number(full[2]);
    verseEnd = full[4] ? Number(full[4]) : verseStart;
  } else if (chapOnly) {
    const n = Number(chapOnly[1]);
    if (n <= book.chapters) {
      chapter = n;
      verseStart = 1;
      verseEnd = 0; // whole chapter (0 = until end)
    } else {
      // Compact form "316" → 3:16 (ASR often drops separators).
      const str = String(n);
      const split = splitCompact(str, book.chapters);
      if (!split) return null;
      [chapter, verseStart] = split;
      verseEnd = verseStart;
    }
  } else if (chapRange) {
    // "John 3 16-18" arrives here as "3 16-18" only via `full`; "23-24" means chapter range → take first chapter.
    chapter = Number(chapRange[1]);
    verseStart = 1;
    verseEnd = 0;
  } else {
    return null;
  }

  if (chapter < 1 || chapter > book.chapters || verseStart < 1) return null;
  if (verseEnd !== 0 && verseEnd < verseStart) verseEnd = verseStart;
  return { book, chapter, verseStart, verseEnd };
}

function splitCompact(str: string, maxChapter: number): [number, number] | null {
  for (let i = 1; i < str.length; i++) {
    const c = Number(str.slice(0, i));
    const v = Number(str.slice(i));
    if (c >= 1 && c <= maxChapter && v >= 1 && !str.slice(i).startsWith('0')) return [c, v];
  }
  return null;
}

export function formatReference(r: ScriptureRef, lang: 'en' | 'sw' = 'en'): string {
  const name = lang === 'sw' ? r.book.sw : r.book.en;
  if (r.verseEnd === 0) return `${name} ${r.chapter}`;
  if (r.verseEnd === r.verseStart) return `${name} ${r.chapter}:${r.verseStart}`;
  return `${name} ${r.chapter}:${r.verseStart}-${r.verseEnd}`;
}

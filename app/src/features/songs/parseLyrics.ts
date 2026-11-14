import type { GroupColorKey } from '@/design-system/tokens/tokens';

export type ParsedSection = { key: GroupColorKey; name: string; lines: string[] };

const HEADERS: { re: RegExp; key: GroupColorKey; label: string }[] = [
  { re: /^(verse|ubeti)\s*(\d+)?\s*:?$/i, key: 'verse', label: 'Verse' },
  { re: /^(chorus|refrain|kiitikio|chorasi)\s*(\d+)?\s*:?$/i, key: 'chorus', label: 'Chorus' },
  { re: /^(pre-?chorus)\s*(\d+)?\s*:?$/i, key: 'preChorus', label: 'Pre-chorus' },
  { re: /^(bridge|daraja)\s*(\d+)?\s*:?$/i, key: 'bridge', label: 'Bridge' },
  { re: /^(intro)\s*:?$/i, key: 'intro', label: 'Intro' },
  { re: /^(outro|ending)\s*:?$/i, key: 'outro', label: 'Outro' },
  { re: /^(tag)\s*:?$/i, key: 'tag', label: 'Tag' },
  { re: /^\[(.+)\]$/, key: 'custom', label: '' },
];

/**
 * Auto-formats pasted lyrics into sections. Recognises headers like "Verse 1", "Chorus",
 * "Kiitikio", "[Bridge]". Blank lines split sections when there are no headers.
 */
export function parseLyrics(text: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  let current: ParsedSection | null = null;
  let verseCount = 0;
  const push = () => {
    if (current && current.lines.length) sections.push(current);
    current = null;
  };
  for (const raw of text.replace(/\r/g, '').split('\n')) {
    const line = raw.trim();
    const header = HEADERS.find((h) => h.re.test(line));
    if (header) {
      push();
      const m = header.re.exec(line);
      const label = header.label || (m?.[1] ?? 'Section');
      if (header.key === 'verse') verseCount++;
      const num = m?.[2] ?? (header.key === 'verse' ? String(verseCount) : '');
      current = { key: header.key, name: num ? `${label} ${num}` : label, lines: [] };
      continue;
    }
    if (!line) {
      if (current && current.lines.length) push();
      continue;
    }
    if (!current) {
      verseCount++;
      current = { key: 'verse', name: `Verse ${verseCount}`, lines: [] };
    }
    current.lines.push(line);
  }
  push();
  return sections;
}

/** Reflow: split a section's lines into slides of `linesPerSlide` lines. */
export function reflow(lines: string[], linesPerSlide = 2): string[] {
  const out: string[] = [];
  for (let i = 0; i < lines.length; i += linesPerSlide)
    out.push(lines.slice(i, i + linesPerSlide).join('\n'));
  return out;
}

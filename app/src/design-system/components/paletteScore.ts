/**
 * Command palette ranking. Tiers (higher wins):
 *   1.00 exact label match
 *   0.90 label starts with the query
 *   0.80 a word in the label starts with the query
 *   0.60 label contains the query
 *   0.50 a keyword equals / starts with the query
 *   ≤0.30 fuzzy (letters in order) within the label only — never across ids or keywords
 *   0    no match (hidden)
 * `boost` (e.g. +0.05 for "Go to" screens) only reorders items within the same tier.
 */
const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();

function fuzzy(label: string, q: string): number {
  let li = 0;
  let first = -1;
  let last = -1;
  for (const ch of q) {
    const idx = label.indexOf(ch, li);
    if (idx === -1) return 0;
    if (first === -1) first = idx;
    last = idx;
    li = idx + 1;
  }
  const span = last - first + 1;
  return 0.1 + 0.2 * (q.length / span); // compact matches score higher, max 0.30
}

export function paletteScore(label: string, search: string, keywords: string[] = [], boost = 0): number {
  const q = norm(search);
  if (!q) return 1;
  const l = norm(label);
  let score: number;
  if (l === q) score = 1;
  else if (l.startsWith(q)) score = 0.9;
  else if (l.split(/[\s:·/-]+/).some((w) => w.startsWith(q))) score = 0.8;
  else if (l.includes(q)) score = 0.6;
  else if (keywords.some((k) => norm(k) === q || norm(k).startsWith(q))) score = 0.5;
  else score = fuzzy(l, q);
  return score === 0 ? 0 : Math.min(1, score) * 0.95 + boost;
}

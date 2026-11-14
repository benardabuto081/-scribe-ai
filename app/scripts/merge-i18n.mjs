// Deep-merges a JSON patch { en: {...}, sw: {...} } into the locale catalogs.
// Usage: node scripts/merge-i18n.mjs path/to/patch.json
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'i18n', 'locales');
const patch = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const merge = (a, b) => {
  for (const [k, v] of Object.entries(b)) {
    a[k] = v && typeof v === 'object' && !Array.isArray(v) ? merge(a[k] ?? {}, v) : v;
  }
  return a;
};
for (const lang of ['en', 'sw']) {
  if (!patch[lang]) continue;
  const file = join(root, `${lang}.json`);
  const cur = JSON.parse(readFileSync(file, 'utf8'));
  writeFileSync(file, JSON.stringify(merge(cur, patch[lang]), null, 2) + '\n');
}
console.log('merged', Object.keys(patch).join(', '));

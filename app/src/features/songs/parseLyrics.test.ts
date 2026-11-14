import { parseLyrics, reflow } from './parseLyrics';
import { validateModelPack } from '@/features/onboarding/wizard';

describe('parseLyrics', () => {
  it('uses headers when present (English and Kiswahili)', () => {
    const s = parseLyrics('Verse 1\nLine a\nLine b\n\nKiitikio\nLine c\n[Tag]\nLine d');
    expect(s.map((x) => [x.key, x.name, x.lines.length])).toEqual([
      ['verse', 'Verse 1', 2],
      ['chorus', 'Chorus', 1],
      ['custom', 'Tag', 1],
    ]);
  });
  it('splits on blank lines without headers', () => {
    const s = parseLyrics('a\nb\n\nc\nd\n\n\ne');
    expect(s.map((x) => x.name)).toEqual(['Verse 1', 'Verse 2', 'Verse 3']);
  });
  it('reflows into slides', () => {
    expect(reflow(['1', '2', '3', '4', '5'], 2)).toEqual(['1\n2', '3\n4', '5']);
  });
});

describe('validateModelPack (USB / folder install)', () => {
  it('accepts a faster-whisper folder', () => {
    expect(validateModelPack(['small/model.bin', 'small/config.json', 'small/tokenizer.json']).ok).toBe(true);
  });
  it('reports what is missing', () => {
    expect(validateModelPack(['notes.txt', 'config.json'])).toEqual({
      ok: false,
      missing: ['model.bin', 'tokenizer.json / vocabulary.txt / vocabulary.json'],
    });
  });
});

import { paletteScore } from './paletteScore';

const rank = (q: string, items: { label: string; keywords?: string[]; boost?: number }[]) =>
  items
    .map((i) => ({ label: i.label, s: paletteScore(i.label, q, i.keywords, i.boost) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.label);

describe('paletteScore', () => {
  const items = [
    { label: 'Toggle inspector', keywords: ['app.toggleInspector'] },
    { label: 'Screens', boost: 0.05 },
    { label: 'Toggle test pattern', keywords: ['output.testPattern'] },
    { label: 'Stage display', boost: 0.05 },
    { label: 'Load song: Amazing Grace', keywords: ['hymn', 'grace'] },
  ];

  it('ranks the exact screen name first and does not fuzzy-match unrelated commands', () => {
    expect(rank('screens', items)).toEqual(['Screens']);
  });

  it('prefix beats word-prefix beats contains beats fuzzy', () => {
    const r = rank('st', [
      { label: 'Fast start' }, // word prefix
      { label: 'Stage display' }, // label prefix
      { label: 'Last song' }, // contains
      { label: 'Set timer' }, // fuzzy s…t
    ]);
    expect(r).toEqual(['Stage display', 'Fast start', 'Last song', 'Set timer']);
  });

  it('finds songs by a word in the title and by keyword', () => {
    expect(rank('amazing', items)[0]).toBe('Load song: Amazing Grace');
    expect(rank('hymn', items)).toEqual(['Load song: Amazing Grace']);
  });

  it('boost only reorders within a tier', () => {
    expect(paletteScore('Screens', 'scr', [], 0.05)).toBeGreaterThan(paletteScore('Screenshot', 'scr'));
    expect(paletteScore('Stage', 'stage', [], 0)).toBeGreaterThan(
      paletteScore('Stage display', 'stage', [], 0.05),
    );
  });

  it('is accent and case insensitive', () => {
    expect(paletteScore('Mipangilio', 'MIPANG')).toBeGreaterThan(0.8);
  });
});

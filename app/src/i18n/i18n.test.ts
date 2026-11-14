import en from './locales/en.json';
import sw from './locales/sw.json';

type Tree = { [k: string]: string | Tree };

function keys(obj: Tree, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'string' ? [`${prefix}${k}`] : keys(v, `${prefix}${k}.`),
  );
}

describe('i18n catalogs', () => {
  it('Kiswahili has every English key', () => {
    const missing = keys(en as Tree).filter((k) => !keys(sw as Tree).includes(k));
    expect(missing).toEqual([]);
  });
  it('Kiswahili has no extra keys', () => {
    const extra = keys(sw as Tree).filter((k) => !keys(en as Tree).includes(k));
    expect(extra).toEqual([]);
  });
});

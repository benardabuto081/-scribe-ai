import { formatReference, parseReference } from './reference';

const fmt = (s: string) => {
  const r = parseReference(s);
  return r ? formatReference(r) : null;
};

describe('parseReference', () => {
  it.each([
    ['John 3:16', 'John 3:16'],
    ['john 3 16', 'John 3:16'],
    ['Jn 3:16-18', 'John 3:16-18'],
    ['Mat 316', 'Matthew 3:16'],
    ['John chapter 3 verse 16', 'John 3:16'],
    ['John chapter three verse sixteen', 'John 3:16'],
    ['First Corinthians 13 verses 4 to 7', '1 Corinthians 13:4-7'],
    ['1 Cor 13:4-7', '1 Corinthians 13:4-7'],
    ['Psalm 23', 'Psalms 23'],
    ['Ps 23:1–6', 'Psalms 23:1-6'],
    ['Yohana 3:16', 'John 3:16'],
    ['Zaburi 23:1', 'Psalms 23:1'],
    ['Waefeso 3:17', 'Ephesians 3:17'],
    ['1 Yohana 4:8', '1 John 4:8'],
    ['Song of Solomon 2:4', 'Song of Solomon 2:4'],
    ['Phil 4.13', 'Philippians 4:13'],
    ['Rev 21 4', 'Revelation 21:4'],
  ])('%s → %s', (input, expected) => {
    expect(fmt(input)).toBe(expected);
  });

  it('formats in Kiswahili', () => {
    const r = parseReference('John 3:16');
    expect(r && formatReference(r, 'sw')).toBe('Yohana 3:16');
  });

  it.each(['hello world', '', 'John 99:1', 'Obadiah 2:1'])('rejects %j', (input) => {
    expect(parseReference(input)).toBeNull();
  });
});

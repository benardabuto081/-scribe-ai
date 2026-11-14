/**
 * Seeded mock data for Phase A. Loaded only when VITE_USE_MOCKS=true (see ./index.ts).
 *
 * Content licensing:
 *  - Hymn lyrics below are public domain (authors died > 100 years ago; publication pre-1900).
 *  - "Mighty God Reigns" is the project's own test song (data/songs_source).
 *  - "Bwana Ni Mwema" is an original sample chorus written for Scribe AI.
 *  - Scripture is King James Version (public domain).
 * Never add copyrighted lyrics here.
 */
import type {
  Background,
  Library,
  Look,
  Macro,
  MediaItem,
  Message,
  Playlist,
  Presentation,
  Prop,
  ScriptureVerse,
  SlideGroup,
  Theme,
  Timer,
} from '@/state/domain';

/* ----------------------------- helpers ----------------------------- */

let slideSeq = 0;
function group(id: string, key: SlideGroup['key'], name: string, ...slides: string[]): SlideGroup {
  return { id, key, name, slides: slides.map((text) => ({ id: `s${++slideSeq}`, text })) };
}

/* ----------------------------- libraries ----------------------------- */

export const libraries: Library[] = [
  { id: 'lib-worship', name: 'Worship', color: '#22d3ee', icon: 'music' },
  { id: 'lib-hymns', name: 'Hymns', color: '#3f86ff', icon: 'music' },
  { id: 'lib-sermons', name: 'Sermons', color: '#ff8a4c', icon: 'book' },
  { id: 'lib-announce', name: 'Announcements', color: '#4dd4a4', icon: 'megaphone' },
  { id: 'lib-kiswahili', name: 'Kiswahili', color: '#8b7cff', icon: 'music' },
];

/* ----------------------------- presentations ----------------------------- */

const amazingGrace: Presentation = {
  id: 'p-amazing-grace',
  title: 'Amazing Grace',
  kind: 'song',
  libraryId: 'lib-hymns',
  author: 'John Newton (1779)',
  copyright: 'Public domain',
  language: 'en',
  tags: ['hymn', 'grace', 'classic'],
  favorite: true,
  updatedAt: '2026-11-08T09:12:00Z',
  themeId: 'th-centered',
  key: 'G',
  bpm: 72,
  usageCount: 41,
  groups: [
    group(
      'ag-v1',
      'verse',
      'Verse 1',
      'Amazing grace! How sweet the sound\nThat saved a wretch like me!',
      'I once was lost, but now am found;\nWas blind, but now I see.',
    ),
    group(
      'ag-v2',
      'verse',
      'Verse 2',
      '’Twas grace that taught my heart to fear,\nAnd grace my fears relieved;',
      'How precious did that grace appear\nThe hour I first believed.',
    ),
    group(
      'ag-v3',
      'verse',
      'Verse 3',
      'Through many dangers, toils and snares,\nI have already come;',
      '’Tis grace hath brought me safe thus far,\nAnd grace will lead me home.',
    ),
    group(
      'ag-v4',
      'verse',
      'Verse 4',
      'When we’ve been there ten thousand years,\nBright shining as the sun,',
      'We’ve no less days to sing God’s praise\nThan when we’d first begun.',
    ),
  ],
  arrangements: [
    { id: 'ag-a1', name: 'Default', groupIds: ['ag-v1', 'ag-v2', 'ag-v3', 'ag-v4'] },
    { id: 'ag-a2', name: 'Short', groupIds: ['ag-v1', 'ag-v3', 'ag-v4'] },
  ],
  activeArrangementId: 'ag-a1',
};

const itIsWell: Presentation = {
  id: 'p-it-is-well',
  title: 'It Is Well With My Soul',
  kind: 'song',
  libraryId: 'lib-hymns',
  author: 'Horatio G. Spafford (1873)',
  copyright: 'Public domain',
  language: 'en',
  tags: ['hymn', 'peace'],
  updatedAt: '2026-11-01T18:40:00Z',
  themeId: 'th-centered',
  key: 'C',
  bpm: 66,
  usageCount: 23,
  groups: [
    group(
      'iw-v1',
      'verse',
      'Verse 1',
      'When peace like a river attendeth my way,\nWhen sorrows like sea billows roll;',
      'Whatever my lot, Thou hast taught me to say,\nIt is well, it is well with my soul.',
    ),
    group('iw-c', 'chorus', 'Chorus', 'It is well with my soul,\nIt is well, it is well with my soul.'),
    group(
      'iw-v2',
      'verse',
      'Verse 2',
      'Though Satan should buffet, though trials should come,\nLet this blest assurance control,',
      'That Christ has regarded my helpless estate,\nAnd hath shed His own blood for my soul.',
    ),
    group(
      'iw-v4',
      'verse',
      'Verse 3',
      'And Lord, haste the day when my faith shall be sight,\nThe clouds be rolled back as a scroll;',
      'The trump shall resound, and the Lord shall descend,\nEven so, it is well with my soul.',
    ),
  ],
  arrangements: [
    { id: 'iw-a1', name: 'Default', groupIds: ['iw-v1', 'iw-c', 'iw-v2', 'iw-c', 'iw-v4', 'iw-c'] },
  ],
  activeArrangementId: 'iw-a1',
};

const holyHoly: Presentation = {
  id: 'p-holy-holy',
  title: 'Holy, Holy, Holy',
  kind: 'song',
  libraryId: 'lib-hymns',
  author: 'Reginald Heber (1826)',
  copyright: 'Public domain',
  language: 'en',
  tags: ['hymn', 'trinity', 'opening'],
  updatedAt: '2026-10-25T07:30:00Z',
  themeId: 'th-centered',
  key: 'D',
  usageCount: 17,
  groups: [
    group(
      'hh-v1',
      'verse',
      'Verse 1',
      'Holy, holy, holy! Lord God Almighty!\nEarly in the morning our song shall rise to Thee;',
      'Holy, holy, holy! Merciful and mighty!\nGod in three Persons, blessed Trinity!',
    ),
    group(
      'hh-v2',
      'verse',
      'Verse 2',
      'Holy, holy, holy! All the saints adore Thee,\nCasting down their golden crowns around the glassy sea;',
      'Cherubim and seraphim falling down before Thee,\nWho wert, and art, and evermore shalt be.',
    ),
  ],
  arrangements: [{ id: 'hh-a1', name: 'Default', groupIds: ['hh-v1', 'hh-v2', 'hh-v1'] }],
  activeArrangementId: 'hh-a1',
};

const blessedAssurance: Presentation = {
  id: 'p-blessed-assurance',
  title: 'Blessed Assurance',
  kind: 'song',
  libraryId: 'lib-hymns',
  author: 'Fanny J. Crosby (1873)',
  copyright: 'Public domain',
  language: 'en',
  tags: ['hymn', 'testimony'],
  updatedAt: '2026-10-19T10:05:00Z',
  themeId: 'th-lower',
  key: 'D',
  usageCount: 29,
  groups: [
    group(
      'ba-v1',
      'verse',
      'Verse 1',
      'Blessed assurance, Jesus is mine!\nO what a foretaste of glory divine!',
      'Heir of salvation, purchase of God,\nBorn of His Spirit, washed in His blood.',
    ),
    group(
      'ba-c',
      'chorus',
      'Chorus',
      'This is my story, this is my song,\nPraising my Saviour all the day long;',
      'This is my story, this is my song,\nPraising my Saviour all the day long.',
    ),
  ],
  arrangements: [{ id: 'ba-a1', name: 'Default', groupIds: ['ba-v1', 'ba-c', 'ba-c'] }],
  activeArrangementId: 'ba-a1',
};

const mightyGod: Presentation = {
  id: 'p-mighty-god',
  title: 'Mighty God Reigns',
  kind: 'song',
  libraryId: 'lib-worship',
  author: 'Scribe AI test song',
  copyright: 'Project test content',
  language: 'en',
  tags: ['worship', 'praise', 'ai-test'],
  favorite: true,
  updatedAt: '2026-11-12T16:22:00Z',
  themeId: 'th-centered',
  key: 'A',
  bpm: 128,
  usageCount: 12,
  groups: [
    group(
      'mg-v1',
      'verse',
      'Verse 1',
      'You are mighty, You are holy\nSeated high above it all',
      'Every knee will bow before You\nEvery tongue will hear the call',
    ),
    group(
      'mg-c',
      'chorus',
      'Chorus',
      'Mighty God, You reign forever\nMighty God, Your throne is high',
      'Nothing in this world can shake You\nMighty God, we lift You high',
    ),
    group(
      'mg-v2',
      'verse',
      'Verse 2',
      'Your love is strong, Your grace is endless\nYou are faithful, You are true',
      'In the morning, in the evening\nLord our hearts belong to You',
    ),
  ],
  arrangements: [{ id: 'mg-a1', name: 'Default', groupIds: ['mg-v1', 'mg-c', 'mg-v2', 'mg-c', 'mg-c'] }],
  activeArrangementId: 'mg-a1',
};

const bwanaNiMwema: Presentation = {
  id: 'p-bwana-ni-mwema',
  title: 'Bwana Ni Mwema',
  kind: 'song',
  libraryId: 'lib-kiswahili',
  author: 'Scribe AI sample (original)',
  copyright: 'Original sample content',
  language: 'en+sw',
  tags: ['kiswahili', 'bilingual', 'praise'],
  updatedAt: '2026-11-10T12:00:00Z',
  themeId: 'th-bilingual',
  key: 'F',
  bpm: 110,
  usageCount: 34,
  groups: [
    group(
      'bm-c',
      'chorus',
      'Kiitikio',
      'Bwana ni mwema, fadhili zake ni za milele\nThe Lord is good, His mercy endures forever',
      'Tumwimbie, tumsifu, Yeye ni mwaminifu\nLet us sing and praise Him, He is faithful',
    ),
    group(
      'bm-v1',
      'verse',
      'Ubeti 1',
      'Asubuhi na jioni, tutalitaja jina lake\nMorning and evening, we will call upon His name',
      'Katika shida na raha, yu pamoja nasi\nIn trouble and in joy, He is with us',
    ),
  ],
  arrangements: [{ id: 'bm-a1', name: 'Default', groupIds: ['bm-c', 'bm-v1', 'bm-c'] }],
  activeArrangementId: 'bm-a1',
};

const sermon: Presentation = {
  id: 'p-sermon-rooted',
  title: 'Rooted in Love — Week 3',
  kind: 'sermon',
  libraryId: 'lib-sermons',
  author: 'Pastor (series: Rooted)',
  language: 'en',
  tags: ['sermon', 'series:rooted', 'ephesians'],
  updatedAt: '2026-11-13T21:10:00Z',
  themeId: 'th-sermon',
  usageCount: 1,
  groups: [
    group('sr-t', 'sermonPoint', 'Title', 'Rooted in Love\nEphesians 3:14–21'),
    group(
      'sr-1',
      'sermonPoint',
      'Point 1',
      '1. Strength comes from within\n“…strengthened with might by his Spirit in the inner man”',
    ),
    group(
      'sr-2',
      'sermonPoint',
      'Point 2',
      '2. Love is the soil\n“…that ye, being rooted and grounded in love”',
    ),
    group(
      'sr-3',
      'sermonPoint',
      'Point 3',
      '3. Fullness is the fruit\n“…that ye might be filled with all the fulness of God”',
    ),
    group(
      'sr-c',
      'announcement',
      'Response',
      'This week: one act of rooted love\nShare it with your home group',
    ),
  ],
  arrangements: [{ id: 'sr-a1', name: 'Default', groupIds: ['sr-t', 'sr-1', 'sr-2', 'sr-3', 'sr-c'] }],
  activeArrangementId: 'sr-a1',
};

const announcements: Presentation = {
  id: 'p-announcements',
  title: 'Sunday Announcements',
  kind: 'announcement',
  libraryId: 'lib-announce',
  language: 'en+sw',
  tags: ['weekly'],
  updatedAt: '2026-11-13T19:00:00Z',
  themeId: 'th-announce',
  usageCount: 52,
  groups: [
    group('an-1', 'announcement', 'Welcome', 'Welcome to Sunday Service\nKaribu kwenye Ibada ya Jumapili'),
    group('an-2', 'announcement', 'Youth camp', 'Youth Camp — 12–14 December\nRegister at the welcome desk'),
    group('an-3', 'announcement', 'Giving', 'Give via M-Pesa\nPaybill 000000 · Account: TITHE'),
    group('an-4', 'announcement', 'Prayer', 'Wednesday Prayer — 6:00 PM\nMaombi ya Jumatano — Saa 12 jioni'),
  ],
  arrangements: [{ id: 'an-a1', name: 'Default', groupIds: ['an-1', 'an-2', 'an-3', 'an-4'] }],
  activeArrangementId: 'an-a1',
};

export const presentations: Presentation[] = [
  mightyGod,
  amazingGrace,
  itIsWell,
  holyHoly,
  blessedAssurance,
  bwanaNiMwema,
  sermon,
  announcements,
];

/* ----------------------------- scripture (KJV) ----------------------------- */

export const kjvSample: ScriptureVerse[] = [
  {
    book: 'John',
    chapter: 3,
    verse: 16,
    text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
  },
  {
    book: 'John',
    chapter: 3,
    verse: 17,
    text: 'For God sent not his Son into the world to condemn the world; but that the world through him might be saved.',
  },
  {
    book: 'John',
    chapter: 3,
    verse: 18,
    text: 'He that believeth on him is not condemned: but he that believeth not is condemned already, because he hath not believed in the name of the only begotten Son of God.',
  },
  { book: 'Psalms', chapter: 23, verse: 1, text: 'The LORD is my shepherd; I shall not want.' },
  {
    book: 'Psalms',
    chapter: 23,
    verse: 2,
    text: 'He maketh me to lie down in green pastures: he leadeth me beside the still waters.',
  },
  {
    book: 'Psalms',
    chapter: 23,
    verse: 3,
    text: 'He restoreth my soul: he leadeth me in the paths of righteousness for his name’s sake.',
  },
  {
    book: 'Psalms',
    chapter: 23,
    verse: 4,
    text: 'Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.',
  },
  {
    book: 'Psalms',
    chapter: 23,
    verse: 5,
    text: 'Thou preparest a table before me in the presence of mine enemies: thou anointest my head with oil; my cup runneth over.',
  },
  {
    book: 'Psalms',
    chapter: 23,
    verse: 6,
    text: 'Surely goodness and mercy shall follow me all the days of my life: and I will dwell in the house of the LORD for ever.',
  },
  {
    book: 'Psalms',
    chapter: 136,
    verse: 1,
    text: 'O give thanks unto the LORD; for he is good: for his mercy endureth for ever.',
  },
  {
    book: 'Philippians',
    chapter: 4,
    verse: 13,
    text: 'I can do all things through Christ which strengtheneth me.',
  },
  {
    book: 'Romans',
    chapter: 8,
    verse: 28,
    text: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.',
  },
  {
    book: 'Ephesians',
    chapter: 3,
    verse: 16,
    text: 'That he would grant you, according to the riches of his glory, to be strengthened with might by his Spirit in the inner man;',
  },
  {
    book: 'Ephesians',
    chapter: 3,
    verse: 17,
    text: 'That Christ may dwell in your hearts by faith; that ye, being rooted and grounded in love,',
  },
  {
    book: 'Ephesians',
    chapter: 3,
    verse: 18,
    text: 'May be able to comprehend with all saints what is the breadth, and length, and depth, and height;',
  },
  {
    book: 'Ephesians',
    chapter: 3,
    verse: 19,
    text: 'And to know the love of Christ, which passeth knowledge, that ye might be filled with all the fulness of God.',
  },
  {
    book: 'Isaiah',
    chapter: 40,
    verse: 31,
    text: 'But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.',
  },
  {
    book: 'Jeremiah',
    chapter: 29,
    verse: 11,
    text: 'For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.',
  },
];

/* ----------------------------- playlists ----------------------------- */

export const playlists: Playlist[] = [
  {
    id: 'pl-sunday',
    name: 'Sunday Service',
    date: '2026-11-15',
    startTime: '09:00',
    templateId: 'svc-sunday',
    items: [
      { id: 'pi-h1', kind: 'header', title: 'Pre-service' },
      {
        id: 'pi-1',
        kind: 'announcement',
        title: 'Sunday Announcements',
        refId: 'p-announcements',
        durationSec: 300,
      },
      { id: 'pi-h2', kind: 'header', title: 'Worship' },
      {
        id: 'pi-2',
        kind: 'song',
        title: 'Mighty God Reigns',
        refId: 'p-mighty-god',
        durationSec: 360,
        assignee: 'Worship team',
      },
      { id: 'pi-3', kind: 'song', title: 'Bwana Ni Mwema', refId: 'p-bwana-ni-mwema', durationSec: 300 },
      { id: 'pi-4', kind: 'song', title: 'It Is Well With My Soul', refId: 'p-it-is-well', durationSec: 330 },
      { id: 'pi-h3', kind: 'header', title: 'Word' },
      {
        id: 'pi-5',
        kind: 'scripture',
        title: 'Ephesians 3:16-19',
        reference: 'Ephesians 3:16-19',
        durationSec: 120,
      },
      {
        id: 'pi-6',
        kind: 'presentation',
        title: 'Rooted in Love — Week 3',
        refId: 'p-sermon-rooted',
        durationSec: 2400,
        assignee: 'Pastor',
      },
      { id: 'pi-h4', kind: 'header', title: 'Response' },
      { id: 'pi-7', kind: 'song', title: 'Amazing Grace', refId: 'p-amazing-grace', durationSec: 270 },
      { id: 'pi-8', kind: 'macro', title: 'Offering', refId: 'mac-offering', durationSec: 420 },
      {
        id: 'pi-9',
        kind: 'scripture',
        title: 'Numbers 6:24-26 (Benediction)',
        reference: 'Numbers 6:24-26',
        durationSec: 60,
      },
    ],
  },
  {
    id: 'pl-midweek',
    name: 'Midweek Prayer',
    date: '2026-11-18',
    startTime: '18:00',
    templateId: 'svc-midweek',
    items: [
      { id: 'pm-1', kind: 'song', title: 'Holy, Holy, Holy', refId: 'p-holy-holy', durationSec: 240 },
      { id: 'pm-2', kind: 'scripture', title: 'Psalm 23', reference: 'Psalm 23:1-6', durationSec: 180 },
      {
        id: 'pm-3',
        kind: 'song',
        title: 'Blessed Assurance',
        refId: 'p-blessed-assurance',
        durationSec: 240,
      },
    ],
  },
];

/* ----------------------------- looks, themes, backgrounds ----------------------------- */

export const backgrounds: Background[] = [
  {
    id: 'bg-aurora',
    name: 'Aurora',
    css: 'radial-gradient(120% 90% at 15% 85%, #1e40ff 0%, transparent 55%), radial-gradient(90% 80% at 85% 15%, #22d3ee 0%, transparent 50%), linear-gradient(160deg, #050816, #0a1430)',
    animated: true,
  },
  { id: 'bg-deep', name: 'Deep Blue', css: 'linear-gradient(160deg, #0a1238 0%, #050816 70%)' },
  { id: 'bg-dawn', name: 'Dawn', css: 'linear-gradient(180deg, #1b1035 0%, #5b2a5e 45%, #f08a5d 100%)' },
  {
    id: 'bg-forest',
    name: 'Still Waters',
    css: 'linear-gradient(170deg, #031a1c 0%, #0b3b3c 50%, #1d6b62 100%)',
  },
  { id: 'bg-black', name: 'Black', css: '#000000' },
  { id: 'bg-linen', name: 'Linen', css: 'repeating-linear-gradient(45deg, #f3eee6 0 2px, #ece5da 2px 4px)' },
];

export const themes: Theme[] = [
  {
    id: 'th-centered',
    name: 'Centered lyrics',
    fontFamily: 'Montserrat Variable',
    fontWeight: 700,
    textColor: '#ffffff',
    textSize: 6.2,
    align: 'center',
    textShadow: true,
  },
  {
    id: 'th-lower',
    name: 'Lower third lyrics',
    fontFamily: 'Inter Variable',
    fontWeight: 650,
    textColor: '#ffffff',
    textSize: 4.6,
    align: 'bottom',
    textShadow: true,
    panel: true,
  },
  {
    id: 'th-bilingual',
    name: 'Bilingual stacked',
    fontFamily: 'Montserrat Variable',
    fontWeight: 650,
    textColor: '#ffffff',
    textSize: 5,
    align: 'center',
    textShadow: true,
  },
  {
    id: 'th-sermon',
    name: 'Sermon point',
    fontFamily: 'Montserrat Variable',
    fontWeight: 700,
    textColor: '#ffffff',
    textSize: 5.6,
    align: 'left',
    textShadow: false,
  },
  {
    id: 'th-scripture',
    name: 'Scripture classic',
    fontFamily: 'Inter Variable',
    fontWeight: 500,
    textColor: '#f5f1e6',
    textSize: 4.8,
    align: 'center',
    textShadow: true,
  },
  {
    id: 'th-announce',
    name: 'Announcement',
    fontFamily: 'Montserrat Variable',
    fontWeight: 700,
    textColor: '#ffffff',
    textSize: 5.4,
    align: 'center',
    textShadow: true,
    uppercase: false,
  },
];

const allLayers = { background: true, slide: true, media: true, props: true, messages: true };
export const looks: Look[] = [
  {
    id: 'look-worship',
    name: 'Worship',
    layers: allLayers,
    backgroundId: 'bg-aurora',
    themeId: 'th-centered',
    stageLayoutId: 'stage-lyrics',
  },
  {
    id: 'look-sermon',
    name: 'Sermon',
    layers: allLayers,
    backgroundId: 'bg-deep',
    themeId: 'th-sermon',
    stageLayoutId: 'stage-pastor',
  },
  {
    id: 'look-scripture',
    name: 'Scripture',
    layers: allLayers,
    backgroundId: 'bg-forest',
    themeId: 'th-scripture',
    stageLayoutId: 'stage-scripture',
  },
  {
    id: 'look-announce',
    name: 'Announcements',
    layers: allLayers,
    backgroundId: 'bg-dawn',
    themeId: 'th-announce',
    stageLayoutId: 'stage-minimal',
  },
  {
    id: 'look-stream',
    name: 'Stream (lower third)',
    layers: { ...allLayers, background: false },
    backgroundId: 'bg-black',
    themeId: 'th-lower',
    stageLayoutId: 'stage-lyrics',
  },
  {
    id: 'look-blank',
    name: 'Background only',
    layers: { ...allLayers, slide: false, props: false },
    backgroundId: 'bg-aurora',
    themeId: 'th-centered',
    stageLayoutId: 'stage-minimal',
  },
];

/* ----------------------------- props, messages, timers ----------------------------- */

export const props: Prop[] = [
  {
    id: 'prop-speaker',
    name: 'Speaker lower third',
    kind: 'lowerThird',
    title: 'Pastor Grace Wanjiru',
    subtitle: 'Rooted in Love · Week 3',
  },
  { id: 'prop-logo', name: 'Church logo bug', kind: 'logo' },
  { id: 'prop-clock', name: 'Live clock', kind: 'clock' },
  {
    id: 'prop-social',
    name: 'Social handles',
    kind: 'social',
    title: '@yourchurch',
    subtitle: 'Follow · Share · Pray',
  },
  {
    id: 'prop-giving',
    name: 'M-Pesa giving',
    kind: 'giving',
    title: 'Paybill 000000',
    subtitle: 'Account: TITHE',
  },
];

export const messages: Message[] = [
  {
    id: 'msg-nursery',
    name: 'Nursery alert',
    template: 'Parent of {name}, please come to the nursery',
    tokens: ['name'],
  },
  { id: 'msg-car', name: 'Vehicle', template: 'Vehicle {plate}: your lights are on', tokens: ['plate'] },
  { id: 'msg-welcome', name: 'Welcome', template: 'Welcome! Karibu! Service begins shortly', tokens: [] },
  {
    id: 'msg-emergency',
    name: 'Emergency',
    template: 'Please remain calm and follow the ushers',
    tokens: [],
  },
];

export const timers: Timer[] = [
  {
    id: 'tm-countdown',
    name: 'Service countdown',
    mode: 'countdownTo',
    targetTime: '09:00',
    overrun: 'stop',
  },
  { id: 'tm-sermon', name: 'Sermon', mode: 'countdown', durationSec: 40 * 60, overrun: 'flash' },
  { id: 'tm-offering', name: 'Offering', mode: 'countdown', durationSec: 7 * 60, overrun: 'continue' },
  { id: 'tm-elapsed', name: 'Service elapsed', mode: 'elapsed', overrun: 'continue' },
];

/* ----------------------------- media ----------------------------- */

const gradients = [
  'linear-gradient(135deg,#1e40ff,#22d3ee)',
  'linear-gradient(200deg,#0b3b3c,#1d6b62,#a7e3c4)',
  'linear-gradient(160deg,#1b1035,#5b2a5e,#f08a5d)',
  'radial-gradient(circle at 30% 30%,#3f86ff,#050816 70%)',
  'linear-gradient(120deg,#0a1238,#8b7cff)',
  'conic-gradient(from 200deg at 60% 40%,#22d3ee,#1e40ff,#0a1238,#22d3ee)',
  'linear-gradient(180deg,#000,#1d2433)',
  'radial-gradient(circle at 70% 80%,#f5b53d,#7a2e12 60%,#140805)',
];

export const media: MediaItem[] = Array.from({ length: 64 }, (_, i) => {
  const kinds: MediaItem['kind'][] = ['motion', 'image', 'video', 'image', 'motion', 'audio'];
  const kind = kinds[i % kinds.length] ?? 'image';
  const names = [
    'Aurora Drift',
    'Still Waters',
    'Dawn Rise',
    'Night Glow',
    'Violet Haze',
    'Prism',
    'Quiet Black',
    'Ember',
  ];
  return {
    id: `m-${i + 1}`,
    name: `${names[i % names.length]} ${Math.floor(i / names.length) + 1}`,
    kind,
    durationSec: kind === 'image' ? undefined : 20 + ((i * 13) % 160),
    css: gradients[i % gradients.length] ?? '#000',
    tags: [kind === 'audio' ? 'pad' : 'background', i % 3 === 0 ? 'worship' : 'general'],
    folder: kind === 'audio' ? 'Audio' : kind === 'motion' ? 'Motion backgrounds' : 'Stills',
  };
});

/* ----------------------------- macros ----------------------------- */

export const macros: Macro[] = [
  {
    id: 'mac-offering',
    name: 'Offering',
    color: '#f5b53d',
    steps: [
      { commandId: 'look.apply', args: { lookId: 'look-announce' } },
      { commandId: 'prop.toggle', args: { propId: 'prop-giving' } },
      { commandId: 'timer.start', args: { timerId: 'tm-offering' } },
    ],
  },
  {
    id: 'mac-sermon',
    name: 'Sermon start',
    color: '#ff8a4c',
    steps: [
      { commandId: 'look.apply', args: { lookId: 'look-sermon' } },
      { commandId: 'prop.toggle', args: { propId: 'prop-speaker' } },
      { commandId: 'timer.start', args: { timerId: 'tm-sermon' } },
    ],
  },
  {
    id: 'mac-walkin',
    name: 'Walk-in',
    color: '#22d3ee',
    steps: [
      { commandId: 'look.apply', args: { lookId: 'look-blank' } },
      { commandId: 'timer.start', args: { timerId: 'tm-countdown' } },
      { commandId: 'message.show', args: { messageId: 'msg-welcome' } },
    ],
  },
  { id: 'mac-reset', name: 'Clear all', color: '#f04d5d', steps: [{ commandId: 'screen.clear' }] },
];

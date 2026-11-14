import type { PlaylistItem } from '@/state/domain';

/** Service templates (SPEC §4.4). Items are copied into a new plan; durations in seconds. */
export type ServiceTemplate = {
  id: string;
  nameKey: string;
  startTime: string;
  items: Omit<PlaylistItem, 'id'>[];
};

const h = (title: string): Omit<PlaylistItem, 'id'> => ({ kind: 'header', title });
const song = (title: string, min = 5): Omit<PlaylistItem, 'id'> => ({
  kind: 'song',
  title,
  durationSec: min * 60,
});
const word = (title: string, reference: string, min = 2): Omit<PlaylistItem, 'id'> => ({
  kind: 'scripture',
  title,
  reference,
  durationSec: min * 60,
});
const seg = (kind: PlaylistItem['kind'], title: string, min: number): Omit<PlaylistItem, 'id'> => ({
  kind,
  title,
  durationSec: min * 60,
});

export const SERVICE_TEMPLATES: ServiceTemplate[] = [
  {
    id: 'svc-sunday',
    nameKey: 'planner.templates.sunday',
    startTime: '09:00',
    items: [
      h('Pre-service'),
      seg('announcement', 'Welcome loop', 10),
      h('Worship'),
      song('Opening song'),
      song('Worship song'),
      song('Worship song'),
      h('Word'),
      word('Scripture reading', 'Psalm 23:1-6'),
      seg('presentation', 'Sermon', 40),
      h('Response'),
      song('Response song', 4),
      seg('macro', 'Offering', 7),
      seg('announcement', 'Announcements', 5),
      word('Benediction', 'Numbers 6:24-26', 1),
    ],
  },
  {
    id: 'svc-midweek',
    nameKey: 'planner.templates.midweek',
    startTime: '18:00',
    items: [
      song('Opening song'),
      word('Reading', 'Philippians 4:6-7'),
      seg('presentation', 'Bible study', 45),
      seg('announcement', 'Prayer requests', 15),
    ],
  },
  {
    id: 'svc-youth',
    nameKey: 'planner.templates.youth',
    startTime: '16:00',
    items: [
      seg('media', 'Countdown video', 5),
      song('Upbeat song', 4),
      song('Upbeat song', 4),
      seg('presentation', 'Talk', 25),
      song('Response song', 4),
      seg('announcement', 'Events', 5),
    ],
  },
  {
    id: 'svc-funeral',
    nameKey: 'planner.templates.funeral',
    startTime: '10:00',
    items: [
      seg('media', 'Photo slideshow', 10),
      song('Hymn', 4),
      word('Reading', 'John 14:1-3'),
      seg('presentation', 'Eulogy', 20),
      seg('presentation', 'Sermon', 20),
      song('Closing hymn', 4),
      word('Committal', 'Revelation 21:4', 2),
    ],
  },
  {
    id: 'svc-wedding',
    nameKey: 'planner.templates.wedding',
    startTime: '11:00',
    items: [
      seg('audio', 'Processional', 5),
      song('Opening hymn', 4),
      word('Reading', '1 Corinthians 13:4-7'),
      seg('presentation', 'Charge', 15),
      seg('presentation', 'Vows and rings', 10),
      seg('announcement', 'Pronouncement', 2),
      seg('audio', 'Recessional', 4),
    ],
  },
  {
    id: 'svc-crusade',
    nameKey: 'planner.templates.crusade',
    startTime: '15:00',
    items: [
      h('Praise'),
      song('Praise song', 6),
      song('Praise song', 6),
      song('Praise song', 6),
      h('Word'),
      seg('presentation', 'Sermon', 45),
      seg('presentation', 'Altar call', 15),
      song('Response song', 5),
    ],
  },
  {
    id: 'svc-vigil',
    nameKey: 'planner.templates.vigil',
    startTime: '21:00',
    items: [
      song('Worship set', 30),
      seg('announcement', 'Prayer session 1', 45),
      seg('presentation', 'Word', 30),
      seg('announcement', 'Prayer session 2', 45),
      song('Worship set', 30),
    ],
  },
  {
    id: 'svc-communion',
    nameKey: 'planner.templates.communion',
    startTime: '09:00',
    items: [
      song('Worship song'),
      word('Words of institution', '1 Corinthians 11:23-26', 3),
      seg('announcement', 'Communion', 15),
      song('Reflective song', 5),
    ],
  },
  {
    id: 'svc-baptism',
    nameKey: 'planner.templates.baptism',
    startTime: '10:00',
    items: [
      song('Opening song'),
      word('Reading', 'Romans 6:3-4'),
      seg('presentation', 'Testimonies', 15),
      seg('announcement', 'Baptisms', 30),
      song('Celebration song', 5),
    ],
  },
];

/**
 * Core domain model shared by stores, commands, outputs and (Phase B) persistence.
 * Kept framework-free so the SQLite layer can map to it 1:1.
 */
import type { GroupColorKey } from '@/design-system/tokens/tokens';

export type Id = string;

/** A positioned object on the slide canvas. Coordinates are in a 1920×1080 design space. */
export type SlideElement = {
  id: Id;
  type: 'text' | 'shape';
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  text?: string;
  style: {
    fontFamily: string;
    fontSize: number; // px at 1080p
    fontWeight: number;
    color: string;
    align: 'left' | 'center' | 'right';
    fill: string; // 'transparent' for none
    shape: 'rect' | 'ellipse';
    radius: number;
    opacity: number; // 0..1
    shadow: boolean;
  };
};

/** Slides with `elements` render as a designed canvas; otherwise `text` renders with the theme. */
export type Slide = { id: Id; text: string; notes?: string; label?: string; elements?: SlideElement[] };

export type SlideGroup = { id: Id; key: GroupColorKey; name: string; slides: Slide[] };

export type Arrangement = { id: Id; name: string; groupIds: Id[] };

export type PresentationKind = 'song' | 'sermon' | 'announcement' | 'scripture' | 'general';

export type Presentation = {
  id: Id;
  title: string;
  kind: PresentationKind;
  libraryId: Id;
  author?: string;
  copyright?: string;
  ccli?: string;
  language: 'en' | 'sw' | 'en+sw';
  tags: string[];
  favorite?: boolean;
  updatedAt: string; // ISO
  themeId: Id;
  groups: SlideGroup[];
  arrangements: Arrangement[];
  activeArrangementId: Id;
  key?: string;
  bpm?: number;
  usageCount?: number;
  /** Set when moved to trash (restorable). */
  deletedAt?: string;
};

export type Library = {
  id: Id;
  name: string;
  color: string;
  icon?: 'folder' | 'music' | 'book' | 'megaphone';
};

/** A slide as it appears in a live sequence (after applying the arrangement). */
export type CueSlide = {
  id: Id; // unique within the sequence (groupId:slideId:n)
  slideId: Id;
  text: string;
  elements?: SlideElement[];
  notes?: string;
  groupId: Id;
  groupName: string;
  groupKey: GroupColorKey;
  index: number;
};

export function sequenceOf(p: Presentation): CueSlide[] {
  const arr = p.arrangements.find((a) => a.id === p.activeArrangementId) ?? p.arrangements[0];
  const order = arr ? arr.groupIds : p.groups.map((g) => g.id);
  const out: CueSlide[] = [];
  const seen = new Map<Id, number>();
  for (const gid of order) {
    const g = p.groups.find((x) => x.id === gid);
    if (!g) continue;
    const n = (seen.get(gid) ?? 0) + 1;
    seen.set(gid, n);
    for (const s of g.slides) {
      out.push({
        id: `${g.id}:${s.id}:${n}`,
        slideId: s.id,
        text: s.text,
        notes: s.notes,
        elements: s.elements,
        groupId: g.id,
        groupName: g.name,
        groupKey: g.key,
        index: out.length,
      });
    }
  }
  return out;
}

export type PlaylistItemKind =
  'presentation' | 'song' | 'scripture' | 'media' | 'audio' | 'announcement' | 'header' | 'macro';

export type PlaylistItem = {
  id: Id;
  kind: PlaylistItemKind;
  title: string;
  refId?: Id; // presentation / media / macro id
  reference?: string; // scripture reference
  durationSec?: number;
  assignee?: string;
  notes?: string;
};

export type Playlist = {
  id: Id;
  name: string;
  date?: string;
  startTime?: string;
  items: PlaylistItem[];
  templateId?: Id;
  /** Sermon outline attached to the plan (feeds the AI's expectations in Phase C). */
  outline?: string;
};

export type ServiceState = 'preService' | 'worship' | 'sermon' | 'prayer' | 'announcements';

export type LayerKey = 'background' | 'slide' | 'media' | 'props' | 'messages' | 'audio';

export type Look = {
  id: Id;
  name: string;
  /** Which layers render on the audience output under this look. */
  layers: Record<Exclude<LayerKey, 'audio'>, boolean>;
  backgroundId: Id;
  themeId: Id;
  stageLayoutId: Id;
};

export type Theme = {
  id: Id;
  name: string;
  fontFamily: string;
  fontWeight: number;
  textColor: string;
  textSize: number; // vw-ish units relative to output width (percent of height)
  align: 'center' | 'left' | 'bottom';
  textShadow: boolean;
  uppercase?: boolean;
  panel?: boolean; // translucent panel behind text
};

export type Background = { id: Id; name: string; css: string; animated?: boolean };

export type PropKind = 'lowerThird' | 'logo' | 'clock' | 'social' | 'giving' | 'qr' | 'ticker';
export type Prop = { id: Id; name: string; kind: PropKind; title?: string; subtitle?: string };

export type Message = { id: Id; name: string; template: string; tokens: string[] };

export type TimerMode = 'countdown' | 'countdownTo' | 'elapsed' | 'clock';
export type Timer = {
  id: Id;
  name: string;
  mode: TimerMode;
  durationSec?: number;
  targetTime?: string; // HH:MM for countdownTo
  overrun: 'continue' | 'flash' | 'stop';
};

export type MediaItem = {
  id: Id;
  name: string;
  kind: 'image' | 'video' | 'motion' | 'audio';
  durationSec?: number;
  css: string; // procedural preview (no copyrighted assets)
  tags: string[];
  folder: string;
};

export type Macro = {
  id: Id;
  name: string;
  color: string;
  steps: { commandId: string; args?: unknown; delayMs?: number }[];
};

export type ScriptureVerse = { book: string; chapter: number; verse: number; text: string };

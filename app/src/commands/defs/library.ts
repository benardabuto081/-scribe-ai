import { z } from 'zod';
import {
  ArrowDownUp,
  Copy,
  FilePlus2,
  FileText,
  ListPlus,
  ListX,
  PencilLine,
  Plus,
  RotateCcw,
  Shapes,
  Trash2,
} from 'lucide-react';
import { defineCommand } from '../registry';
import { CommandFailure } from '../bus';
import { useLibrary } from '@/state/library';
import type { Playlist, PlaylistItem, Presentation, SlideElement, SlideGroup } from '@/state/domain';
import { parseLyrics, reflow } from '@/features/songs/parseLyrics';
import { SERVICE_TEMPLATES } from '@/features/planner/templates';

/* ------------------------------------------------------------------ helpers */

let seq = 0;
export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(++seq).toString(36)}`;

/** Snapshot-based undo for library content (presentations + playlists). */
function libraryUndo() {
  const { presentations, playlists } = useLibrary.getState();
  return () => useLibrary.setState({ presentations, playlists });
}

function getPresentation(id: string): Presentation {
  const p = useLibrary.getState().presentations.find((x) => x.id === id);
  if (!p) throw new CommandFailure('not_found', `Presentation not found: ${id}`);
  return p;
}

function putPresentation(p: Presentation) {
  useLibrary.setState((s) => ({
    presentations: s.presentations.map((x) =>
      x.id === p.id ? { ...p, updatedAt: new Date().toISOString() } : x,
    ),
  }));
}

function mapSlides(
  p: Presentation,
  slideId: string,
  fn: (g: SlideGroup, i: number) => SlideGroup,
): Presentation {
  const gi = p.groups.findIndex((g) => g.slides.some((s) => s.id === slideId));
  if (gi === -1) throw new CommandFailure('not_found', `Slide not found: ${slideId}`);
  return {
    ...p,
    groups: p.groups.map((g, i) =>
      i === gi
        ? fn(
            g,
            g.slides.findIndex((s) => s.id === slideId),
          )
        : g,
    ),
  };
}

function getPlaylist(id: string): Playlist {
  const p = useLibrary.getState().playlists.find((x) => x.id === id);
  if (!p) throw new CommandFailure('not_found', `Playlist not found: ${id}`);
  return p;
}

function putPlaylist(p: Playlist) {
  useLibrary.setState((s) => ({ playlists: s.playlists.map((x) => (x.id === p.id ? p : x)) }));
}

/* ------------------------------------------------------------------ schemas */

const groupKey = z.enum([
  'verse',
  'chorus',
  'bridge',
  'preChorus',
  'intro',
  'outro',
  'tag',
  'interlude',
  'sermonPoint',
  'scripture',
  'announcement',
  'custom',
]);

export const ElementSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'shape']),
  x: z.number(),
  y: z.number(),
  w: z.number().positive(),
  h: z.number().positive(),
  rotation: z.number(),
  text: z.string().optional(),
  style: z.object({
    fontFamily: z.string(),
    fontSize: z.number().positive(),
    fontWeight: z.number(),
    color: z.string(),
    align: z.enum(['left', 'center', 'right']),
    fill: z.string(),
    shape: z.enum(['rect', 'ellipse']),
    radius: z.number().min(0),
    opacity: z.number().min(0).max(1),
    shadow: z.boolean(),
  }),
}) satisfies z.ZodType<SlideElement>;

const presentationPatch = z.object({
  title: z.string().min(1).optional(),
  author: z.string().optional(),
  copyright: z.string().optional(),
  ccli: z.string().optional(),
  tags: z.array(z.string()).optional(),
  language: z.enum(['en', 'sw', 'en+sw']).optional(),
  libraryId: z.string().optional(),
  favorite: z.boolean().optional(),
  themeId: z.string().optional(),
  key: z.string().optional(),
});

const playlistItem = z.object({
  kind: z.enum(['presentation', 'song', 'scripture', 'media', 'audio', 'announcement', 'header', 'macro']),
  title: z.string().min(1),
  refId: z.string().optional(),
  reference: z.string().optional(),
  durationSec: z.number().int().min(0).optional(),
  assignee: z.string().optional(),
  notes: z.string().optional(),
});

/* ------------------------------------------------------------------ commands */

export const libraryCommands = [
  defineCommand({
    id: 'presentation.create',
    category: 'slide',
    labelKey: 'cmd.presentation.create',
    icon: FilePlus2,
    args: z.object({
      title: z.string().min(1),
      kind: z.enum(['song', 'sermon', 'announcement', 'scripture', 'general']).default('general'),
      libraryId: z.string().default('lib-worship'),
    }),
    permission: 'edit',
    aiAllowed: false,
    handler: ({ title, kind, libraryId }) => {
      const undo = libraryUndo();
      const gid = newId('g');
      const p: Presentation = {
        id: newId('p'),
        title,
        kind,
        libraryId,
        language: 'en',
        tags: [],
        updatedAt: new Date().toISOString(),
        themeId: kind === 'sermon' ? 'th-sermon' : 'th-centered',
        groups: [
          {
            id: gid,
            key: kind === 'sermon' ? 'sermonPoint' : 'verse',
            name: kind === 'sermon' ? 'Point 1' : 'Verse 1',
            slides: [{ id: newId('s'), text: '' }],
          },
        ],
        arrangements: [{ id: newId('a'), name: 'Default', groupIds: [gid] }],
        activeArrangementId: '',
      };
      p.activeArrangementId = p.arrangements[0]?.id ?? '';
      useLibrary.getState().upsertPresentation(p);
      return { result: p.id, undo };
    },
  }),
  defineCommand({
    id: 'song.createFromText',
    category: 'song',
    labelKey: 'cmd.song.createFromText',
    icon: FileText,
    args: z.object({
      title: z.string().min(1),
      text: z.string().min(1),
      author: z.string().optional(),
      linesPerSlide: z.number().int().min(1).max(8).default(2),
      libraryId: z.string().default('lib-worship'),
    }),
    permission: 'edit',
    aiAllowed: false,
    handler: ({ title, text, author, linesPerSlide, libraryId }) => {
      const sections = parseLyrics(text);
      if (sections.length === 0) throw new CommandFailure('invalid_args', 'No lyrics found');
      const undo = libraryUndo();
      const groups: SlideGroup[] = sections.map((s) => ({
        id: newId('g'),
        key: s.key,
        name: s.name,
        slides: reflow(s.lines, linesPerSlide).map((t) => ({ id: newId('s'), text: t })),
      }));
      const arr = { id: newId('a'), name: 'Default', groupIds: groups.map((g) => g.id) };
      const p: Presentation = {
        id: newId('p'),
        title,
        kind: 'song',
        libraryId,
        author,
        language: 'en',
        tags: ['imported'],
        updatedAt: new Date().toISOString(),
        themeId: 'th-centered',
        groups,
        arrangements: [arr],
        activeArrangementId: arr.id,
        usageCount: 0,
      };
      useLibrary.getState().upsertPresentation(p);
      return { result: p.id, undo };
    },
  }),
  defineCommand({
    id: 'presentation.update',
    category: 'slide',
    labelKey: 'cmd.presentation.update',
    icon: PencilLine,
    args: z.object({ id: z.string(), patch: presentationPatch }),
    permission: 'edit',
    aiAllowed: false,
    handler: ({ id, patch }) => {
      const p = getPresentation(id);
      const undo = libraryUndo();
      putPresentation({ ...p, ...patch });
      return { undo };
    },
  }),
  defineCommand({
    id: 'presentation.duplicate',
    category: 'slide',
    labelKey: 'cmd.presentation.duplicate',
    icon: Copy,
    args: z.object({ id: z.string() }),
    permission: 'edit',
    aiAllowed: false,
    handler: ({ id }) => {
      const p = getPresentation(id);
      const undo = libraryUndo();
      const copy: Presentation = {
        ...structuredClone(p),
        id: newId('p'),
        title: `${p.title} (copy)`,
        favorite: false,
        usageCount: 0,
      };
      useLibrary.getState().upsertPresentation(copy);
      return { result: copy.id, undo };
    },
  }),
  defineCommand({
    id: 'presentation.trash',
    category: 'slide',
    labelKey: 'cmd.presentation.trash',
    icon: Trash2,
    args: z.object({ ids: z.array(z.string()).min(1) }),
    permission: 'edit',
    aiAllowed: false,
    handler: ({ ids }) => {
      const undo = libraryUndo();
      const at = new Date().toISOString();
      useLibrary.setState((s) => ({
        presentations: s.presentations.map((p) => (ids.includes(p.id) ? { ...p, deletedAt: at } : p)),
      }));
      return { undo };
    },
  }),
  defineCommand({
    id: 'presentation.restore',
    category: 'slide',
    labelKey: 'cmd.presentation.restore',
    icon: RotateCcw,
    args: z.object({ ids: z.array(z.string()).min(1) }),
    permission: 'edit',
    aiAllowed: false,
    handler: ({ ids }) => {
      const undo = libraryUndo();
      useLibrary.setState((s) => ({
        presentations: s.presentations.map((p) => (ids.includes(p.id) ? { ...p, deletedAt: undefined } : p)),
      }));
      return { undo };
    },
  }),
  defineCommand({
    id: 'presentation.purge',
    category: 'slide',
    labelKey: 'cmd.presentation.purge',
    icon: Trash2,
    args: z.object({ ids: z.array(z.string()).min(1) }),
    permission: 'admin',
    aiAllowed: false,
    handler: ({ ids }) => {
      const undo = libraryUndo();
      useLibrary.setState((s) => ({
        presentations: s.presentations.filter((p) => !ids.includes(p.id) || !p.deletedAt),
      }));
      return { undo };
    },
  }),

  /* ------------------------------ slides, groups, arrangements, canvas ------------------------------ */
  defineCommand({
    id: 'slide.add',
    category: 'slide',
    labelKey: 'cmd.slide.add',
    icon: Plus,
    args: z.object({
      presentationId: z.string(),
      groupId: z.string(),
      afterSlideId: z.string().optional(),
      text: z.string().default(''),
    }),
    permission: 'edit',
    aiAllowed: false,
    handler: ({ presentationId, groupId, afterSlideId, text }) => {
      const p = getPresentation(presentationId);
      if (!p.groups.some((g) => g.id === groupId))
        throw new CommandFailure('not_found', `Group not found: ${groupId}`);
      const undo = libraryUndo();
      const slide = { id: newId('s'), text };
      putPresentation({
        ...p,
        groups: p.groups.map((g) => {
          if (g.id !== groupId) return g;
          const at = afterSlideId ? g.slides.findIndex((s) => s.id === afterSlideId) + 1 : g.slides.length;
          return { ...g, slides: [...g.slides.slice(0, at), slide, ...g.slides.slice(at)] };
        }),
      });
      return { result: slide.id, undo };
    },
  }),
  defineCommand({
    id: 'slide.updateText',
    category: 'slide',
    labelKey: 'cmd.slide.updateText',
    icon: PencilLine,
    args: z.object({
      presentationId: z.string(),
      slideId: z.string(),
      text: z.string(),
      notes: z.string().optional(),
    }),
    permission: 'edit',
    aiAllowed: false,
    handler: ({ presentationId, slideId, text, notes }) => {
      const undo = libraryUndo();
      putPresentation(
        mapSlides(getPresentation(presentationId), slideId, (g, i) => ({
          ...g,
          slides: g.slides.map((s, j) =>
            j === i ? { ...s, text, ...(notes !== undefined ? { notes } : {}) } : s,
          ),
        })),
      );
      return { undo };
    },
  }),
  defineCommand({
    id: 'slide.delete',
    category: 'slide',
    labelKey: 'cmd.slide.delete',
    icon: Trash2,
    args: z.object({ presentationId: z.string(), slideId: z.string() }),
    permission: 'edit',
    aiAllowed: false,
    handler: ({ presentationId, slideId }) => {
      const undo = libraryUndo();
      putPresentation(
        mapSlides(getPresentation(presentationId), slideId, (g, i) => ({
          ...g,
          slides: g.slides.filter((_, j) => j !== i),
        })),
      );
      return { undo };
    },
  }),
  defineCommand({
    id: 'slide.setElements',
    category: 'slide',
    labelKey: 'cmd.slide.setElements',
    icon: Shapes,
    args: z.object({ presentationId: z.string(), slideId: z.string(), elements: z.array(ElementSchema) }),
    permission: 'edit',
    aiAllowed: false,
    handler: ({ presentationId, slideId, elements }) => {
      const undo = libraryUndo();
      // Keep plain `text` in sync (stage display, search, next-slide preview).
      const text = elements
        .filter((e) => e.type === 'text' && e.text)
        .map((e) => e.text)
        .join('\n');
      putPresentation(
        mapSlides(getPresentation(presentationId), slideId, (g, i) => ({
          ...g,
          slides: g.slides.map((s, j) => (j === i ? { ...s, elements, text } : s)),
        })),
      );
      return { undo };
    },
  }),
  defineCommand({
    id: 'group.add',
    category: 'slide',
    labelKey: 'cmd.group.add',
    icon: ListPlus,
    args: z.object({ presentationId: z.string(), key: groupKey, name: z.string().min(1) }),
    permission: 'edit',
    aiAllowed: false,
    handler: ({ presentationId, key, name }) => {
      const p = getPresentation(presentationId);
      const undo = libraryUndo();
      const g: SlideGroup = { id: newId('g'), key, name, slides: [{ id: newId('s'), text: '' }] };
      putPresentation({
        ...p,
        groups: [...p.groups, g],
        arrangements: p.arrangements.map((a) =>
          a.id === p.activeArrangementId ? { ...a, groupIds: [...a.groupIds, g.id] } : a,
        ),
      });
      return { result: g.id, undo };
    },
  }),
  defineCommand({
    id: 'group.update',
    category: 'slide',
    labelKey: 'cmd.group.update',
    icon: PencilLine,
    args: z.object({
      presentationId: z.string(),
      groupId: z.string(),
      name: z.string().min(1).optional(),
      key: groupKey.optional(),
    }),
    permission: 'edit',
    aiAllowed: false,
    handler: ({ presentationId, groupId, name, key }) => {
      const p = getPresentation(presentationId);
      const undo = libraryUndo();
      putPresentation({
        ...p,
        groups: p.groups.map((g) =>
          g.id === groupId ? { ...g, ...(name ? { name } : {}), ...(key ? { key } : {}) } : g,
        ),
      });
      return { undo };
    },
  }),
  defineCommand({
    id: 'arrangement.set',
    category: 'slide',
    labelKey: 'cmd.arrangement.set',
    icon: ArrowDownUp,
    args: z.object({ presentationId: z.string(), arrangementId: z.string(), groupIds: z.array(z.string()) }),
    permission: 'edit',
    aiAllowed: false,
    handler: ({ presentationId, arrangementId, groupIds }) => {
      const p = getPresentation(presentationId);
      if (groupIds.some((id) => !p.groups.some((g) => g.id === id)))
        throw new CommandFailure('invalid_args', 'Unknown group in arrangement');
      const undo = libraryUndo();
      putPresentation({
        ...p,
        arrangements: p.arrangements.map((a) => (a.id === arrangementId ? { ...a, groupIds } : a)),
      });
      return { undo };
    },
  }),
  defineCommand({
    id: 'arrangement.select',
    category: 'slide',
    labelKey: 'cmd.arrangement.select',
    icon: ArrowDownUp,
    args: z.object({ presentationId: z.string(), arrangementId: z.string() }),
    permission: 'operate',
    aiAllowed: false,
    handler: ({ presentationId, arrangementId }) => {
      const p = getPresentation(presentationId);
      if (!p.arrangements.some((a) => a.id === arrangementId))
        throw new CommandFailure('not_found', 'Arrangement not found');
      const undo = libraryUndo();
      putPresentation({ ...p, activeArrangementId: arrangementId });
      return { undo };
    },
  }),

  /* ------------------------------ planner ------------------------------ */
  defineCommand({
    id: 'playlist.create',
    category: 'playlist',
    labelKey: 'cmd.playlist.create',
    icon: ListPlus,
    args: z.object({
      name: z.string().min(1),
      templateId: z.string().optional(),
      date: z.string().optional(),
      startTime: z.string().optional(),
    }),
    permission: 'edit',
    aiAllowed: false,
    handler: ({ name, templateId, date, startTime }) => {
      const tpl = templateId ? SERVICE_TEMPLATES.find((t) => t.id === templateId) : undefined;
      if (templateId && !tpl)
        throw new CommandFailure('not_found', `Service template not found: ${templateId}`);
      const undo = libraryUndo();
      const pl: Playlist = {
        id: newId('pl'),
        name,
        date,
        startTime: startTime ?? tpl?.startTime,
        templateId,
        items: (tpl?.items ?? []).map((i) => ({ ...i, id: newId('pi') })),
      };
      useLibrary.getState().upsertPlaylist(pl);
      return { result: pl.id, undo };
    },
  }),
  defineCommand({
    id: 'playlist.duplicate',
    category: 'playlist',
    labelKey: 'cmd.playlist.duplicate',
    icon: Copy,
    args: z.object({ playlistId: z.string(), name: z.string().optional(), date: z.string().optional() }),
    permission: 'edit',
    aiAllowed: false,
    handler: ({ playlistId, name, date }) => {
      const src = getPlaylist(playlistId);
      const undo = libraryUndo();
      const pl: Playlist = {
        ...structuredClone(src),
        id: newId('pl'),
        name: name ?? `${src.name} (copy)`,
        date: date ?? src.date,
        items: src.items.map((i) => ({ ...i, id: newId('pi') })),
      };
      useLibrary.getState().upsertPlaylist(pl);
      return { result: pl.id, undo };
    },
  }),
  defineCommand({
    id: 'playlist.update',
    category: 'playlist',
    labelKey: 'cmd.playlist.update',
    icon: PencilLine,
    args: z.object({
      playlistId: z.string(),
      patch: z.object({
        name: z.string().min(1).optional(),
        date: z.string().optional(),
        startTime: z.string().optional(),
        outline: z.string().optional(),
      }),
    }),
    permission: 'edit',
    aiAllowed: false,
    handler: ({ playlistId, patch }) => {
      const pl = getPlaylist(playlistId);
      const undo = libraryUndo();
      putPlaylist({ ...pl, ...patch });
      return { undo };
    },
  }),
  defineCommand({
    id: 'playlist.addItem',
    category: 'playlist',
    labelKey: 'cmd.playlist.addItem',
    icon: ListPlus,
    args: z.object({ playlistId: z.string(), item: playlistItem, index: z.number().int().min(0).optional() }),
    permission: 'edit',
    aiAllowed: false,
    handler: ({ playlistId, item, index }) => {
      const pl = getPlaylist(playlistId);
      const undo = libraryUndo();
      const it: PlaylistItem = { ...item, id: newId('pi') };
      const at = index ?? pl.items.length;
      putPlaylist({ ...pl, items: [...pl.items.slice(0, at), it, ...pl.items.slice(at)] });
      return { result: it.id, undo };
    },
  }),
  defineCommand({
    id: 'playlist.updateItem',
    category: 'playlist',
    labelKey: 'cmd.playlist.updateItem',
    icon: PencilLine,
    args: z.object({ playlistId: z.string(), itemId: z.string(), patch: playlistItem.partial() }),
    permission: 'edit',
    aiAllowed: false,
    handler: ({ playlistId, itemId, patch }) => {
      const pl = getPlaylist(playlistId);
      if (!pl.items.some((i) => i.id === itemId))
        throw new CommandFailure('not_found', 'Playlist item not found');
      const undo = libraryUndo();
      putPlaylist({ ...pl, items: pl.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) });
      return { undo };
    },
  }),
  defineCommand({
    id: 'playlist.removeItem',
    category: 'playlist',
    labelKey: 'cmd.playlist.removeItem',
    icon: ListX,
    args: z.object({ playlistId: z.string(), itemId: z.string() }),
    permission: 'edit',
    aiAllowed: false,
    handler: ({ playlistId, itemId }) => {
      const pl = getPlaylist(playlistId);
      const undo = libraryUndo();
      putPlaylist({ ...pl, items: pl.items.filter((i) => i.id !== itemId) });
      return { undo };
    },
  }),
  defineCommand({
    id: 'playlist.moveItem',
    category: 'playlist',
    labelKey: 'cmd.playlist.moveItem',
    icon: ArrowDownUp,
    args: z.object({ playlistId: z.string(), itemId: z.string(), toIndex: z.number().int().min(0) }),
    permission: 'edit',
    aiAllowed: false,
    handler: ({ playlistId, itemId, toIndex }) => {
      const pl = getPlaylist(playlistId);
      const from = pl.items.findIndex((i) => i.id === itemId);
      if (from === -1) throw new CommandFailure('not_found', 'Playlist item not found');
      const undo = libraryUndo();
      const items = [...pl.items];
      const [moved] = items.splice(from, 1);
      if (moved) items.splice(Math.min(toIndex, items.length), 0, moved);
      putPlaylist({ ...pl, items });
      return { undo };
    },
  }),
];

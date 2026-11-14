import {
  BookMarked,
  BookOpen,
  ListChecks,
  ListMusic,
  Music,
  Presentation,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import { z } from 'zod';
import { defineCommand } from '../registry';
import { CommandFailure } from '../bus';
import { parseReference, formatReference } from '@/features/bible/reference';
import { lookupPassage } from '@/features/bible/lookup';
import { findPresentation, useLibrary } from '@/state/library';
import { restoreLive, snapshotLive, takeIndex, useLive } from '@/state/live';
import type { CueSlide, Id, PlaylistItem } from '@/state/domain';

const undoable = () => {
  const snap = snapshotLive();
  return () => restoreLive(snap);
};

/** Loads a presentation into Live Control (preview), without putting anything on air. */
function loadPresentation(id: Id) {
  if (!findPresentation(id)) throw new CommandFailure('not_found', `Presentation not found: ${id}`);
  useLive.setState({ activePresentationId: id, adHoc: null, previewIndex: 0, programIndex: null });
}

async function loadScripture(reference: string): Promise<string> {
  const ref = parseReference(reference);
  if (!ref) throw new CommandFailure('invalid_args', `Not a scripture reference: "${reference}"`);
  const verses = await lookupPassage(ref);
  if (verses.length === 0) throw new CommandFailure('not_found', `${formatReference(ref)} is not available`);
  const title = formatReference({
    ...ref,
    verseEnd: ref.verseEnd === 0 ? (verses[verses.length - 1]?.verse ?? ref.verseStart) : ref.verseEnd,
  });
  const slides: CueSlide[] = verses.map((v, i) => ({
    id: `${v.book}-${v.chapter}-${v.verse}`,
    slideId: `${v.book}-${v.chapter}-${v.verse}`,
    text: v.text,
    groupId: 'scripture',
    groupName: `${v.book} ${v.chapter}:${v.verse}`,
    groupKey: 'scripture',
    index: i,
  }));
  useLive.setState({
    activePresentationId: null,
    adHoc: { title, slides, kind: 'scripture', reference: title },
    previewIndex: 0,
    programIndex: null,
  });
  return title;
}

async function loadPlaylistItem(item: PlaylistItem) {
  if (item.kind === 'header') return;
  if (item.kind === 'scripture' && item.reference) {
    await loadScripture(item.reference);
  } else if (
    (item.kind === 'song' || item.kind === 'presentation' || item.kind === 'announcement') &&
    item.refId
  ) {
    loadPresentation(item.refId);
  }
}

function playableItems(playlistId: Id | null) {
  const pl = useLibrary.getState().playlists.find((p) => p.id === playlistId);
  return pl ? pl.items.filter((i) => i.kind !== 'header') : [];
}

async function stepItem(dir: 1 | -1) {
  const s = useLive.getState();
  const items = playableItems(s.selectedPlaylistId);
  if (items.length === 0) throw new CommandFailure('not_found', 'No playlist selected');
  const idx = items.findIndex((i) => i.id === s.selectedItemId);
  const next = items[idx === -1 ? 0 : Math.max(0, Math.min(items.length - 1, idx + dir))];
  if (!next || next.id === s.selectedItemId) return;
  const undo = undoable();
  const prevItem = s.selectedItemId;
  useLive.setState({ selectedItemId: next.id });
  await loadPlaylistItem(next);
  return {
    undo: () => {
      undo();
      useLive.setState({ selectedItemId: prevItem });
    },
  };
}

export const contentCommands = [
  defineCommand({
    id: 'scripture.show',
    category: 'scripture',
    labelKey: 'cmd.scripture.show',
    icon: BookOpen,
    args: z.object({ reference: z.string().min(2), live: z.boolean().default(true) }),
    permission: 'operate',
    aiAllowed: true,
    handler: async ({ reference, live }) => {
      const undo = undoable();
      const title = await loadScripture(reference);
      if (live) takeIndex(0);
      return { undo, result: title };
    },
  }),
  defineCommand({
    id: 'scripture.load',
    category: 'scripture',
    labelKey: 'cmd.scripture.load',
    icon: BookMarked,
    args: z.object({ reference: z.string().min(2) }),
    permission: 'operate',
    aiAllowed: true,
    handler: async ({ reference }) => {
      const undo = undoable();
      const title = await loadScripture(reference);
      return { undo, result: title };
    },
  }),
  defineCommand({
    id: 'song.load',
    category: 'song',
    labelKey: 'cmd.song.load',
    icon: Music,
    args: z.object({ songId: z.string(), live: z.boolean().default(false) }),
    permission: 'operate',
    aiAllowed: true,
    handler: ({ songId, live }) => {
      const p = findPresentation(songId);
      if (!p || p.kind !== 'song') throw new CommandFailure('not_found', `Song not found: ${songId}`);
      const undo = undoable();
      loadPresentation(songId);
      if (live) takeIndex(0);
      return { undo };
    },
  }),
  defineCommand({
    id: 'presentation.open',
    category: 'slide',
    labelKey: 'cmd.presentation.open',
    icon: Presentation,
    args: z.object({ presentationId: z.string() }),
    permission: 'operate',
    aiAllowed: true,
    handler: ({ presentationId }) => {
      const undo = undoable();
      loadPresentation(presentationId);
      return { undo };
    },
  }),
  defineCommand({
    id: 'playlist.select',
    category: 'playlist',
    labelKey: 'cmd.playlist.select',
    icon: ListMusic,
    args: z.object({ playlistId: z.string() }),
    permission: 'operate',
    aiAllowed: false,
    handler: ({ playlistId }) => {
      if (!useLibrary.getState().playlists.some((p) => p.id === playlistId)) {
        throw new CommandFailure('not_found', `Playlist not found: ${playlistId}`);
      }
      const prev = useLive.getState().selectedPlaylistId;
      useLive.setState({ selectedPlaylistId: playlistId, selectedItemId: null });
      return { undo: () => useLive.setState({ selectedPlaylistId: prev }) };
    },
  }),
  defineCommand({
    id: 'playlist.selectItem',
    category: 'playlist',
    labelKey: 'cmd.playlist.selectItem',
    icon: ListChecks,
    args: z.object({ itemId: z.string() }),
    permission: 'operate',
    aiAllowed: true,
    handler: async ({ itemId }) => {
      const s = useLive.getState();
      const pl = useLibrary.getState().playlists.find((p) => p.items.some((i) => i.id === itemId));
      const item = pl?.items.find((i) => i.id === itemId);
      if (!pl || !item) throw new CommandFailure('not_found', `Playlist item not found: ${itemId}`);
      const undo = undoable();
      const prev = { selectedPlaylistId: s.selectedPlaylistId, selectedItemId: s.selectedItemId };
      useLive.setState({ selectedPlaylistId: pl.id, selectedItemId: item.id });
      await loadPlaylistItem(item);
      return {
        undo: () => {
          undo();
          useLive.setState(prev);
        },
      };
    },
  }),
  defineCommand({
    id: 'playlist.nextItem',
    category: 'playlist',
    labelKey: 'cmd.playlist.nextItem',
    icon: SkipForward,
    args: z.object({}),
    permission: 'operate',
    shortcut: 'PageDown',
    aiAllowed: true,
    palette: true,
    handler: () => stepItem(1),
  }),
  defineCommand({
    id: 'playlist.previousItem',
    category: 'playlist',
    labelKey: 'cmd.playlist.previousItem',
    icon: SkipBack,
    args: z.object({}),
    permission: 'operate',
    shortcut: 'PageUp',
    aiAllowed: true,
    palette: true,
    handler: () => stepItem(-1),
  }),
];

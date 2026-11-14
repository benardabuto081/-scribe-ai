import { create } from 'zustand';
import { seed } from '@/mocks';
import type {
  Background,
  Id,
  Library,
  Look,
  Macro,
  MediaItem,
  Message,
  Playlist,
  Presentation,
  Prop,
  ScriptureVerse,
  Theme,
  Timer,
} from './domain';

/**
 * Library content (presentations, playlists, looks, ...). Phase A: seeded from mocks, in-memory.
 * Phase B: backed by SQLite through Tauri commands; the store API stays the same.
 */
type LibraryState = {
  libraries: Library[];
  presentations: Presentation[];
  playlists: Playlist[];
  looks: Look[];
  themes: Theme[];
  backgrounds: Background[];
  props: Prop[];
  messages: Message[];
  timers: Timer[];
  media: MediaItem[];
  macros: Macro[];
  kjv: ScriptureVerse[];
  upsertPresentation: (p: Presentation) => void;
  removePresentation: (id: Id) => Presentation | undefined;
  upsertPlaylist: (p: Playlist) => void;
};

export const useLibrary = create<LibraryState>((set, get) => ({
  ...seed,
  upsertPresentation: (p) =>
    set((s) => ({
      presentations: s.presentations.some((x) => x.id === p.id)
        ? s.presentations.map((x) => (x.id === p.id ? p : x))
        : [...s.presentations, p],
    })),
  removePresentation: (id) => {
    const found = get().presentations.find((p) => p.id === id);
    set((s) => ({ presentations: s.presentations.filter((p) => p.id !== id) }));
    return found;
  },
  upsertPlaylist: (p) =>
    set((s) => ({
      playlists: s.playlists.some((x) => x.id === p.id)
        ? s.playlists.map((x) => (x.id === p.id ? p : x))
        : [...s.playlists, p],
    })),
}));

export const findPresentation = (id: Id | null | undefined) =>
  id ? useLibrary.getState().presentations.find((p) => p.id === id) : undefined;

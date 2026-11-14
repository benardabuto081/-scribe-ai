import { create } from 'zustand';
import { GROUP_COLORS } from '@/design-system/tokens/tokens';
import { EMPTY_OUTPUT_STATE, type OutputState, type SlideContent } from '@/outputs/types';
import { sequenceOf, type CueSlide, type Id, type LayerKey, type ServiceState } from './domain';
import { findPresentation, useLibrary } from './library';

/**
 * Live (operating) state. `program` is exactly what the outputs show; it is published to the
 * output windows by `outputs/sync.ts`. Mutations happen only through Command Bus handlers.
 */
export type LiveState = {
  /** Presentation open in the Live Control slide grid (preview side). */
  activePresentationId: Id | null;
  /** Ad-hoc sequence (e.g. a scripture passage) when not showing a library presentation. */
  adHoc: { title: string; slides: CueSlide[]; kind: 'scripture' | 'text'; reference?: string } | null;
  previewIndex: number;
  /** Index on air within the active sequence, or null when the slide layer is clear. */
  programIndex: number | null;
  selectedPlaylistId: Id | null;
  selectedItemId: Id | null;
  audio: { trackId: Id; name: string; volume: number; playing: boolean } | null;
  program: OutputState;
};

export const useLive = create<LiveState>(() => ({
  activePresentationId: null,
  adHoc: null,
  previewIndex: 0,
  programIndex: null,
  selectedPlaylistId: null,
  selectedItemId: null,
  audio: null,
  program: initialProgram(),
}));

function initialProgram(): OutputState {
  const { looks, backgrounds, themes } = useLibrary.getState();
  const look = looks[0];
  const bg = look ? backgrounds.find((b) => b.id === look.backgroundId) : undefined;
  const theme = look ? themes.find((t) => t.id === look.themeId) : undefined;
  return {
    ...EMPTY_OUTPUT_STATE,
    background: bg ? { id: bg.id, css: bg.css } : null,
    theme: theme ? themeStyle(theme) : EMPTY_OUTPUT_STATE.theme,
    look: look ? { id: look.id, name: look.name, layers: look.layers } : EMPTY_OUTPUT_STATE.look,
  };
}

export function themeStyle(t: {
  fontFamily: string;
  fontWeight: number;
  textColor: string;
  textSize: number;
  align: 'center' | 'left' | 'bottom';
  textShadow: boolean;
  uppercase?: boolean;
  panel?: boolean;
}): OutputState['theme'] {
  return {
    fontFamily: t.fontFamily,
    fontWeight: t.fontWeight,
    textColor: t.textColor,
    textSize: t.textSize,
    align: t.align,
    textShadow: t.textShadow,
    uppercase: t.uppercase,
    panel: t.panel,
  };
}

/** The slide sequence currently loaded in Live Control. */
export function currentSequence(s: LiveState = useLive.getState()): CueSlide[] {
  if (s.adHoc) return s.adHoc.slides;
  const p = findPresentation(s.activePresentationId);
  return p ? sequenceOf(p) : [];
}

export function toSlideContent(s: LiveState, cue: CueSlide | undefined): SlideContent | null {
  if (!cue) return null;
  if (s.adHoc) {
    return {
      key: `${s.adHoc.title}:${cue.id}`,
      text: cue.text,
      kind: s.adHoc.kind,
      reference: s.adHoc.kind === 'scripture' ? cue.groupName : undefined,
      title: s.adHoc.title,
      groupName: cue.groupName,
      groupColor: GROUP_COLORS[cue.groupKey],
    };
  }
  const p = findPresentation(s.activePresentationId);
  return {
    key: `${p?.id ?? 'none'}:${cue.id}`,
    text: cue.text,
    kind: p?.kind === 'song' ? 'lyric' : 'text',
    title: p?.title,
    groupName: cue.groupName,
    groupColor: GROUP_COLORS[cue.groupKey],
    notes: cue.notes,
  };
}

/** Applies a patch to the program state, bumping the version so outputs accept it. */
export function patchProgram(patch: Partial<OutputState>) {
  useLive.setState((s) => ({
    program: { ...s.program, ...patch, version: s.program.version + 1, updatedAt: Date.now() },
  }));
}

/** Snapshot/restore helpers used for undo. */
export function snapshotLive() {
  const s = useLive.getState();
  return {
    activePresentationId: s.activePresentationId,
    adHoc: s.adHoc,
    previewIndex: s.previewIndex,
    programIndex: s.programIndex,
    program: s.program,
  };
}
export function restoreLive(snap: ReturnType<typeof snapshotLive>) {
  useLive.setState((s) => ({
    ...snap,
    program: { ...snap.program, version: s.program.version + 1, updatedAt: Date.now() },
  }));
}

/** Puts the cue at `index` on air (and updates next-slide for the stage display). */
export function takeIndex(index: number) {
  const s = useLive.getState();
  const seq = currentSequence(s);
  const clamped = Math.max(0, Math.min(index, seq.length - 1));
  const cue = seq[clamped];
  if (!cue) return;
  useLive.setState({ programIndex: clamped, previewIndex: Math.min(clamped + 1, seq.length - 1) });
  const after = useLive.getState();
  patchProgram({
    slide: toSlideContent(after, cue),
    nextSlide: toSlideContent(after, seq[clamped + 1]),
    blackout: false,
    logo: false,
  });
}

export function clearLayer(layer: LayerKey) {
  switch (layer) {
    case 'slide':
      useLive.setState({ programIndex: null });
      return patchProgram({ slide: null, nextSlide: null });
    case 'media':
      return patchProgram({ media: null });
    case 'props':
      return patchProgram({ props: [] });
    case 'messages':
      return patchProgram({ message: null });
    case 'background':
      return patchProgram({ background: null });
    case 'audio':
      useLive.setState({ audio: null });
      return;
  }
}

export function setServiceState(serviceState: ServiceState) {
  patchProgram({ serviceState });
}

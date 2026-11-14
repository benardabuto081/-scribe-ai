import { Blend, ChevronLeft, ChevronRight, Eye, MonitorPlay, Play, Type } from 'lucide-react';
import { z } from 'zod';
import { defineCommand } from '../registry';
import { CommandFailure } from '../bus';
import {
  clearLayer,
  currentSequence,
  patchProgram,
  restoreLive,
  snapshotLive,
  takeIndex,
  useLive,
} from '@/state/live';
import { TRANSITION_KINDS } from '@/outputs/types';

const undoable = () => {
  const snap = snapshotLive();
  return () => restoreLive(snap);
};

export const slideCommands = [
  defineCommand({
    id: 'slide.trigger',
    category: 'slide',
    labelKey: 'cmd.slide.trigger',
    icon: MonitorPlay,
    args: z.object({ index: z.number().int().min(0) }),
    permission: 'operate',
    aiAllowed: true,
    handler: ({ index }) => {
      if (!currentSequence()[index]) throw new CommandFailure('not_found', `No slide at index ${index}`);
      const undo = undoable();
      takeIndex(index);
      return { undo };
    },
  }),
  defineCommand({
    id: 'slide.take',
    category: 'slide',
    labelKey: 'cmd.slide.take',
    icon: Play,
    args: z.object({}),
    permission: 'operate',
    shortcut: 'Enter',
    aiAllowed: true,
    palette: true,
    handler: () => {
      const { previewIndex } = useLive.getState();
      if (!currentSequence()[previewIndex]) throw new CommandFailure('not_found', 'Nothing in preview');
      const undo = undoable();
      takeIndex(previewIndex);
      return { undo };
    },
  }),
  defineCommand({
    id: 'slide.next',
    category: 'slide',
    labelKey: 'cmd.slide.next',
    icon: ChevronRight,
    args: z.object({}),
    permission: 'operate',
    shortcut: 'ArrowRight',
    aiAllowed: true,
    palette: true,
    handler: () => {
      const s = useLive.getState();
      const seq = currentSequence(s);
      if (seq.length === 0) throw new CommandFailure('not_found', 'No presentation loaded');
      const next = s.programIndex === null ? 0 : s.programIndex + 1;
      if (next >= seq.length) return;
      const undo = undoable();
      takeIndex(next);
      return { undo };
    },
  }),
  defineCommand({
    id: 'slide.previous',
    category: 'slide',
    labelKey: 'cmd.slide.previous',
    icon: ChevronLeft,
    args: z.object({}),
    permission: 'operate',
    shortcut: 'ArrowLeft',
    aiAllowed: true,
    palette: true,
    handler: () => {
      const s = useLive.getState();
      if (s.programIndex === null || s.programIndex === 0) return;
      const undo = undoable();
      takeIndex(s.programIndex - 1);
      return { undo };
    },
  }),
  defineCommand({
    id: 'slide.preview',
    category: 'slide',
    labelKey: 'cmd.slide.preview',
    icon: Eye,
    args: z.object({ index: z.number().int().min(0) }),
    permission: 'operate',
    aiAllowed: true,
    handler: ({ index }) => {
      if (!currentSequence()[index]) throw new CommandFailure('not_found', `No slide at index ${index}`);
      const prev = useLive.getState().previewIndex;
      useLive.setState({ previewIndex: index });
      return { undo: () => useLive.setState({ previewIndex: prev }) };
    },
  }),
  defineCommand({
    id: 'slide.clear',
    category: 'slide',
    labelKey: 'cmd.slide.clear',
    icon: Type,
    args: z.object({}),
    permission: 'operate',
    shortcut: 'F1',
    aiAllowed: true,
    palette: true,
    handler: () => {
      const undo = undoable();
      clearLayer('slide');
      return { undo };
    },
  }),
  defineCommand({
    id: 'transition.set',
    category: 'slide',
    labelKey: 'cmd.transition.set',
    icon: Blend,
    args: z.object({
      kind: z.enum(TRANSITION_KINDS),
      durationMs: z.number().int().min(0).max(5000).default(400),
    }),
    permission: 'operate',
    aiAllowed: false,
    handler: ({ kind, durationMs }) => {
      const prev = useLive.getState().program.transition;
      patchProgram({ transition: { kind, durationMs } });
      return { undo: () => patchProgram({ transition: prev }) };
    },
  }),
];

import {
  Activity,
  AudioLines,
  Eye,
  Film,
  MessageSquareOff,
  MessageSquareText,
  MonitorSpeaker,
  Pause,
  Play,
  RotateCcw,
  Square,
  Sticker,
  StickyNote,
  TimerReset,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { z } from 'zod';
import { defineCommand } from '../registry';
import { CommandFailure, execute } from '../bus';
import { useLibrary } from '@/state/library';
import { patchProgram, useLive } from '@/state/live';
import type { TimerState } from '@/outputs/types';

const program = () => useLive.getState().program;

function timerState(id: string): TimerState {
  const existing = program().timers.find((t) => t.id === id);
  if (existing) return existing;
  const def = useLibrary.getState().timers.find((t) => t.id === id);
  if (!def) throw new CommandFailure('not_found', `Timer not found: ${id}`);
  return {
    id: def.id,
    name: def.name,
    mode: def.mode,
    startedAt: null,
    accumulatedMs: 0,
    durationSec: def.durationSec,
    targetTime: def.targetTime,
    overrun: def.overrun,
    showOnAudience: def.mode === 'countdownTo',
    showOnStage: true,
  };
}

function putTimer(t: TimerState) {
  const others = program().timers.filter((x) => x.id !== t.id);
  patchProgram({ timers: [...others, t] });
}

function restoreTimers(prev: TimerState[]) {
  return () => patchProgram({ timers: prev });
}

export function fillTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => values[k] ?? `{${k}}`);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const overlayCommands = [
  /* ---------------- timers ---------------- */
  defineCommand({
    id: 'timer.start',
    category: 'timer',
    labelKey: 'cmd.timer.start',
    icon: Play,
    args: z.object({ timerId: z.string() }),
    permission: 'operate',
    aiAllowed: true,
    handler: ({ timerId }) => {
      const prev = program().timers;
      const t = timerState(timerId);
      if (t.startedAt === null) putTimer({ ...t, startedAt: Date.now() });
      return { undo: restoreTimers(prev) };
    },
  }),
  defineCommand({
    id: 'timer.stop',
    category: 'timer',
    labelKey: 'cmd.timer.stop',
    icon: Pause,
    args: z.object({ timerId: z.string() }),
    permission: 'operate',
    aiAllowed: true,
    handler: ({ timerId }) => {
      const prev = program().timers;
      const t = timerState(timerId);
      if (t.startedAt !== null) {
        putTimer({ ...t, startedAt: null, accumulatedMs: t.accumulatedMs + (Date.now() - t.startedAt) });
      }
      return { undo: restoreTimers(prev) };
    },
  }),
  defineCommand({
    id: 'timer.reset',
    category: 'timer',
    labelKey: 'cmd.timer.reset',
    icon: RotateCcw,
    args: z.object({ timerId: z.string() }),
    permission: 'operate',
    aiAllowed: true,
    handler: ({ timerId }) => {
      const prev = program().timers;
      const t = timerState(timerId);
      putTimer({ ...t, startedAt: null, accumulatedMs: 0 });
      return { undo: restoreTimers(prev) };
    },
  }),
  defineCommand({
    id: 'timer.addTime',
    category: 'timer',
    labelKey: 'cmd.timer.addTime',
    icon: TimerReset,
    args: z.object({ timerId: z.string(), seconds: z.number().int().min(-3600).max(3600) }),
    permission: 'operate',
    aiAllowed: false,
    handler: ({ timerId, seconds }) => {
      const prev = program().timers;
      const t = timerState(timerId);
      // Adding time to a countdown = subtracting elapsed.
      putTimer({ ...t, accumulatedMs: t.accumulatedMs - seconds * 1000 });
      return { undo: restoreTimers(prev) };
    },
  }),
  defineCommand({
    id: 'timer.setVisibility',
    category: 'timer',
    labelKey: 'cmd.timer.setVisibility',
    icon: Eye,
    args: z.object({ timerId: z.string(), audience: z.boolean().optional(), stage: z.boolean().optional() }),
    permission: 'operate',
    aiAllowed: false,
    handler: ({ timerId, audience, stage }) => {
      const prev = program().timers;
      const t = timerState(timerId);
      putTimer({ ...t, showOnAudience: audience ?? t.showOnAudience, showOnStage: stage ?? t.showOnStage });
      return { undo: restoreTimers(prev) };
    },
  }),

  /* ---------------- messages ---------------- */
  defineCommand({
    id: 'message.show',
    category: 'message',
    labelKey: 'cmd.message.show',
    icon: MessageSquareText,
    args: z
      .object({
        messageId: z.string().optional(),
        text: z.string().optional(),
        values: z.record(z.string(), z.string()).default({}),
      })
      .refine((a) => a.messageId || a.text, { message: 'messageId or text is required' }),
    permission: 'operate',
    aiAllowed: true,
    handler: ({ messageId, text, values }) => {
      let body = text ?? '';
      if (messageId) {
        const m = useLibrary.getState().messages.find((x) => x.id === messageId);
        if (!m) throw new CommandFailure('not_found', `Message not found: ${messageId}`);
        body = fillTemplate(m.template, values);
      }
      const prev = program().message;
      patchProgram({ message: { id: messageId ?? `adhoc-${Date.now()}`, text: body } });
      return { undo: () => patchProgram({ message: prev }) };
    },
  }),
  defineCommand({
    id: 'message.hide',
    category: 'message',
    labelKey: 'cmd.message.hide',
    icon: MessageSquareOff,
    args: z.object({}),
    permission: 'operate',
    aiAllowed: true,
    palette: true,
    handler: () => {
      const prev = program().message;
      patchProgram({ message: null });
      return { undo: () => patchProgram({ message: prev }) };
    },
  }),
  defineCommand({
    id: 'stage.message',
    category: 'message',
    labelKey: 'cmd.stage.message',
    icon: MonitorSpeaker,
    args: z.object({ text: z.string().nullable() }),
    permission: 'operate',
    aiAllowed: false,
    handler: ({ text }) => {
      const prev = program().stage;
      patchProgram({ stage: { ...prev, stageMessage: text } });
      return { undo: () => patchProgram({ stage: prev }) };
    },
  }),

  /* ---------------- props ---------------- */
  defineCommand({
    id: 'prop.toggle',
    category: 'prop',
    labelKey: 'cmd.prop.toggle',
    icon: Sticker,
    args: z.object({ propId: z.string(), on: z.boolean().optional() }),
    permission: 'operate',
    aiAllowed: true,
    handler: ({ propId, on }) => {
      const def = useLibrary.getState().props.find((p) => p.id === propId);
      if (!def) throw new CommandFailure('not_found', `Prop not found: ${propId}`);
      const prev = program().props;
      const showing = prev.some((p) => p.id === propId);
      const show = on ?? !showing;
      const next = prev.filter((p) => p.id !== propId);
      if (show) next.push({ id: def.id, kind: def.kind, title: def.title, subtitle: def.subtitle });
      patchProgram({ props: next });
      return { undo: () => patchProgram({ props: prev }) };
    },
  }),
  defineCommand({
    id: 'prop.clearAll',
    category: 'prop',
    labelKey: 'cmd.prop.clearAll',
    icon: StickyNote,
    args: z.object({}),
    permission: 'operate',
    aiAllowed: true,
    palette: true,
    handler: () => {
      const prev = program().props;
      patchProgram({ props: [] });
      return { undo: () => patchProgram({ props: prev }) };
    },
  }),

  /* ---------------- media ---------------- */
  defineCommand({
    id: 'media.play',
    category: 'media',
    labelKey: 'cmd.media.play',
    icon: Film,
    args: z.object({ mediaId: z.string() }),
    permission: 'operate',
    aiAllowed: true,
    handler: ({ mediaId }) => {
      const m = useLibrary.getState().media.find((x) => x.id === mediaId);
      if (!m || m.kind === 'audio')
        throw new CommandFailure('not_found', `Visual media not found: ${mediaId}`);
      const prev = program().media;
      patchProgram({ media: { id: m.id, name: m.name, css: m.css, playing: true } });
      return { undo: () => patchProgram({ media: prev }) };
    },
  }),
  defineCommand({
    id: 'media.stop',
    category: 'media',
    labelKey: 'cmd.media.stop',
    icon: Square,
    args: z.object({}),
    permission: 'operate',
    aiAllowed: true,
    palette: true,
    handler: () => {
      const prev = program().media;
      patchProgram({ media: null });
      return { undo: () => patchProgram({ media: prev }) };
    },
  }),

  /* ---------------- audio ---------------- */
  defineCommand({
    id: 'audio.play',
    category: 'audio',
    labelKey: 'cmd.audio.play',
    icon: Volume2,
    args: z.object({ trackId: z.string(), volume: z.number().min(0).max(1).default(0.8) }),
    permission: 'operate',
    aiAllowed: true,
    handler: ({ trackId, volume }) => {
      const m = useLibrary.getState().media.find((x) => x.id === trackId && x.kind === 'audio');
      if (!m) throw new CommandFailure('not_found', `Audio track not found: ${trackId}`);
      const prev = useLive.getState().audio;
      useLive.setState({ audio: { trackId: m.id, name: m.name, volume, playing: true } });
      return { undo: () => useLive.setState({ audio: prev }) };
    },
  }),
  defineCommand({
    id: 'audio.stop',
    category: 'audio',
    labelKey: 'cmd.audio.stop',
    icon: VolumeX,
    args: z.object({}),
    permission: 'operate',
    aiAllowed: true,
    palette: true,
    handler: () => {
      const prev = useLive.getState().audio;
      useLive.setState({ audio: null });
      return { undo: () => useLive.setState({ audio: prev }) };
    },
  }),
  defineCommand({
    id: 'audio.fade',
    category: 'audio',
    labelKey: 'cmd.audio.fade',
    icon: AudioLines,
    args: z.object({
      to: z.number().min(0).max(1).default(0),
      durationMs: z.number().int().min(0).max(20000).default(3000),
    }),
    permission: 'operate',
    aiAllowed: true,
    palette: true,
    handler: async ({ to, durationMs }) => {
      const start = useLive.getState().audio;
      if (!start) throw new CommandFailure('not_found', 'No audio playing');
      const steps = Math.max(1, Math.round(durationMs / 100));
      for (let i = 1; i <= steps; i++) {
        await sleep(durationMs / steps);
        const cur = useLive.getState().audio;
        if (!cur || cur.trackId !== start.trackId) return;
        useLive.setState({ audio: { ...cur, volume: start.volume + ((to - start.volume) * i) / steps } });
      }
      if (to === 0) useLive.setState({ audio: null });
      return { undo: () => useLive.setState({ audio: start }) };
    },
  }),

  /* ---------------- macros ---------------- */
  defineCommand({
    id: 'macro.run',
    category: 'macro',
    labelKey: 'cmd.macro.run',
    icon: Zap,
    args: z.object({ macroId: z.string() }),
    permission: 'operate',
    aiAllowed: true,
    handler: async ({ macroId }, ctx) => {
      const mac = useLibrary.getState().macros.find((m) => m.id === macroId);
      if (!mac) throw new CommandFailure('not_found', `Macro not found: ${macroId}`);
      const failures: string[] = [];
      for (const step of mac.steps) {
        if (step.delayMs) await sleep(step.delayMs);
        // Each step is its own audited command with source 'macro' (or 'ai' when the AI ran the macro).
        const out = await execute(step.commandId, step.args ?? {}, {
          source: ctx.source === 'ai' ? 'ai' : 'macro',
          approved: ctx.approved,
          explanation: `macro:${mac.name}`,
        });
        if (!out.ok) failures.push(`${step.commandId}: ${out.error.message}`);
      }
      if (failures.length) throw new CommandFailure('handler_error', failures.join('; '));
    },
  }),

  /* ---------------- service state ---------------- */
  defineCommand({
    id: 'service.setState',
    category: 'app',
    labelKey: 'cmd.service.setState',
    icon: Activity,
    args: z.object({ state: z.enum(['preService', 'worship', 'sermon', 'prayer', 'announcements']) }),
    permission: 'operate',
    aiAllowed: true,
    handler: ({ state }) => {
      const prev = program().serviceState;
      patchProgram({ serviceState: state });
      return { undo: () => patchProgram({ serviceState: prev }) };
    },
  }),
];

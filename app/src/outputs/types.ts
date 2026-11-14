import { z } from 'zod';

/**
 * Program (on-air) state rendered by Audience and Stage output windows.
 *
 * Authority: the Rust process holds the latest snapshot (see src-tauri/src/output_state.rs) and
 * broadcasts it to every output window. The Studio window only *sends* updates. If the Studio
 * crashes or closes, outputs keep the last snapshot and keep animating (clock, timers) locally.
 */

export const TRANSITION_KINDS = ['cut', 'fade', 'dissolve', 'push', 'slide', 'wipe', 'zoom', 'blur'] as const;
export type TransitionKind = (typeof TRANSITION_KINDS)[number];

/** Designed-canvas element (same shape as the editor's SlideElement; 1920x1080 design space). */
const Element = z.object({
  id: z.string(),
  type: z.enum(['text', 'shape']),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  rotation: z.number(),
  text: z.string().optional(),
  style: z.object({
    fontFamily: z.string(),
    fontSize: z.number(),
    fontWeight: z.number(),
    color: z.string(),
    align: z.enum(['left', 'center', 'right']),
    fill: z.string(),
    shape: z.enum(['rect', 'ellipse']),
    radius: z.number(),
    opacity: z.number(),
    shadow: z.boolean(),
  }),
});
export type OutputElement = z.infer<typeof Element>;

const SlideContent = z.object({
  key: z.string(), // changes whenever the content changes (drives transitions)
  text: z.string(),
  kind: z.enum(['lyric', 'scripture', 'text']),
  reference: z.string().optional(),
  groupName: z.string().optional(),
  groupColor: z.string().optional(),
  notes: z.string().optional(),
  title: z.string().optional(),
  /** When present, the slide renders as a designed canvas instead of themed text. */
  elements: z.array(Element).optional(),
});
export type SlideContent = z.infer<typeof SlideContent>;

const ThemeStyle = z.object({
  fontFamily: z.string(),
  fontWeight: z.number(),
  textColor: z.string(),
  textSize: z.number(),
  align: z.enum(['center', 'left', 'bottom']),
  textShadow: z.boolean(),
  uppercase: z.boolean().optional(),
  panel: z.boolean().optional(),
});
export type ThemeStyle = z.infer<typeof ThemeStyle>;

const PropState = z.object({
  id: z.string(),
  kind: z.enum(['lowerThird', 'logo', 'clock', 'social', 'giving', 'qr', 'ticker']),
  title: z.string().optional(),
  subtitle: z.string().optional(),
});

const TimerState = z.object({
  id: z.string(),
  name: z.string(),
  mode: z.enum(['countdown', 'countdownTo', 'elapsed', 'clock']),
  /** Epoch ms when the timer was (re)started; null when stopped. */
  startedAt: z.number().nullable(),
  /** Accumulated ms before the current run (for pause/resume). */
  accumulatedMs: z.number(),
  durationSec: z.number().optional(),
  targetTime: z.string().optional(),
  overrun: z.enum(['continue', 'flash', 'stop']),
  showOnAudience: z.boolean(),
  showOnStage: z.boolean(),
});
export type TimerState = z.infer<typeof TimerState>;

export const OutputStateSchema = z.object({
  /** Identifies one Studio run. A new session resets ordering in outputs (browser transport). */
  session: z.string(),
  /** Monotonic within a session; in Tauri it is assigned by Rust (never the wall clock). */
  version: z.number(),
  updatedAt: z.number(),
  slide: SlideContent.nullable(),
  nextSlide: SlideContent.nullable(),
  background: z.object({ id: z.string(), css: z.string() }).nullable(),
  media: z.object({ id: z.string(), name: z.string(), css: z.string(), playing: z.boolean() }).nullable(),
  theme: ThemeStyle,
  look: z.object({
    id: z.string(),
    name: z.string(),
    layers: z.object({
      background: z.boolean(),
      slide: z.boolean(),
      media: z.boolean(),
      props: z.boolean(),
      messages: z.boolean(),
    }),
  }),
  transition: z.object({ kind: z.enum(TRANSITION_KINDS), durationMs: z.number() }),
  blackout: z.boolean(),
  logo: z.boolean(),
  props: z.array(PropState),
  message: z.object({ id: z.string(), text: z.string() }).nullable(),
  timers: z.array(TimerState),
  serviceState: z.enum(['preService', 'worship', 'sermon', 'prayer', 'announcements']),
  stage: z.object({ layoutId: z.string(), stageMessage: z.string().nullable() }),
  testPattern: z.object({ audience: z.boolean(), stage: z.boolean() }),
  identify: z.object({ audience: z.boolean(), stage: z.boolean() }),
  aiTranscriptLine: z.string().nullable(),
});
export type OutputState = z.infer<typeof OutputStateSchema>;

export const OUTPUT_ROLES = ['audience', 'stage'] as const;
export type OutputRole = (typeof OUTPUT_ROLES)[number];

export const EMPTY_OUTPUT_STATE: OutputState = {
  session: '',
  version: 0,
  updatedAt: 0,
  slide: null,
  nextSlide: null,
  background: null,
  media: null,
  theme: {
    fontFamily: 'Montserrat Variable',
    fontWeight: 700,
    textColor: '#ffffff',
    textSize: 6,
    align: 'center',
    textShadow: true,
  },
  look: {
    id: 'default',
    name: 'Default',
    layers: { background: true, slide: true, media: true, props: true, messages: true },
  },
  transition: { kind: 'fade', durationMs: 400 },
  blackout: false,
  logo: false,
  props: [],
  message: null,
  timers: [],
  serviceState: 'preService',
  stage: { layoutId: 'stage-lyrics', stageMessage: null },
  testPattern: { audience: false, stage: false },
  identify: { audience: false, stage: false },
  aiTranscriptLine: null,
};

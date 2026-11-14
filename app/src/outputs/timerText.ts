import type { TimerState } from './types';

export type TimerReading = { text: string; overrun: boolean; running: boolean; remainingMs: number | null };

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

export function formatDuration(ms: number): string {
  const neg = ms < 0;
  const total = Math.floor(Math.abs(ms) / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const body = h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
  return neg ? `-${body}` : body;
}

export function formatClock(d: Date, hour12 = false): string {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12 });
}

/** Pure timer evaluation from a snapshot, so every window computes the same value independently. */
export function readTimer(t: TimerState, now: number = Date.now()): TimerReading {
  const elapsed = t.accumulatedMs + (t.startedAt !== null ? now - t.startedAt : 0);
  const running = t.startedAt !== null;
  switch (t.mode) {
    case 'elapsed':
      return { text: formatDuration(elapsed), overrun: false, running, remainingMs: null };
    case 'clock':
      return { text: formatClock(new Date(now)), overrun: false, running: true, remainingMs: null };
    case 'countdown': {
      const remaining = (t.durationSec ?? 0) * 1000 - elapsed;
      const clamped = t.overrun === 'stop' ? Math.max(0, remaining) : remaining;
      return { text: formatDuration(clamped), overrun: remaining < 0, running, remainingMs: remaining };
    }
    case 'countdownTo': {
      const [hh, mm] = (t.targetTime ?? '00:00').split(':').map(Number);
      const target = new Date(now);
      target.setHours(hh ?? 0, mm ?? 0, 0, 0);
      const remaining = target.getTime() - now;
      const clamped = t.overrun === 'stop' ? Math.max(0, remaining) : remaining;
      return { text: formatDuration(clamped), overrun: remaining < 0, running: true, remainingMs: remaining };
    }
  }
}

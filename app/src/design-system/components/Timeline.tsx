import type { ReactNode } from 'react';
import { cn } from '../primitives/cn';

export type TimelineClip = {
  id: string;
  start: number; // seconds
  duration: number; // seconds
  label: string;
  color?: string; // data color (group/track color)
};
export type TimelineTrack = { id: string; label: string; icon?: ReactNode; clips: TimelineClip[] };

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Track-based timeline (presentation timeline, service plan running order). */
export function Timeline({
  tracks,
  duration,
  playhead,
  onScrub,
  selectedClipId,
  onSelectClip,
  pxPerSecond = 8,
  label,
}: {
  tracks: TimelineTrack[];
  duration: number;
  playhead?: number;
  onScrub?: (sec: number) => void;
  selectedClipId?: string | null;
  onSelectClip?: (id: string) => void;
  pxPerSecond?: number;
  label: string;
}) {
  const width = duration * pxPerSecond;
  const tickEvery = pxPerSecond >= 8 ? 30 : pxPerSecond >= 3 ? 60 : 300;
  const ticks = Array.from({ length: Math.floor(duration / tickEvery) + 1 }, (_, i) => i * tickEvery);

  return (
    <div
      aria-label={label}
      role="group"
      className="flex min-h-0 overflow-hidden rounded-lg border border-line bg-surface-1"
    >
      <div className="w-36 shrink-0 border-r border-line">
        <div className="h-7 border-b border-line" />
        {tracks.map((t) => (
          <div
            key={t.id}
            className="flex h-12 items-center gap-2 border-b border-line/60 px-3 text-xs font-medium text-fg-muted"
          >
            {t.icon}
            <span className="truncate">{t.label}</span>
          </div>
        ))}
      </div>
      <div className="relative min-w-0 flex-1 overflow-x-auto">
        <div style={{ width }} className="relative">
          <div
            className="relative h-7 cursor-ew-resize border-b border-line"
            onPointerDown={(e) => {
              if (!onScrub) return;
              const rect = e.currentTarget.getBoundingClientRect();
              onScrub(Math.max(0, Math.min(duration, (e.clientX - rect.left) / pxPerSecond)));
            }}
          >
            {ticks.map((t) => (
              <span
                key={t}
                className="absolute top-0 flex h-full items-end border-l border-line pb-1 pl-1 text-2xs text-fg-subtle tabular-nums"
                style={{ left: t * pxPerSecond }}
              >
                {fmt(t)}
              </span>
            ))}
          </div>
          {tracks.map((t) => (
            <div key={t.id} className="relative h-12 border-b border-line/60">
              {t.clips.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelectClip?.(c.id)}
                  aria-pressed={selectedClipId === c.id}
                  className={cn(
                    'focus-ring absolute top-1.5 bottom-1.5 cursor-pointer overflow-hidden rounded-sm border px-2 text-left text-xs font-medium text-fg',
                    'transition-[filter,border-color] duration-fast hover:brightness-125',
                    selectedClipId === c.id ? 'border-fg' : 'border-transparent',
                  )}
                  style={{
                    left: c.start * pxPerSecond,
                    width: Math.max(8, c.duration * pxPerSecond - 2),
                    background: `color-mix(in srgb, ${c.color ?? 'var(--sa-accent)'} 32%, var(--sa-surface-3))`,
                    boxShadow: `inset 3px 0 0 ${c.color ?? 'var(--sa-accent)'}`,
                  }}
                >
                  <span className="block truncate">{c.label}</span>
                </button>
              ))}
            </div>
          ))}
          {playhead !== undefined && (
            <div
              aria-hidden
              className="pointer-events-none absolute top-0 bottom-0 w-px bg-live"
              style={{ transform: `translateX(${playhead * pxPerSecond}px)` }}
            >
              <span className="absolute -top-0.5 -left-1.5 size-3 rotate-45 bg-live" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

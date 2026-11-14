import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { X } from 'lucide-react';
import { cn } from '../primitives/cn';
import { Icon } from '../primitives/Icon';

export type Tone = 'neutral' | 'accent' | 'success' | 'warn' | 'danger' | 'info' | 'live' | 'ai';

const tones: Record<Tone, string> = {
  neutral: 'bg-surface-4 text-fg-muted border-line',
  accent: 'bg-accent-soft text-accent-fg border-accent/25',
  success: 'bg-success-soft text-success border-success/25',
  warn: 'bg-warn-soft text-warn border-warn/25',
  danger: 'bg-danger-soft text-danger border-danger/25',
  info: 'bg-info-soft text-info border-info/25',
  live: 'bg-live text-fg-on-accent border-transparent',
  ai: 'bg-ai-proposing/15 text-ai-proposing border-ai-proposing/30',
};

/** Static status label. Always pair color with text or an icon (no color-only meaning). */
export function Badge({
  children,
  tone = 'neutral',
  icon,
  dot,
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  icon?: LucideIcon;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full border px-2 text-xs font-medium whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {icon && <Icon icon={icon} size={13} />}
      {children}
    </span>
  );
}

/** Interactive tag/filter chip. */
export function Chip({
  children,
  selected,
  onClick,
  onRemove,
  removeLabel,
  color,
}: {
  children: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  removeLabel?: string;
  /** Optional swatch color (data color, e.g. a tag color). */
  color?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex h-8 items-center rounded-full border text-xs font-medium transition-colors duration-fast',
        selected
          ? 'border-accent/40 bg-accent-soft text-accent-fg'
          : 'border-line bg-surface-2 text-fg-muted',
      )}
    >
      <button
        type="button"
        onClick={onClick}
        aria-pressed={onClick ? selected : undefined}
        className="focus-ring flex h-full cursor-pointer items-center gap-1.5 rounded-full px-3 hover:text-fg"
      >
        {color && <span className="size-2 rounded-full" style={{ background: color }} aria-hidden />}
        {children}
      </button>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          className="focus-ring -ml-1 mr-1 grid size-6 cursor-pointer place-items-center rounded-full hover:bg-surface-4"
        >
          <Icon icon={X} size={12} />
        </button>
      )}
    </span>
  );
}

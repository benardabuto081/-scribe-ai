import type { KeyboardEvent } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../primitives/cn';
import { Icon } from '../primitives/Icon';

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  icon?: LucideIcon;
  /** Extra classes applied when this option is active (e.g. a state color). */
  activeClassName?: string;
};

/** Single-choice segmented control, keyboard operable as a radio group (arrow keys). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  size = 'md',
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: SegmentedOption<T>[];
  label: string;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const idx = options.findIndex((o) => o.value === value);
  function onKeyDown(e: KeyboardEvent) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const dir = e.key === 'ArrowRight' ? 1 : -1;
    const next = options[(idx + dir + options.length) % options.length];
    if (next) onChange(next.value);
  }
  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn(
        'inline-flex w-fit items-center gap-0.5 rounded-md border border-line bg-surface-1 p-0.5',
        className,
      )}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={cn(
              'focus-ring inline-flex cursor-pointer items-center gap-1.5 rounded-sm px-3 font-medium whitespace-nowrap',
              'transition-[background-color,color] duration-fast ease-sa',
              size === 'sm' ? 'h-8 text-xs' : 'h-9 text-sm',
              active ? 'bg-surface-4 text-fg shadow-1' : 'text-fg-muted hover:text-fg',
              active && o.activeClassName,
            )}
          >
            {o.icon && <Icon icon={o.icon} size={15} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

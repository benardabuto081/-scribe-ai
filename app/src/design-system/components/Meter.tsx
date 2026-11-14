import { cn } from '../primitives/cn';

/**
 * Level meter (audio, confidence, progress). Value 0..1.
 * Segmented style for audio; continuous for confidence/progress.
 */
export function Meter({
  value,
  label,
  variant = 'continuous',
  orientation = 'horizontal',
  segments = 16,
  className,
  thresholds = { warn: 0.75, danger: 0.92 },
}: {
  value: number;
  label: string;
  variant?: 'continuous' | 'segmented';
  orientation?: 'horizontal' | 'vertical';
  segments?: number;
  className?: string;
  thresholds?: { warn: number; danger: number };
}) {
  const v = Math.max(0, Math.min(1, value));
  const vertical = orientation === 'vertical';
  if (variant === 'segmented') {
    const lit = Math.round(v * segments);
    return (
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(v * 100)}
        className={cn('flex gap-[2px]', vertical ? 'h-full w-2 flex-col-reverse' : 'h-2 w-full', className)}
      >
        {Array.from({ length: segments }, (_, i) => {
          const pos = (i + 1) / segments;
          const on = i < lit;
          const color =
            pos > thresholds.danger ? 'bg-danger' : pos > thresholds.warn ? 'bg-warn' : 'bg-success';
          return (
            <span
              key={i}
              className={cn(
                'flex-1 rounded-[1px] transition-opacity duration-fast',
                color,
                on ? 'opacity-100' : 'opacity-15',
              )}
            />
          );
        })}
      </div>
    );
  }
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v * 100)}
      className={cn(
        'overflow-hidden rounded-full bg-surface-4',
        vertical ? 'h-full w-1.5' : 'h-1.5 w-full',
        className,
      )}
    >
      <div
        className="h-full w-full origin-left bg-brand-gradient transition-transform duration-base ease-sa"
        style={{
          transform: vertical ? `scaleY(${v})` : `scaleX(${v})`,
          transformOrigin: vertical ? 'bottom' : 'left',
        }}
      />
    </div>
  );
}

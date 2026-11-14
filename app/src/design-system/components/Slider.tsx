import * as RSl from '@radix-ui/react-slider';
import { cn } from '../primitives/cn';

export function Slider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  className,
  disabled,
}: {
  value: number;
  onValueChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label: string;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <RSl.Root
      value={[value]}
      onValueChange={(v) => onValueChange(v[0] ?? min)}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      className={cn('relative flex h-control w-full touch-none items-center select-none', className)}
    >
      <RSl.Track className="relative h-1.5 grow overflow-hidden rounded-full bg-surface-4">
        <RSl.Range className="absolute h-full bg-brand-gradient" />
      </RSl.Track>
      <RSl.Thumb
        aria-label={label}
        className="focus-ring block size-4 cursor-grab rounded-full border-2 border-fg bg-accent shadow-2 transition-transform duration-fast hover:scale-110"
      />
    </RSl.Root>
  );
}

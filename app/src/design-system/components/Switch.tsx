import * as RSw from '@radix-ui/react-switch';
import { cn } from '../primitives/cn';

export function Switch({
  checked,
  onCheckedChange,
  label,
  id,
  disabled,
  className,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <RSw.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      aria-label={label}
      disabled={disabled}
      className={cn(
        'focus-ring relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-line-strong bg-surface-4',
        'transition-colors duration-base ease-sa data-[state=checked]:border-transparent data-[state=checked]:bg-accent',
        'disabled:cursor-not-allowed disabled:opacity-45',
        // Extends the hit area to 40px around the visual track.
        'before:absolute before:-inset-2 before:content-[""]',
        className,
      )}
    >
      <RSw.Thumb className="block size-4.5 translate-x-0.5 rounded-full bg-fg shadow-1 transition-transform duration-base ease-sa data-[state=checked]:translate-x-[22px] data-[state=checked]:bg-fg-on-accent" />
    </RSw.Root>
  );
}

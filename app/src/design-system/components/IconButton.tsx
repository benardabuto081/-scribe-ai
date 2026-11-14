import { forwardRef, type ButtonHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../primitives/cn';
import { Icon } from '../primitives/Icon';
import { buttonVariants, type ButtonVariant } from './Button';
import { Tooltip } from './Tooltip';

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: LucideIcon;
  /** Required: used for aria-label and tooltip. */
  label: string;
  shortcut?: string;
  variant?: ButtonVariant;
  active?: boolean;
  size?: 'md' | 'lg';
  tooltip?: boolean;
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    icon,
    label,
    shortcut,
    variant = 'ghost',
    active,
    size = 'md',
    tooltip = true,
    className,
    type = 'button',
    ...rest
  },
  ref,
) {
  const btn = (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'focus-ring inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md',
        'transition-[background-color,border-color,color] duration-fast ease-sa',
        'disabled:cursor-not-allowed disabled:opacity-45',
        buttonVariants[variant],
        size === 'lg' ? 'size-12' : 'size-control',
        active && 'border-accent/40 bg-accent-soft text-accent-fg',
        className,
      )}
      {...rest}
    >
      <Icon icon={icon} size={size === 'lg' ? 22 : 18} />
    </button>
  );
  return tooltip ? (
    <Tooltip content={label} shortcut={shortcut}>
      {btn}
    </Tooltip>
  ) : (
    btn
  );
});

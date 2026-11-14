import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { cn } from '../primitives/cn';
import { Icon } from '../primitives/Icon';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'live' | 'brand';
export type ButtonSize = 'md' | 'lg';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  loading?: boolean;
  block?: boolean;
  children?: ReactNode;
};

export const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-fg-on-accent hover:bg-accent-hover active:bg-accent-press shadow-1 border border-transparent',
  brand:
    'bg-brand-gradient text-fg-on-accent shadow-2 border border-transparent hover:brightness-110 active:brightness-95',
  secondary: 'bg-surface-3 text-fg border border-line hover:bg-surface-4 hover:border-line-strong',
  outline: 'bg-transparent text-fg border border-line-strong hover:bg-surface-3',
  ghost: 'bg-transparent text-fg-muted border border-transparent hover:bg-surface-3 hover:text-fg',
  danger: 'bg-danger-soft text-danger border border-danger/30 hover:bg-danger hover:text-fg-on-accent',
  live: 'bg-live text-fg-on-accent border border-transparent hover:brightness-110 active:brightness-95 shadow-2',
};

const sizes: Record<ButtonSize, string> = {
  md: 'h-control px-control text-sm gap-2',
  lg: 'h-12 px-5 text-base gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'md',
    icon,
    iconRight,
    loading,
    block,
    className,
    children,
    disabled,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'focus-ring inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md font-medium whitespace-nowrap select-none',
        'transition-[background-color,border-color,color,filter,box-shadow] duration-fast ease-sa',
        'disabled:cursor-not-allowed disabled:opacity-45',
        buttonVariants[variant],
        sizes[size],
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <Icon icon={Loader2} className="animate-spin" size={16} />
      ) : icon ? (
        <Icon icon={icon} size={size === 'lg' ? 20 : 17} />
      ) : null}
      {children}
      {iconRight && <Icon icon={iconRight} size={16} />}
    </button>
  );
});

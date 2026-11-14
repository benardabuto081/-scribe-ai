import type { HTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../primitives/cn';
import { Icon } from '../primitives/Icon';

export function Card({
  className,
  interactive,
  glass,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { interactive?: boolean; glass?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-lg border border-line shadow-2',
        glass ? 'bg-glass backdrop-blur-md' : 'bg-surface-2',
        interactive &&
          'cursor-pointer transition-[border-color,transform,background-color] duration-base ease-sa hover:-translate-y-px hover:border-line-strong hover:bg-surface-3',
        className,
      )}
      {...rest}
    />
  );
}

export function CardHeader({
  title,
  icon,
  actions,
  subtitle,
  className,
}: {
  title: ReactNode;
  icon?: LucideIcon;
  actions?: ReactNode;
  subtitle?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-between gap-3 px-4 pt-3.5 pb-2', className)}>
      <div className="flex min-w-0 items-center gap-2.5">
        {icon && (
          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-accent-soft text-accent-fg">
            <Icon icon={icon} size={16} />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-fg">{title}</h3>
          {subtitle && <p className="truncate text-xs text-fg-subtle">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
    </div>
  );
}

export function CardBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-4 pb-4', className)} {...rest} />;
}

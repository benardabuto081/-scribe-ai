import * as RTabs from '@radix-ui/react-tabs';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../primitives/cn';
import { Icon } from '../primitives/Icon';

export const Tabs = RTabs.Root;

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <RTabs.Content value={value} className={cn('focus-ring outline-none', className)}>
      {children}
    </RTabs.Content>
  );
}

export function TabsList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <RTabs.List className={cn('flex items-center gap-1 border-b border-line', className)}>
      {children}
    </RTabs.List>
  );
}

export function TabsTrigger({
  value,
  children,
  icon,
  count,
}: {
  value: string;
  children: ReactNode;
  icon?: LucideIcon;
  count?: number;
}) {
  return (
    <RTabs.Trigger
      value={value}
      className={cn(
        'focus-ring relative -mb-px inline-flex h-control cursor-pointer items-center gap-2 px-3 text-sm font-medium text-fg-muted',
        'border-b-2 border-transparent transition-colors duration-fast hover:text-fg',
        'data-[state=active]:border-accent data-[state=active]:text-fg',
      )}
    >
      {icon && <Icon icon={icon} size={16} />}
      {children}
      {count !== undefined && (
        <span className="rounded-full bg-surface-4 px-1.5 text-2xs text-fg-muted tabular-nums">{count}</span>
      )}
    </RTabs.Trigger>
  );
}

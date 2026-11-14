import * as RP from '@radix-ui/react-popover';
import type { ReactNode } from 'react';
import { cn } from '../primitives/cn';

export function Popover({
  trigger,
  children,
  side = 'bottom',
  align = 'center',
  open,
  onOpenChange,
  className,
}: {
  trigger: ReactNode;
  children: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}) {
  return (
    <RP.Root open={open} onOpenChange={onOpenChange}>
      <RP.Trigger asChild>{trigger}</RP.Trigger>
      <RP.Portal>
        <RP.Content
          side={side}
          align={align}
          sideOffset={6}
          className={cn(
            'animate-scale-in z-50 rounded-lg border border-line-strong bg-surface-3 p-3 shadow-3 outline-none',
            className,
          )}
        >
          {children}
        </RP.Content>
      </RP.Portal>
    </RP.Root>
  );
}

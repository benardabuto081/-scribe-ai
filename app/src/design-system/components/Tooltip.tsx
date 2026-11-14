import * as RT from '@radix-ui/react-tooltip';
import type { ReactNode } from 'react';
import { Kbd } from '../primitives/Kbd';

export const TooltipProvider = RT.Provider;

export function Tooltip({
  content,
  shortcut,
  side = 'top',
  children,
}: {
  content: ReactNode;
  shortcut?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  children: ReactNode;
}) {
  return (
    <RT.Root delayDuration={350}>
      <RT.Trigger asChild>{children}</RT.Trigger>
      <RT.Portal>
        <RT.Content
          side={side}
          sideOffset={6}
          className="animate-fade-in z-50 flex items-center gap-2 rounded-sm border border-line-strong bg-surface-4 px-2 py-1 text-xs text-fg shadow-2"
        >
          {content}
          {shortcut && <Kbd keys={shortcut} />}
        </RT.Content>
      </RT.Portal>
    </RT.Root>
  );
}

import * as RCM from '@radix-ui/react-context-menu';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../primitives/cn';
import { Icon } from '../primitives/Icon';
import { Kbd } from '../primitives/Kbd';

export type MenuItem =
  | {
      type?: 'item';
      label: string;
      icon?: LucideIcon;
      shortcut?: string;
      danger?: boolean;
      disabled?: boolean;
      onSelect: () => void;
    }
  | { type: 'separator' };

export function ContextMenu({ items, children }: { items: MenuItem[]; children: ReactNode }) {
  return (
    <RCM.Root>
      <RCM.Trigger asChild>{children}</RCM.Trigger>
      <RCM.Portal>
        <RCM.Content className="animate-scale-in z-50 min-w-52 rounded-md border border-line-strong bg-surface-3 p-1 shadow-3">
          {items.map((item, i) =>
            item.type === 'separator' ? (
              <RCM.Separator key={`sep-${i}`} className="my-1 h-px bg-line" />
            ) : (
              <RCM.Item
                key={item.label}
                disabled={item.disabled}
                onSelect={item.onSelect}
                className={cn(
                  'flex h-9 cursor-pointer items-center gap-2.5 rounded-sm px-2.5 text-sm outline-none select-none',
                  'data-disabled:opacity-40 data-highlighted:bg-accent-soft',
                  item.danger ? 'text-danger' : 'text-fg',
                )}
              >
                {item.icon && <Icon icon={item.icon} size={15} className="text-fg-muted" />}
                <span className="flex-1">{item.label}</span>
                {item.shortcut && <Kbd keys={item.shortcut} />}
              </RCM.Item>
            ),
          )}
        </RCM.Content>
      </RCM.Portal>
    </RCM.Root>
  );
}

import * as RD from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../primitives/cn';
import { IconButton } from './IconButton';

/** Side sheet built on the Dialog primitive (focus trap, Esc to close). */
export function Drawer({
  open,
  onOpenChange,
  title,
  children,
  footer,
  width = 'md',
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  width?: 'sm' | 'md' | 'lg';
}) {
  const { t } = useTranslation();
  return (
    <RD.Root open={open} onOpenChange={onOpenChange}>
      <RD.Portal>
        <RD.Overlay className="animate-fade-in fixed inset-0 z-40 bg-overlay" />
        <RD.Content
          className={cn(
            'animate-slide-in-right fixed inset-y-0 right-0 z-50 flex flex-col border-l border-line-strong bg-surface-2 shadow-3 outline-none',
            { sm: 'w-80', md: 'w-[420px]', lg: 'w-[600px]' }[width],
          )}
        >
          <header className="flex h-14 items-center justify-between border-b border-line px-5">
            <RD.Title className="font-display text-base font-semibold">{title}</RD.Title>
            <RD.Description className="sr-only">{title}</RD.Description>
            <RD.Close asChild>
              <IconButton icon={X} label={t('ds.close')} shortcut="Esc" className="-mr-2" />
            </RD.Close>
          </header>
          <div className="min-h-0 flex-1 overflow-auto p-5">{children}</div>
          {footer && (
            <footer className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</footer>
          )}
        </RD.Content>
      </RD.Portal>
    </RD.Root>
  );
}

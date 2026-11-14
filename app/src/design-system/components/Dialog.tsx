import * as RD from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../primitives/cn';
import { IconButton } from './IconButton';

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
};

const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' } as const;

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
}: DialogProps) {
  const { t } = useTranslation();
  return (
    <RD.Root open={open} onOpenChange={onOpenChange}>
      <RD.Portal>
        <RD.Overlay className="animate-fade-in fixed inset-0 z-40 bg-overlay backdrop-blur-[2px]" />
        <RD.Content
          className={cn(
            'animate-scale-in fixed top-1/2 left-1/2 z-50 flex max-h-[85vh] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col',
            'rounded-xl border border-line-strong bg-surface-2 shadow-3 outline-none',
            widths[size],
          )}
        >
          <header className="flex items-start justify-between gap-4 border-b border-line px-5 pt-4 pb-3">
            <div className="flex flex-col gap-1">
              <RD.Title className="font-display text-base font-semibold text-fg">{title}</RD.Title>
              {description ? (
                <RD.Description className="text-sm text-fg-muted">{description}</RD.Description>
              ) : (
                <RD.Description className="sr-only">{title}</RD.Description>
              )}
            </div>
            <RD.Close asChild>
              <IconButton icon={X} label={t('ds.close')} shortcut="Esc" className="-mt-1 -mr-2" />
            </RD.Close>
          </header>
          <div className="min-h-0 flex-1 overflow-auto px-5 py-4">{children}</div>
          {footer && (
            <footer className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">
              {footer}
            </footer>
          )}
        </RD.Content>
      </RD.Portal>
    </RD.Root>
  );
}

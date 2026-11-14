import * as RToast from '@radix-ui/react-toast';
import { AlertTriangle, CheckCircle2, Info, X, XCircle, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { create } from 'zustand';
import { cn } from '../primitives/cn';
import { Icon } from '../primitives/Icon';

export type ToastTone = 'info' | 'success' | 'warn' | 'danger';
export type ToastItem = { id: number; title: string; description?: string; tone: ToastTone };

type ToastStore = {
  toasts: ToastItem[];
  push: (t: Omit<ToastItem, 'id' | 'tone'> & { tone?: ToastTone }) => void;
  dismiss: (id: number) => void;
};

let nextId = 1;

export const useToasts = create<ToastStore>((set) => ({
  toasts: [],
  push: (t) => set((s) => ({ toasts: [...s.toasts.slice(-4), { id: nextId++, tone: 'info', ...t }] })),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

/** Imperative helper usable outside React (e.g. command handlers). */
export const toast = (t: Omit<ToastItem, 'id' | 'tone'> & { tone?: ToastTone }) =>
  useToasts.getState().push(t);

const toneIcon: Record<ToastTone, LucideIcon> = {
  info: Info,
  success: CheckCircle2,
  warn: AlertTriangle,
  danger: XCircle,
};
const toneColor: Record<ToastTone, string> = {
  info: 'text-info',
  success: 'text-success',
  warn: 'text-warn',
  danger: 'text-danger',
};

export function Toaster() {
  const { t } = useTranslation();
  const toasts = useToasts((s) => s.toasts);
  const dismiss = useToasts((s) => s.dismiss);
  return (
    <RToast.Provider swipeDirection="right" duration={4500}>
      {toasts.map((item) => (
        <RToast.Root
          key={item.id}
          onOpenChange={(open) => !open && dismiss(item.id)}
          className="animate-scale-in flex w-[360px] items-start gap-3 rounded-lg border border-line-strong bg-glass p-3 shadow-3 backdrop-blur-md"
        >
          <Icon icon={toneIcon[item.tone]} size={18} className={cn('mt-0.5', toneColor[item.tone])} />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <RToast.Title className="text-sm font-medium text-fg">{item.title}</RToast.Title>
            {item.description && (
              <RToast.Description className="text-xs text-fg-muted">{item.description}</RToast.Description>
            )}
          </div>
          <RToast.Close
            aria-label={t('ds.close')}
            className="focus-ring -m-1 grid size-8 cursor-pointer place-items-center rounded-sm text-fg-subtle hover:bg-surface-4 hover:text-fg"
          >
            <Icon icon={X} size={15} />
          </RToast.Close>
        </RToast.Root>
      ))}
      <RToast.Viewport className="fixed right-4 bottom-12 z-[60] flex flex-col gap-2 outline-none" />
    </RToast.Provider>
  );
}

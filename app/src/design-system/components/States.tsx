import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AlertOctagon, Inbox, Loader2, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../primitives/cn';
import { Icon } from '../primitives/Icon';
import { Button } from './Button';

export function EmptyState({
  icon = Inbox,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 px-6 py-12 text-center', className)}>
      <span className="grid size-14 place-items-center rounded-xl border border-line bg-brand-gradient-soft text-accent-fg">
        <Icon icon={icon} size={24} />
      </span>
      <div className="flex max-w-sm flex-col gap-1">
        <h3 className="text-base font-semibold text-fg">{title}</h3>
        {description && <p className="text-sm text-fg-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({
  title,
  description,
  onRetry,
  className,
}: {
  title?: ReactNode;
  description?: ReactNode;
  onRetry?: () => void;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <div
      role="alert"
      className={cn('flex flex-col items-center justify-center gap-3 px-6 py-12 text-center', className)}
    >
      <span className="grid size-14 place-items-center rounded-xl border border-danger/30 bg-danger-soft text-danger">
        <Icon icon={AlertOctagon} size={24} />
      </span>
      <div className="flex max-w-sm flex-col gap-1">
        <h3 className="text-base font-semibold text-fg">{title ?? t('ds.errorTitle')}</h3>
        <p className="text-sm text-fg-muted">{description ?? t('ds.errorBody')}</p>
      </div>
      {onRetry && <Button onClick={onRetry}>{t('ds.retry')}</Button>}
    </div>
  );
}

export function Spinner({ label, className }: { label?: string; className?: string }) {
  const { t } = useTranslation();
  return (
    <span role="status" className={cn('inline-flex items-center gap-2 text-sm text-fg-muted', className)}>
      <Icon icon={Loader2} size={18} className="animate-spin text-accent-fg" />
      <span>{label ?? t('ds.loading')}</span>
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cn('skeleton-shimmer block rounded-md', className)} />;
}

export function LoadingState({ rows = 4, className }: { rows?: number; className?: string }) {
  const { t } = useTranslation();
  return (
    <div role="status" aria-label={t('ds.loading')} className={cn('flex flex-col gap-3 p-4', className)}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-10 shrink-0" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-3 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Visible "Coming soon" marker for unfinished features (CLAUDE.md: no hidden fakes). */
export function ComingSoon({
  feature,
  phase,
  className,
}: {
  feature: string;
  phase?: string;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-line-strong px-6 py-10 text-center',
        className,
      )}
    >
      <span className="grid size-12 place-items-center rounded-xl bg-brand-gradient-soft text-accent-fg">
        <Icon icon={Sparkles} size={20} />
      </span>
      <div>
        <p className="text-sm font-semibold text-fg">{t('ds.comingSoon')}</p>
        <p className="text-xs text-fg-muted">
          {feature}
          {phase && ` · ${t('ds.plannedFor', { phase })}`}
        </p>
      </div>
    </div>
  );
}

/** Small inline badge version for buttons/menu items that are not yet wired. */
export function SoonTag() {
  const { t } = useTranslation();
  return (
    <span className="rounded-full border border-line bg-surface-4 px-1.5 text-2xs font-medium text-fg-subtle">
      {t('ds.soon')}
    </span>
  );
}

export type ViewStatus = 'loading' | 'error' | 'empty' | 'ready';

/** Renders the right UI state. Every screen uses this so all four states exist. */
export function StateView({
  status,
  empty,
  error,
  onRetry,
  loadingRows,
  children,
}: {
  status: ViewStatus;
  empty: { icon?: LucideIcon; title: ReactNode; description?: ReactNode; action?: ReactNode };
  error?: { title?: ReactNode; description?: ReactNode };
  onRetry?: () => void;
  loadingRows?: number;
  children: ReactNode;
}) {
  if (status === 'loading') return <LoadingState rows={loadingRows} />;
  if (status === 'error') return <ErrorState {...error} onRetry={onRetry} />;
  if (status === 'empty') return <EmptyState {...empty} />;
  return <>{children}</>;
}

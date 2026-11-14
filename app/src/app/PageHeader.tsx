import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Badge, Icon } from '@/design-system';

/** Consistent module header. `status` mirrors docs/FEATURE_STATUS.md (mock | partial | done). */
export function PageHeader({
  icon,
  title,
  subtitle,
  status,
  actions,
}: {
  icon: LucideIcon;
  title: ReactNode;
  subtitle?: ReactNode;
  status?: { tone: 'warn' | 'info' | 'success'; label: string };
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 border-b border-line px-6 py-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-line bg-brand-gradient-soft text-accent-fg">
        <Icon icon={icon} size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h1 className="truncate text-lg font-semibold">{title}</h1>
          {status && <Badge tone={status.tone}>{status.label}</Badge>}
        </div>
        {subtitle && <p className="truncate text-sm text-fg-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

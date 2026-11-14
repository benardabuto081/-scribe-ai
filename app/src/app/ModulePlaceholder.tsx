import { useTranslation } from 'react-i18next';
import { ComingSoon } from '@/design-system';
import { PageHeader } from './PageHeader';
import type { NavItem } from './nav';

/** Visible "Coming soon" screen for modules not yet built (listed in FEATURE_STATUS.md). */
export function ModulePlaceholder({ item, phase = 'A' }: { item: NavItem; phase?: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex h-full flex-col">
      <PageHeader
        icon={item.icon}
        title={t(item.labelKey)}
        subtitle={t('shell.specRef', { spec: item.spec })}
        status={{ tone: 'warn', label: t('status.mock') }}
      />
      <div className="grid flex-1 place-items-center p-8">
        <ComingSoon feature={t(item.labelKey)} phase={phase} className="w-full max-w-lg" />
      </div>
    </div>
  );
}

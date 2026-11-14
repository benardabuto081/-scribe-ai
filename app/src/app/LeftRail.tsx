import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutGrid } from 'lucide-react';
import { cn, Icon, LogoMark, Popover, Tooltip } from '@/design-system';
import { execute } from '@/commands';
import { NAV_ITEMS, NAV_SECTIONS, type NavItem } from './nav';

function RailLink({ item }: { item: NavItem }) {
  const { t } = useTranslation();
  return (
    <Tooltip content={t(item.labelKey)} side="right">
      <NavLink
        to={item.path}
        aria-label={t(item.labelKey)}
        onClick={(e) => {
          // Navigation is a command like everything else (audited, AI-reachable).
          e.preventDefault();
          void execute('app.navigate', { path: item.path }, { source: 'ui' });
        }}
        className={({ isActive }) =>
          cn(
            'focus-ring group relative grid size-11 shrink-0 place-items-center rounded-lg transition-colors duration-fast',
            isActive ? 'bg-accent-soft text-accent-fg' : 'text-fg-muted hover:bg-surface-3 hover:text-fg',
          )
        }
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <span
                aria-hidden
                className="absolute top-2 bottom-2 -left-[14px] w-[3px] rounded-r-full bg-brand-gradient"
              />
            )}
            <Icon icon={item.icon} size={20} />
          </>
        )}
      </NavLink>
    </Tooltip>
  );
}

export function LeftRail() {
  const { t } = useTranslation();
  const pinned = NAV_ITEMS.filter((n) => n.pinned);
  const bottom = NAV_ITEMS.filter((n) => n.id === 'settings' || n.id === 'help');
  const [allOpen, setAllOpen] = useState(false);
  return (
    <nav
      aria-label={t('shell.mainNav')}
      className="flex h-full w-(--sa-rail-w) shrink-0 flex-col items-center gap-1 border-r border-line bg-surface-1 py-3"
    >
      <button
        type="button"
        onClick={() => void execute('app.navigate', { path: '/home' })}
        aria-label={t('nav.home')}
        className="focus-ring mb-3 grid size-11 cursor-pointer place-items-center rounded-lg"
      >
        <LogoMark size={30} />
      </button>
      <div className="flex min-h-0 flex-1 flex-col items-center gap-1 overflow-y-auto">
        {pinned.map((item) => (
          <RailLink key={item.id} item={item} />
        ))}
        <Popover
          open={allOpen}
          onOpenChange={setAllOpen}
          side="right"
          align="start"
          className="w-[560px] p-4"
          trigger={
            <button
              type="button"
              aria-label={t('nav.allModules')}
              className="focus-ring grid size-11 cursor-pointer place-items-center rounded-lg text-fg-muted hover:bg-surface-3 hover:text-fg"
            >
              <Icon icon={LayoutGrid} size={20} />
            </button>
          }
        >
          <AllModules onPick={() => setAllOpen(false)} />
        </Popover>
      </div>
      <div className="flex flex-col items-center gap-1 border-t border-line pt-2">
        {bottom.map((item) => (
          <RailLink key={item.id} item={item} />
        ))}
      </div>
    </nav>
  );
}

function AllModules({ onPick }: { onPick: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
      {NAV_SECTIONS.map((section) => (
        <div key={section}>
          <h3 className="mb-1.5 text-2xs font-semibold tracking-wider text-fg-subtle uppercase">
            {t(`nav.sections.${section}`)}
          </h3>
          <ul className="flex flex-col">
            {NAV_ITEMS.filter((n) => n.section === section).map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => {
                    onPick();
                    void execute('app.navigate', { path: n.path });
                  }}
                  className="focus-ring flex h-10 w-full cursor-pointer items-center gap-2.5 rounded-md px-2 text-sm text-fg-muted hover:bg-surface-4 hover:text-fg"
                >
                  <Icon icon={n.icon} size={16} />
                  <span className="flex-1 text-left">{t(n.labelKey)}</span>
                  <span className="text-2xs text-fg-subtle">§{n.spec}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

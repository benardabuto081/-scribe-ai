import { useMemo, useState } from 'react';
import { Command } from 'cmdk';
import * as RD from '@radix-ui/react-dialog';
import type { LucideIcon } from 'lucide-react';
import { CornerDownLeft, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Icon } from '../primitives/Icon';
import { paletteScore } from './paletteScore';
import { Kbd } from '../primitives/Kbd';

export type PaletteItem = {
  id: string;
  label: string;
  group: string;
  icon?: LucideIcon;
  shortcut?: string;
  keywords?: string[];
  hint?: string;
  disabled?: boolean;
  /** Small ranking bonus within a match tier (e.g. navigation targets). */
  boost?: number;
};

/** Presentational command palette. The app wires it to the Command Bus. */
export function CommandPalette({
  open,
  onOpenChange,
  items,
  onRun,
  placeholder,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: PaletteItem[];
  onRun: (id: string) => void;
  placeholder?: string;
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  // We rank ourselves (cmdk filtering off): score on the human label + keywords only (see
  // paletteScore.ts), drop non-matches, order items by score and groups by their best item.
  // cmdk then simply selects the first rendered item, so the top result is deterministic.
  const ranked = useMemo(() => {
    const scored = items
      .map((i, order) => ({ i, order, score: paletteScore(i.label, search, i.keywords, i.boost) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || a.order - b.order);
    const groups: { name: string; items: PaletteItem[] }[] = [];
    for (const { i } of scored) {
      const g = groups.find((x) => x.name === i.group);
      if (g) g.items.push(i);
      else groups.push({ name: i.group, items: [i] });
    }
    return groups;
  }, [items, search]);
  return (
    <RD.Root open={open} onOpenChange={onOpenChange}>
      <RD.Portal>
        <RD.Overlay className="animate-fade-in fixed inset-0 z-40 bg-overlay" />
        <RD.Content className="animate-scale-in fixed top-[14vh] left-1/2 z-50 w-[min(640px,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-xl border border-line-strong bg-surface-2 shadow-3 outline-none">
          <RD.Title className="sr-only">{t('palette.title')}</RD.Title>
          <RD.Description className="sr-only">{t('palette.description')}</RD.Description>
          <Command label={t('palette.title')} loop shouldFilter={false}>
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Icon icon={Search} size={18} className="text-fg-subtle" />
              <Command.Input
                value={search}
                onValueChange={setSearch}
                autoFocus
                placeholder={placeholder ?? t('palette.placeholder')}
                className="h-14 flex-1 bg-transparent text-base text-fg outline-none placeholder:text-fg-subtle"
              />
              <Kbd keys="Esc" />
            </div>
            <Command.List className="max-h-[420px] overflow-auto p-2">
              <Command.Empty className="px-3 py-8 text-center text-sm text-fg-muted">
                {t('palette.empty')}
              </Command.Empty>
              {ranked.map((g) => (
                <Command.Group
                  key={g.name}
                  heading={g.name}
                  className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-2xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-fg-subtle [&_[cmdk-group-heading]]:uppercase"
                >
                  {g.items.map((i) => (
                    <Command.Item
                      key={i.id}
                      value={i.id}
                      disabled={i.disabled}
                      onSelect={() => onRun(i.id)}
                      className="group flex h-10 cursor-pointer items-center gap-3 rounded-md px-3 text-sm text-fg data-[disabled=true]:opacity-40 data-[selected=true]:bg-accent-soft"
                    >
                      {i.icon && <Icon icon={i.icon} size={16} className="text-fg-muted" />}
                      <span className="flex-1 truncate">{i.label}</span>
                      {i.hint && <span className="text-xs text-fg-subtle">{i.hint}</span>}
                      {i.shortcut && <Kbd keys={i.shortcut} />}
                      <Icon
                        icon={CornerDownLeft}
                        size={14}
                        className="text-fg-subtle opacity-0 group-data-[selected=true]:opacity-100"
                      />
                    </Command.Item>
                  ))}
                </Command.Group>
              ))}
            </Command.List>
          </Command>
        </RD.Content>
      </RD.Portal>
    </RD.Root>
  );
}

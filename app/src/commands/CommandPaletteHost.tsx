import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ListMusic, Music, Palette, Zap } from 'lucide-react';
import { CommandPalette, toast, type PaletteItem } from '@/design-system';
import { useUi } from '@/state/ui';
import { useLibrary } from '@/state/library';
import { NAV_ITEMS } from '@/app/nav';
import { execute } from './bus';
import { listCommands } from './registry';
import { shortcutFor } from './keyboard';

type Action = { commandId: string; args: unknown };

/**
 * Ctrl+K command palette. Lists every palette-enabled command, plus parameterised entries
 * (go to screen, apply look, run macro, load song). Everything runs through the Command Bus.
 */
export function CommandPaletteHost() {
  const { t } = useTranslation();
  const open = useUi((s) => s.paletteOpen);
  const setOpen = useUi((s) => s.setPaletteOpen);
  const { looks, macros, presentations, playlists } = useLibrary();

  const { items, actions } = useMemo(() => {
    const items: PaletteItem[] = [];
    const actions = new Map<string, Action>();
    const add = (item: PaletteItem, action: Action) => {
      items.push(item);
      actions.set(item.id, action);
    };

    for (const c of listCommands().filter((c) => c.palette)) {
      add(
        {
          id: c.id,
          label: t(c.labelKey),
          group: t(`cmd.group.${c.category}`),
          icon: c.icon,
          shortcut: shortcutFor(c.id),
          keywords: [c.id],
        },
        { commandId: c.id, args: {} },
      );
    }
    for (const n of NAV_ITEMS) {
      add(
        { id: `nav:${n.path}`, label: t(n.labelKey), group: t('palette.goTo'), icon: n.icon, hint: n.path },
        { commandId: 'app.navigate', args: { path: n.path } },
      );
    }
    for (const l of looks) {
      add(
        {
          id: `look:${l.id}`,
          label: `${t('cmd.look.apply')}: ${l.name}`,
          group: t('cmd.group.look'),
          icon: Palette,
        },
        { commandId: 'look.apply', args: { lookId: l.id } },
      );
    }
    for (const m of macros) {
      add(
        {
          id: `macro:${m.id}`,
          label: `${t('cmd.macro.run')}: ${m.name}`,
          group: t('cmd.group.macro'),
          icon: Zap,
        },
        { commandId: 'macro.run', args: { macroId: m.id } },
      );
    }
    for (const p of presentations.filter((p) => p.kind === 'song')) {
      add(
        {
          id: `song:${p.id}`,
          label: `${t('cmd.song.load')}: ${p.title}`,
          group: t('cmd.group.song'),
          icon: Music,
          keywords: p.tags,
        },
        { commandId: 'song.load', args: { songId: p.id } },
      );
    }
    for (const pl of playlists) {
      add(
        {
          id: `pl:${pl.id}`,
          label: `${t('cmd.playlist.select')}: ${pl.name}`,
          group: t('cmd.group.playlist'),
          icon: ListMusic,
        },
        { commandId: 'playlist.select', args: { playlistId: pl.id } },
      );
    }
    return { items, actions };
  }, [t, looks, macros, presentations, playlists]);

  async function run(id: string) {
    setOpen(false);
    const action = actions.get(id);
    if (!action) return;
    const out = await execute(action.commandId, action.args, { source: 'ui' });
    if (!out.ok) toast({ title: t('palette.failed'), description: out.error.message, tone: 'danger' });
  }

  return <CommandPalette open={open} onOpenChange={setOpen} items={items} onRun={(id) => void run(id)} />;
}

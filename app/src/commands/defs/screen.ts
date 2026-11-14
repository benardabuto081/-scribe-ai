import { Brush, Eraser, Image, Layers, MonitorOff, Palette, Wallpaper } from 'lucide-react';
import { z } from 'zod';
import { defineCommand } from '../registry';
import { CommandFailure } from '../bus';
import { clearLayer, patchProgram, restoreLive, snapshotLive, themeStyle, useLive } from '@/state/live';
import { useLibrary } from '@/state/library';

const undoable = () => {
  const snap = snapshotLive();
  return () => restoreLive(snap);
};

const LAYERS = ['background', 'slide', 'media', 'props', 'messages', 'audio'] as const;

export const screenCommands = [
  defineCommand({
    id: 'screen.clear',
    category: 'screen',
    labelKey: 'cmd.screen.clear',
    icon: Eraser,
    args: z.object({}),
    permission: 'operate',
    shortcut: 'Escape',
    aiAllowed: true,
    palette: true,
    handler: () => {
      const undo = undoable();
      (['slide', 'media', 'props', 'messages'] as const).forEach(clearLayer);
      patchProgram({ blackout: false, logo: false });
      return { undo };
    },
  }),
  defineCommand({
    id: 'screen.clearLayer',
    category: 'screen',
    labelKey: 'cmd.screen.clearLayer',
    icon: Layers,
    args: z.object({ layer: z.enum(LAYERS) }),
    permission: 'operate',
    aiAllowed: true,
    handler: ({ layer }) => {
      const undo = undoable();
      clearLayer(layer);
      return { undo };
    },
  }),
  defineCommand({
    id: 'screen.blackout',
    category: 'screen',
    labelKey: 'cmd.screen.blackout',
    icon: MonitorOff,
    args: z.object({ on: z.boolean().optional() }),
    permission: 'operate',
    shortcut: 'B',
    aiAllowed: true,
    palette: true,
    handler: ({ on }) => {
      const prev = useLive.getState().program.blackout;
      patchProgram({ blackout: on ?? !prev });
      return { undo: () => patchProgram({ blackout: prev }) };
    },
  }),
  defineCommand({
    id: 'screen.logo',
    category: 'screen',
    labelKey: 'cmd.screen.logo',
    icon: Image,
    args: z.object({ on: z.boolean().optional() }),
    permission: 'operate',
    shortcut: 'L',
    aiAllowed: true,
    palette: true,
    handler: ({ on }) => {
      const prev = useLive.getState().program.logo;
      patchProgram({ logo: on ?? !prev });
      return { undo: () => patchProgram({ logo: prev }) };
    },
  }),
  defineCommand({
    id: 'look.apply',
    category: 'look',
    labelKey: 'cmd.look.apply',
    icon: Palette,
    args: z.object({ lookId: z.string() }),
    permission: 'operate',
    aiAllowed: true,
    handler: ({ lookId }) => {
      const { looks, backgrounds, themes } = useLibrary.getState();
      const look = looks.find((l) => l.id === lookId);
      if (!look) throw new CommandFailure('not_found', `Look not found: ${lookId}`);
      const bg = backgrounds.find((b) => b.id === look.backgroundId);
      const theme = themes.find((t) => t.id === look.themeId);
      const undo = undoable();
      patchProgram({
        look: { id: look.id, name: look.name, layers: look.layers },
        background: bg ? { id: bg.id, css: bg.css } : null,
        ...(theme ? { theme: themeStyle(theme) } : {}),
        stage: { ...useLive.getState().program.stage, layoutId: look.stageLayoutId },
      });
      return { undo };
    },
  }),
  defineCommand({
    id: 'background.set',
    category: 'look',
    labelKey: 'cmd.background.set',
    icon: Wallpaper,
    args: z.object({ backgroundId: z.string() }),
    permission: 'operate',
    aiAllowed: true,
    handler: ({ backgroundId }) => {
      const bg = useLibrary.getState().backgrounds.find((b) => b.id === backgroundId);
      if (!bg) throw new CommandFailure('not_found', `Background not found: ${backgroundId}`);
      const prev = useLive.getState().program.background;
      patchProgram({ background: { id: bg.id, css: bg.css } });
      return { undo: () => patchProgram({ background: prev }) };
    },
  }),
  defineCommand({
    id: 'theme.apply',
    category: 'look',
    labelKey: 'cmd.theme.apply',
    icon: Brush,
    args: z.object({ themeId: z.string() }),
    permission: 'operate',
    aiAllowed: false,
    handler: ({ themeId }) => {
      const theme = useLibrary.getState().themes.find((t) => t.id === themeId);
      if (!theme) throw new CommandFailure('not_found', `Theme not found: ${themeId}`);
      const prev = useLive.getState().program.theme;
      patchProgram({ theme: themeStyle(theme) });
      return { undo: () => patchProgram({ theme: prev }) };
    },
  }),
];

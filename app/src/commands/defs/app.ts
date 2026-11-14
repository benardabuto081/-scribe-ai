import {
  AppWindow,
  AppWindowMac,
  Command,
  Compass,
  Grid3x3,
  Languages,
  MonitorCog,
  PanelRight,
  ScanEye,
  SunMoon,
  Undo2,
} from 'lucide-react';
import { z } from 'zod';
import { defineCommand } from '../registry';
import { CommandFailure, undoLast } from '../bus';
import { useUi } from '@/state/ui';
import { useSettings } from '@/state/settings';
import { openOutputWindow, setOutputAssignment, closeOutputWindow } from '@/outputs/windows';
import { patchProgram, useLive } from '@/state/live';
import { OUTPUT_ROLES } from '@/outputs/types';

/** Router navigation is injected by the shell (keeps commands free of React). */
let navigate: (path: string) => void = () => undefined;
export function setNavigator(fn: (path: string) => void) {
  navigate = fn;
}

const role = z.enum(OUTPUT_ROLES);

export const appCommands = [
  defineCommand({
    id: 'app.navigate',
    category: 'app',
    labelKey: 'cmd.app.navigate',
    icon: Compass,
    args: z.object({ path: z.string().startsWith('/') }),
    permission: 'view',
    aiAllowed: true,
    handler: ({ path }) => navigate(path),
  }),
  defineCommand({
    id: 'app.openPalette',
    category: 'app',
    labelKey: 'cmd.app.openPalette',
    icon: Command,
    args: z.object({}),
    permission: 'view',
    shortcut: 'Ctrl+K',
    aiAllowed: false,
    handler: () => useUi.getState().setPaletteOpen(true),
  }),
  defineCommand({
    id: 'app.undo',
    category: 'app',
    labelKey: 'cmd.app.undo',
    icon: Undo2,
    args: z.object({}),
    permission: 'operate',
    shortcut: 'Ctrl+Z',
    aiAllowed: false,
    palette: true,
    handler: async () => {
      const undone = await undoLast();
      if (!undone) throw new CommandFailure('not_found', 'Nothing to undo');
      return { result: undone };
    },
  }),
  defineCommand({
    id: 'app.setTheme',
    category: 'app',
    labelKey: 'cmd.app.setTheme',
    icon: SunMoon,
    args: z.object({ theme: z.enum(['dark', 'light', 'hc']) }),
    permission: 'view',
    aiAllowed: false,
    handler: ({ theme }) => {
      const prev = useSettings.getState().theme;
      useSettings.getState().setTheme(theme);
      return { undo: () => useSettings.getState().setTheme(prev) };
    },
  }),
  defineCommand({
    id: 'app.setLanguage',
    category: 'app',
    labelKey: 'cmd.app.setLanguage',
    icon: Languages,
    args: z.object({ language: z.enum(['en', 'sw']) }),
    permission: 'view',
    aiAllowed: false,
    handler: ({ language }) => {
      const prev = useSettings.getState().language;
      useSettings.getState().setLanguage(language);
      return { undo: () => useSettings.getState().setLanguage(prev) };
    },
  }),
  defineCommand({
    id: 'app.toggleInspector',
    category: 'app',
    labelKey: 'cmd.app.toggleInspector',
    icon: PanelRight,
    args: z.object({}),
    permission: 'view',
    shortcut: 'Ctrl+I',
    aiAllowed: false,
    palette: true,
    handler: () => useUi.getState().toggleInspector(),
  }),

  /* ---------------- outputs ---------------- */
  defineCommand({
    id: 'output.open',
    category: 'output',
    labelKey: 'cmd.output.open',
    icon: AppWindow,
    args: z.object({ role }),
    permission: 'operate',
    aiAllowed: false,
    handler: ({ role }) => openOutputWindow(role),
  }),
  defineCommand({
    id: 'output.close',
    category: 'output',
    labelKey: 'cmd.output.close',
    icon: AppWindowMac,
    args: z.object({ role }),
    permission: 'admin',
    aiAllowed: false,
    handler: ({ role }) => closeOutputWindow(role),
  }),
  defineCommand({
    id: 'output.assignDisplay',
    category: 'output',
    labelKey: 'cmd.output.assignDisplay',
    icon: MonitorCog,
    args: z.object({ role, monitor: z.string().nullable() }),
    permission: 'admin',
    aiAllowed: false,
    handler: ({ role, monitor }) => setOutputAssignment(role, monitor),
  }),
  defineCommand({
    id: 'output.testPattern',
    category: 'output',
    labelKey: 'cmd.output.testPattern',
    icon: Grid3x3,
    args: z.object({ role, on: z.boolean().optional() }),
    permission: 'admin',
    aiAllowed: false,
    handler: ({ role, on }) => {
      const prev = useLive.getState().program.testPattern;
      patchProgram({ testPattern: { ...prev, [role]: on ?? !prev[role] } });
      return { undo: () => patchProgram({ testPattern: prev }) };
    },
  }),
  defineCommand({
    id: 'output.identify',
    category: 'output',
    labelKey: 'cmd.output.identify',
    icon: ScanEye,
    args: z.object({ role }),
    permission: 'operate',
    aiAllowed: false,
    handler: ({ role }) => {
      const cur = useLive.getState().program.identify;
      patchProgram({ identify: { ...cur, [role]: true } });
      setTimeout(
        () => patchProgram({ identify: { ...useLive.getState().program.identify, [role]: false } }),
        3000,
      );
    },
  }),
];

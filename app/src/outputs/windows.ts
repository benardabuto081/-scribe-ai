import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { isTauri } from './bridge';
import type { OutputRole } from './types';

export type MonitorInfo = {
  name: string;
  width: number;
  height: number;
  x: number;
  y: number;
  scale: number;
  primary: boolean;
};

type OutputsState = {
  monitors: MonitorInfo[];
  assignments: Record<OutputRole, string | null>;
  open: Record<OutputRole, boolean>;
  setMonitors: (m: MonitorInfo[]) => void;
  setAssignment: (role: OutputRole, monitor: string | null) => void;
  setOpen: (role: OutputRole, open: boolean) => void;
};

export const useOutputs = create<OutputsState>()(
  persist(
    (set) => ({
      monitors: [],
      assignments: { audience: null, stage: null },
      open: { audience: false, stage: false },
      setMonitors: (monitors) => set({ monitors }),
      setAssignment: (role, monitor) => set((s) => ({ assignments: { ...s.assignments, [role]: monitor } })),
      setOpen: (role, open) => set((s) => ({ open: { ...s.open, [role]: open } })),
    }),
    { name: 'scribe.outputs', partialize: (s) => ({ assignments: s.assignments }) },
  ),
);

const browserWindows: Partial<Record<OutputRole, Window | null>> = {};

/** Detects displays via Tauri's real monitor API (browser fallback: the current screen). */
export async function refreshMonitors(): Promise<MonitorInfo[]> {
  let monitors: MonitorInfo[];
  if (isTauri()) {
    const { invoke } = await import('@tauri-apps/api/core');
    monitors = await invoke<MonitorInfo[]>('list_monitors');
  } else {
    monitors = [
      {
        name: 'Browser screen',
        width: window.screen.width,
        height: window.screen.height,
        x: 0,
        y: 0,
        scale: window.devicePixelRatio,
        primary: true,
      },
    ];
  }
  useOutputs.getState().setMonitors(monitors);
  return monitors;
}

export async function openOutputWindow(role: OutputRole): Promise<void> {
  const monitor = useOutputs.getState().assignments[role];
  if (isTauri()) {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('output_open', { role, monitor });
  } else {
    const w = window.open(
      `${location.pathname}#/output/${role}`,
      `scribe-output-${role}`,
      'popup,width=960,height=540',
    );
    browserWindows[role] = w;
  }
  useOutputs.getState().setOpen(role, true);
}

export async function closeOutputWindow(role: OutputRole): Promise<void> {
  if (isTauri()) {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('output_close', { role });
  } else {
    browserWindows[role]?.close();
    browserWindows[role] = null;
  }
  useOutputs.getState().setOpen(role, false);
}

export async function setOutputAssignment(role: OutputRole, monitor: string | null): Promise<void> {
  useOutputs.getState().setAssignment(role, monitor);
  if (isTauri() && useOutputs.getState().open[role]) {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('output_open', { role, monitor });
  }
}

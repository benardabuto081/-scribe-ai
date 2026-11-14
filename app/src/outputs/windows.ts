import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { invokeChecked, isTauri } from './tauri';
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

/** Last render acknowledgement from an output window (health + self-test). */
export type OutputAck = { role: OutputRole; version: number; rendered: string | null; at: number };

type OutputsState = {
  monitors: MonitorInfo[];
  assignments: Record<OutputRole, string | null>;
  open: Record<OutputRole, boolean>;
  acks: Partial<Record<OutputRole, OutputAck>>;
  setAck: (a: OutputAck) => void;
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
      acks: {},
      setAck: (a) => set((s) => ({ acks: { ...s.acks, [a.role]: a } })),
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
    monitors = await invokeChecked<MonitorInfo[]>('list_monitors');
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
    await invokeChecked('output_open', { role, monitor });
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
    await invokeChecked('output_close', { role });
  } else {
    browserWindows[role]?.close();
    browserWindows[role] = null;
  }
  useOutputs.getState().setOpen(role, false);
}

export async function setOutputAssignment(role: OutputRole, monitor: string | null): Promise<void> {
  useOutputs.getState().setAssignment(role, monitor);
  if (isTauri() && useOutputs.getState().open[role]) {
    await invokeChecked('output_open', { role, monitor });
  }
}

/**
 * Keeps `useOutputs().open` truthful when an output window is closed by the user or OS.
 * Tauri: Rust emits `output://window` on open/destroy. Browser: polls the popup handles.
 */
export function installOutputWindowTracking(): () => void {
  if (isTauri()) {
    const unlisteners: (() => void)[] = [];
    let disposed = false;
    void import('@tauri-apps/api/event').then(async ({ listen }) => {
      unlisteners.push(
        await listen<{ role: OutputRole; open: boolean }>('output://window', (e) => {
          useOutputs.getState().setOpen(e.payload.role, e.payload.open);
        }),
        await listen<Omit<OutputAck, 'at'>>('output://ack', (e) => {
          useOutputs.getState().setAck({ ...e.payload, at: Date.now() });
        }),
      );
      if (disposed) unlisteners.forEach((u) => u());
    });
    return () => {
      disposed = true;
      unlisteners.forEach((u) => u());
    };
  }
  const id = window.setInterval(() => {
    (Object.keys(browserWindows) as OutputRole[]).forEach((role) => {
      const w = browserWindows[role];
      if (w && w.closed) {
        browserWindows[role] = null;
        useOutputs.getState().setOpen(role, false);
      }
    });
  }, 1000);
  return () => window.clearInterval(id);
}

import { create } from 'zustand';

/**
 * Python AI engine (sidecar) connection status. Driven by the sidecar lifecycle in Rust and the
 * engine client (Step 7). The UI must keep working with AI features disabled when status is 'down'.
 */
export type EngineStatus = 'connected' | 'starting' | 'down';

type EngineState = {
  status: EngineStatus;
  /** Round-trip latency of the last health check, ms. */
  latencyMs: number | null;
  /** Live mic level from the engine's audio input, 0..1. Null when not connected. */
  micLevel: number | null;
  lastError: string | null;
  set: (patch: Partial<Omit<EngineState, 'set'>>) => void;
};

export const useEngine = create<EngineState>((set) => ({
  status: 'down',
  latencyMs: null,
  micLevel: null,
  lastError: null,
  set: (patch) => set(patch),
}));

export const aiAvailable = () => useEngine.getState().status === 'connected';

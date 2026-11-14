import { EMPTY_OUTPUT_STATE, OutputStateSchema, type OutputState } from './types';

/**
 * Transport for program state between the Studio and output windows.
 *
 *  - In Tauri: Studio → `invoke('output_set_state')` → Rust stores the snapshot and emits
 *    `output://state` to all windows. Output windows fetch the snapshot on load with
 *    `invoke('output_get_state')`, so they recover even if they (re)open while the Studio is gone.
 *  - In a plain browser (dev / tests): BroadcastChannel + localStorage snapshot, same semantics.
 */

export const isTauri = (): boolean => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

const CHANNEL = 'scribe-output';
const SNAPSHOT_KEY = 'scribe.output.snapshot';

let channel: BroadcastChannel | null = null;
function getChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null;
  channel ??= new BroadcastChannel(CHANNEL);
  return channel;
}

export async function publishOutputState(state: OutputState): Promise<void> {
  if (isTauri()) {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('output_set_state', { state });
    return;
  }
  try {
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable: live channel still works.
  }
  getChannel()?.postMessage(state);
}

function parse(raw: unknown): OutputState | null {
  const r = OutputStateSchema.safeParse(raw);
  return r.success ? r.data : null;
}

/** Subscribes to program state. Calls `cb` immediately with the latest snapshot. Returns unsubscribe. */
export function subscribeOutputState(cb: (s: OutputState) => void): () => void {
  let disposed = false;
  let latestVersion = -1;
  const deliver = (raw: unknown) => {
    const s = parse(raw);
    if (!s || disposed || s.version < latestVersion) return;
    latestVersion = s.version;
    cb(s);
  };

  if (isTauri()) {
    let unlisten: (() => void) | null = null;
    void (async () => {
      const [{ invoke }, { listen }] = await Promise.all([
        import('@tauri-apps/api/core'),
        import('@tauri-apps/api/event'),
      ]);
      unlisten = await listen<unknown>('output://state', (e) => deliver(e.payload));
      const snap = await invoke<unknown>('output_get_state');
      if (snap) deliver(snap);
      if (disposed) unlisten();
    })();
    return () => {
      disposed = true;
      unlisten?.();
    };
  }

  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    deliver(raw ? JSON.parse(raw) : EMPTY_OUTPUT_STATE);
  } catch {
    deliver(EMPTY_OUTPUT_STATE);
  }
  const ch = getChannel();
  const onMsg = (e: MessageEvent) => deliver(e.data);
  ch?.addEventListener('message', onMsg);
  return () => {
    disposed = true;
    ch?.removeEventListener('message', onMsg);
  };
}

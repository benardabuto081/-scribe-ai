import { EMPTY_OUTPUT_STATE, OutputStateSchema, type OutputState } from './types';
import { invokeChecked, isTauri } from './tauri';

export { isTauri };

/**
 * Transport for program state between the Studio and output windows.
 *
 *  - In Tauri: Studio → `output_set_state` → Rust assigns a monotonic version, stores the snapshot
 *    and emits `output://state` to all windows. Output windows fetch the snapshot on load with
 *    `output_get_state`, so they recover even if they (re)open while the Studio is gone.
 *  - In a plain browser (dev / tests): BroadcastChannel + localStorage snapshot. Ordering uses the
 *    Studio's per-session counter; a new Studio session (new `session` id) resets tracking.
 * Neither path depends on the wall clock.
 */

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
    await invokeChecked('output_set_state', { state });
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

/** Decides whether a snapshot is newer than the last one accepted. Exported for tests. */
export function createOrderTracker() {
  let session: string | null = null;
  let version = -1;
  return (s: Pick<OutputState, 'session' | 'version'>): boolean => {
    if (s.session !== session) {
      session = s.session;
      version = s.version;
      return true;
    }
    if (s.version <= version) return false;
    version = s.version;
    return true;
  };
}

/** Subscribes to program state. Calls `cb` immediately with the latest snapshot. Returns unsubscribe. */
export function subscribeOutputState(cb: (s: OutputState) => void): () => void {
  let disposed = false;
  const accept = createOrderTracker();
  const deliver = (raw: unknown) => {
    const s = parse(raw);
    if (!s || disposed || !accept(s)) return;
    cb(s);
  };

  if (isTauri()) {
    let unlisten: (() => void) | null = null;
    void (async () => {
      const { listen } = await import('@tauri-apps/api/event');
      unlisten = await listen<unknown>('output://state', (e) => deliver(e.payload));
      const snap = await invokeChecked<unknown>('output_get_state');
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

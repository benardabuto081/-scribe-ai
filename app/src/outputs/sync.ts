import { useLive } from '@/state/live';
import { publishOutputState } from './bridge';

/**
 * Publishes program state to the output windows whenever it changes (coalesced to one send per
 * animation frame). Started once by the Studio window.
 */
export function startOutputSync(): () => void {
  let scheduled = false;
  const send = () => {
    scheduled = false;
    void publishOutputState(useLive.getState().program).catch((e: unknown) => {
      console.error('Output publish failed', e);
    });
  };
  send(); // initial snapshot so outputs opened later have state
  return useLive.subscribe((s, prev) => {
    if (s.program === prev.program || scheduled) return;
    scheduled = true;
    requestAnimationFrame(send);
  });
}

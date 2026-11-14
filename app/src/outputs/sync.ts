import { useLive } from '@/state/live';
import { publishOutputState } from './bridge';
import { recordSystemError } from '@/commands/audit';
import { toast } from '@/design-system/components/Toast';
import i18n from '@/i18n';

/**
 * Publishes program state to the output windows whenever it changes (coalesced to one send per
 * animation frame). Started once by the Studio window.
 */
export function startOutputSync(): () => void {
  let scheduled = false;
  let failing = false; // toast once per failure streak, audit every failure
  const send = () => {
    scheduled = false;
    publishOutputState(useLive.getState().program).then(
      () => {
        failing = false;
      },
      (e: unknown) => {
        const message = e instanceof Error ? e.message : String(e);
        recordSystemError('outputSync', message);
        if (!failing) toast({ title: i18n.t('errors.outputSync'), description: message, tone: 'danger' });
        failing = true;
      },
    );
  };
  send(); // initial snapshot so outputs opened later have state
  return useLive.subscribe((s, prev) => {
    if (s.program === prev.program || scheduled) return;
    scheduled = true;
    requestAnimationFrame(send);
  });
}

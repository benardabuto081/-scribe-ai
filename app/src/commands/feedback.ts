import { toast } from '@/design-system/components/Toast';
import i18n from '@/i18n';
import { onCommand } from './bus';
import { getCommand } from './registry';

/**
 * Makes every failed command visible to the operator. Failures are already in the audit log
 * (bus.ts); this adds a toast. AI-originated refusals (e.g. "needs approval") are expected and
 * shown in the AI panel instead, so they are not toasted.
 */
export function installCommandFeedback(): () => void {
  return onCommand((outcome, commandId, ctx) => {
    if (outcome.ok || ctx.source === 'ai' || ctx.source === 'macro') return;
    const def = getCommand(commandId);
    toast({
      title: i18n.t('errors.commandFailed', { command: def ? i18n.t(def.labelKey) : commandId }),
      description: outcome.error.message,
      tone: 'danger',
    });
  });
}

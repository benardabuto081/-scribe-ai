import { register, listCommands, getCommand } from './registry';
import {
  execute,
  setAiGate,
  setPermissionProvider,
  undoLast,
  canUndo,
  onCommand,
  CommandFailure,
} from './bus';
import { slideCommands } from './defs/slide';
import { screenCommands } from './defs/screen';
import { contentCommands } from './defs/content';
import { overlayCommands } from './defs/overlays';
import { aiCommands } from './defs/ai';
import { appCommands, setNavigator } from './defs/app';
import { useAi } from '@/state/ai';
import { useSession } from '@/state/session';
import type { CommandDef } from './types';

let initialised = false;

/** Registers every command and wires the permission and AI gates. Idempotent. */
export function initCommands(): void {
  if (initialised) return;
  initialised = true;
  register(
    ...([
      ...slideCommands,
      ...screenCommands,
      ...contentCommands,
      ...overlayCommands,
      ...aiCommands,
      ...appCommands,
    ] as CommandDef[]),
  );

  setPermissionProvider(() => useSession.getState().permission());

  // CLAUDE.md AI safety rules, enforced centrally for every AI-originated command.
  setAiGate((def, ctx) => {
    const ai = useAi.getState();
    if (ai.paused) return { code: 'ai_paused', message: 'AI is paused' };
    if (ai.blockedCommands.includes(def.id) && !ctx.approved) {
      return { code: 'ai_not_allowed', message: `AI is not permitted to run ${def.id} without approval` };
    }
    if (ctx.approved) return null; // A human approved this specific action.
    if (def.id === 'ai.propose') return null; // Proposing is always allowed; acting is gated below.
    if (ai.mode !== 'auto')
      return { code: 'ai_needs_approval', message: 'Assist mode: operator approval required' };
    if ((ctx.confidence ?? 0) < ai.autoThreshold) {
      return {
        code: 'ai_low_confidence',
        message: `Confidence below ${Math.round(ai.autoThreshold * 100)}%`,
      };
    }
    return null;
  });
}

export { execute, undoLast, canUndo, onCommand, listCommands, getCommand, setNavigator, CommandFailure };
export type * from './types';

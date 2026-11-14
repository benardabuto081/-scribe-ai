import { useAudit } from './audit';
import { getCommand } from './registry';
import {
  permissionRank,
  type CommandContext,
  type CommandDef,
  type CommandError,
  type CommandErrorCode,
  type CommandOutcome,
  type CommandSource,
  type PermissionLevel,
  type UndoFn,
} from './types';

/* ------------------------------------------------------------------------------------------------
 * Pluggable gates. The bus does not import app stores directly (keeps it testable and acyclic);
 * the app wires these at startup in `commands/index.ts`.
 * ---------------------------------------------------------------------------------------------- */

/** Returns the highest permission level the current operator holds. */
type PermissionProvider = () => PermissionLevel;
/** Returns an error if the AI may not run this command right now (paused, manual mode, per-command block). */
type AiGate = (def: CommandDef, ctx: CommandContext) => CommandError | null;

let permissionProvider: PermissionProvider = () => 'admin';
let aiGate: AiGate = () => null;

export function setPermissionProvider(p: PermissionProvider) {
  permissionProvider = p;
}
export function setAiGate(g: AiGate) {
  aiGate = g;
}

/* ------------------------------------------------------------------------------------------------
 * Undo stack
 * ---------------------------------------------------------------------------------------------- */

type UndoRecord = { auditId: number; commandId: string; source: CommandSource; undo: UndoFn };
const MAX_UNDO = 100;
const undoStack: UndoRecord[] = [];

/* Listeners so the UI can react (e.g. "Undo last AI action" enabled state). */
type Listener = (outcome: CommandOutcome, commandId: string, ctx: CommandContext) => void;
const listeners = new Set<Listener>();
export function onCommand(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

/* ------------------------------------------------------------------------------------------------
 * Execute
 * ---------------------------------------------------------------------------------------------- */

export async function execute<R = unknown>(
  id: string,
  args: unknown = {},
  ctx: CommandContext = { source: 'ui' },
): Promise<CommandOutcome<R>> {
  const started = performance.now();
  const audit = useAudit.getState();
  const def = getCommand(id);

  const fail = (error: CommandError, undoable = false): CommandOutcome<R> => {
    const auditId = audit.append({
      at: Date.now(),
      commandId: id,
      source: ctx.source,
      args,
      status: 'error',
      errorCode: error.code,
      errorMessage: error.message,
      durationMs: performance.now() - started,
      explanation: ctx.explanation,
      confidence: ctx.confidence,
      undoable,
    });
    const outcome: CommandOutcome<R> = { ok: false, error, auditId };
    listeners.forEach((l) => l(outcome, id, ctx));
    return outcome;
  };

  if (!def) return fail({ code: 'unknown_command', message: `Unknown command: ${id}` });

  const parsed = def.args.safeParse(args ?? {});
  if (!parsed.success) {
    return fail({ code: 'invalid_args', message: parsed.error.message, issues: parsed.error.issues });
  }

  if (permissionRank(permissionProvider()) < permissionRank(def.permission)) {
    return fail({ code: 'forbidden', message: `Requires ${def.permission} permission` });
  }

  if (ctx.source === 'ai') {
    if (!def.aiAllowed) return fail({ code: 'ai_not_allowed', message: `AI may not run ${id}` });
    const gate = aiGate(def, ctx);
    if (gate) return fail(gate);
  }

  try {
    const out = await def.handler(parsed.data, ctx);
    const undo = out && 'undo' in out ? out.undo : undefined;
    const result = (out && 'result' in out ? out.result : undefined) as R | undefined;
    const auditId = audit.append({
      at: Date.now(),
      commandId: id,
      source: ctx.source,
      args: parsed.data,
      status: 'ok',
      durationMs: performance.now() - started,
      explanation: ctx.explanation,
      confidence: ctx.confidence,
      undoable: Boolean(undo),
    });
    if (undo) {
      undoStack.push({ auditId, commandId: id, source: ctx.source, undo });
      if (undoStack.length > MAX_UNDO) undoStack.shift();
    }
    const outcome: CommandOutcome<R> = { ok: true, result, auditId };
    listeners.forEach((l) => l(outcome, id, ctx));
    return outcome;
  } catch (e) {
    if (e instanceof CommandFailure) return fail({ code: e.code, message: e.message });
    return fail({ code: 'handler_error', message: e instanceof Error ? e.message : String(e) });
  }
}

/** Throw from a handler to fail with a specific, user-meaningful error code. */
export class CommandFailure extends Error {
  readonly code: CommandErrorCode;
  constructor(code: CommandErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

/**
 * Reverts the most recent undoable command, optionally restricted to a source
 * (e.g. `undoLast('ai')` powers "Undo last AI action").
 * Returns the reverted command id, or null if there was nothing to undo.
 */
export async function undoLast(source?: CommandSource): Promise<string | null> {
  for (let i = undoStack.length - 1; i >= 0; i--) {
    const rec = undoStack[i];
    if (!rec || (source && rec.source !== source)) continue;
    undoStack.splice(i, 1);
    await rec.undo();
    useAudit.getState().markUndone(rec.auditId);
    return rec.commandId;
  }
  return null;
}

export function canUndo(source?: CommandSource): boolean {
  return undoStack.some((r) => !source || r.source === source);
}

/** Test helper. */
export function __resetBus(): void {
  undoStack.length = 0;
  listeners.clear();
  permissionProvider = () => 'admin';
  aiGate = () => null;
}

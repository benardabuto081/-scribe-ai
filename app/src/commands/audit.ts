import { create } from 'zustand';
import type { CommandErrorCode, CommandSource } from './types';

export type AuditEntry = {
  id: number;
  at: number; // epoch ms
  commandId: string;
  /** "system" marks non-command failures (e.g. output sync) so they are never silent. */
  source: CommandSource | 'system';
  args: unknown;
  status: 'ok' | 'error' | 'undone';
  errorCode?: CommandErrorCode;
  errorMessage?: string;
  durationMs: number;
  explanation?: string;
  confidence?: number;
  undoable: boolean;
};

const MAX_ENTRIES = 2000;

type AuditState = {
  entries: AuditEntry[];
  append: (e: Omit<AuditEntry, 'id'>) => number;
  markUndone: (id: number) => void;
  clear: () => void;
};

let nextId = 1;

/**
 * In-memory ring buffer of every command invocation (source, args, result, timestamp).
 * Phase B persists this to SQLite; the shape is already final.
 */
export const useAudit = create<AuditState>((set) => ({
  entries: [],
  append: (e) => {
    const id = nextId++;
    set((s) => ({ entries: [...s.entries.slice(-(MAX_ENTRIES - 1)), { ...e, id }] }));
    return id;
  },
  markUndone: (id) =>
    set((s) => ({ entries: s.entries.map((x) => (x.id === id ? { ...x, status: 'undone' } : x)) })),
  clear: () => set({ entries: [] }),
}));

/** Records a failure that did not come from a command (e.g. a native call made by the Studio). */
export function recordSystemError(name: string, message: string): void {
  useAudit.getState().append({
    at: Date.now(),
    commandId: 'system.' + name,
    source: 'system',
    args: null,
    status: 'error',
    errorCode: 'handler_error',
    errorMessage: message,
    durationMs: 0,
    undoable: false,
  });
}

export function exportAuditJson(): string {
  return JSON.stringify(useAudit.getState().entries, null, 2);
}

import { create } from 'zustand';
import type { CommandErrorCode, CommandSource } from './types';

export type AuditEntry = {
  id: number;
  at: number; // epoch ms
  commandId: string;
  source: CommandSource;
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

export function exportAuditJson(): string {
  return JSON.stringify(useAudit.getState().entries, null, 2);
}

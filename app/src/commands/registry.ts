import type { z } from 'zod';
import type { CommandDef } from './types';

/**
 * The single registry of every user-visible action in Scribe AI.
 * UI buttons, keyboard shortcuts, MIDI, the remote API, macros and the AI all go through these
 * definitions via `bus.execute`. No feature may be implemented as a private click handler.
 */
const commands = new Map<string, CommandDef>();

export function defineCommand<S extends z.ZodType, R = unknown>(def: CommandDef<S, R>): CommandDef<S, R> {
  return def;
}

export function register(...defs: CommandDef[]): void {
  for (const def of defs) {
    if (commands.has(def.id)) throw new Error(`Command already registered: ${def.id}`);
    if (!/^[a-z]+(\.[a-zA-Z]+)+$/.test(def.id)) throw new Error(`Invalid command id: ${def.id}`);
    commands.set(def.id, def);
  }
}

export function getCommand(id: string): CommandDef | undefined {
  return commands.get(id);
}

export function listCommands(): CommandDef[] {
  return [...commands.values()].sort((a, b) => a.id.localeCompare(b.id));
}

/** Test helper: clears the registry. Never call from app code. */
export function __resetRegistry(): void {
  commands.clear();
}

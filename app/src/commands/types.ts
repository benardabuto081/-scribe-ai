import type { z } from 'zod';
import type { LucideIcon } from 'lucide-react';

/** Where a command invocation came from. Every invocation carries exactly one. */
export const SOURCES = ['ui', 'keyboard', 'midi', 'remote', 'macro', 'ai'] as const;
export type CommandSource = (typeof SOURCES)[number];

/**
 * Permission levels, ordered from least to most privileged.
 *  - view:     read-only / harmless (open a screen, search)
 *  - operate:  run the live service (take slide, clear, start timer)
 *  - edit:     change library content (rename, delete presentation)
 *  - admin:    settings, team, outputs assignment
 */
export const PERMISSION_LEVELS = ['view', 'operate', 'edit', 'admin'] as const;
export type PermissionLevel = (typeof PERMISSION_LEVELS)[number];

export const permissionRank = (p: PermissionLevel) => PERMISSION_LEVELS.indexOf(p);

export type CommandCategory =
  | 'slide'
  | 'screen'
  | 'look'
  | 'scripture'
  | 'song'
  | 'playlist'
  | 'timer'
  | 'message'
  | 'prop'
  | 'macro'
  | 'media'
  | 'audio'
  | 'ai'
  | 'output'
  | 'app';

export type CommandContext = {
  source: CommandSource;
  /** Present for AI-originated commands: what was heard, decided and why (CLAUDE.md AI rules). */
  explanation?: string;
  confidence?: number;
  /** True when a human operator approved this AI-originated command (Assist mode "Approve"). */
  approved?: boolean;
};

/** Returned by handlers that can be undone. Called with no args to revert. */
export type UndoFn = () => void | Promise<void>;

// Handlers may return nothing (fire-and-forget one-liners), hence `void` in the union.
// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export type HandlerResult<R> = { result?: R; undo?: UndoFn } | void;

export type CommandDef<S extends z.ZodType = z.ZodType, R = unknown> = {
  id: string;
  category: CommandCategory;
  /** i18n key for the human label (palette, audit log, docs). */
  labelKey: string;
  /** Lucide icon for palette, menus and docs (imported individually so bundles tree-shake). */
  icon?: LucideIcon;
  args: S;
  permission: PermissionLevel;
  /** Default keyboard shortcut (e.g. "Space", "Ctrl+B"). */
  shortcut?: string;
  /** Whether the AI may call this command at all. Further gated per-church in settings. */
  aiAllowed: boolean;
  /** If true, the command appears in the command palette (needs no args, or has palette-friendly defaults). */
  palette?: boolean;
  handler: (args: z.infer<S>, ctx: CommandContext) => HandlerResult<R> | Promise<HandlerResult<R>>;
};

export type CommandOutcome<R = unknown> =
  { ok: true; result?: R; auditId: number } | { ok: false; error: CommandError; auditId: number };

export type CommandErrorCode =
  | 'unknown_command'
  | 'invalid_args'
  | 'forbidden'
  | 'ai_not_allowed'
  | 'ai_paused'
  | 'ai_needs_approval'
  | 'ai_low_confidence'
  | 'not_found'
  | 'handler_error';

export type CommandError = { code: CommandErrorCode; message: string; issues?: unknown };

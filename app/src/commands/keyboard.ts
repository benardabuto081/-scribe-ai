import { formatShortcut } from '@/design-system/components/Pickers';
import { execute } from './bus';
import { listCommands } from './registry';

/** User overrides (Settings → Shortcuts, Phase B persists them). commandId → shortcut | null (disabled). */
let overrides: Record<string, string | null> = {};
export function setShortcutOverrides(o: Record<string, string | null>) {
  overrides = o;
}

export function shortcutFor(commandId: string): string | undefined {
  if (commandId in overrides) return overrides[commandId] ?? undefined;
  return listCommands().find((c) => c.id === commandId)?.shortcut;
}

function buildMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const c of listCommands()) {
    const s = c.id in overrides ? overrides[c.id] : c.shortcut;
    if (s) map.set(s, c.id);
  }
  return map;
}

function isTyping(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  return (
    el.isContentEditable ||
    el.tagName === 'INPUT' ||
    el.tagName === 'TEXTAREA' ||
    el.tagName === 'SELECT' ||
    el.getAttribute('role') === 'combobox'
  );
}

/**
 * Global keyboard → Command Bus dispatcher. Every shortcut runs a registered command with
 * source 'keyboard'. Plain keys are ignored while typing or when a dialog is open; modifier
 * combos (Ctrl+K, Ctrl+Z, ...) always work.
 */
export function installKeyboard(target: Window = window): () => void {
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.defaultPrevented || e.repeat) return;
    const combo = formatShortcut(e);
    if (!combo) return;
    const hasModifier = e.ctrlKey || e.metaKey || e.altKey;
    if (!hasModifier) {
      if (isTyping(e.target)) return;
      if (document.querySelector('[role="dialog"]')) return;
      // Let Enter/Space activate the focused control normally.
      if (
        (combo === 'Enter' || combo === 'Space') &&
        e.target instanceof HTMLElement &&
        e.target.closest('button,a,[role="button"]')
      ) {
        return;
      }
    }
    const commandId = buildMap().get(combo);
    if (!commandId) return;
    e.preventDefault();
    void execute(commandId, {}, { source: 'keyboard' });
  };
  target.addEventListener('keydown', onKeyDown);
  return () => target.removeEventListener('keydown', onKeyDown);
}

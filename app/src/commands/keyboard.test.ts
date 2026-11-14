import { execute, initCommands } from './index';
import { installKeyboard } from './keyboard';
import { useAudit } from './audit';
import { useLive } from '@/state/live';

const flush = () => new Promise((r) => setTimeout(r, 0));

beforeAll(() => initCommands());

it('keyboard shortcuts run commands with source "keyboard", but not while typing', async () => {
  const uninstall = installKeyboard();
  await execute('song.load', { songId: 'p-amazing-grace' });
  useAudit.getState().clear();

  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  await flush();
  expect(useLive.getState().programIndex).toBe(0);
  expect(useAudit.getState().entries.at(-1)).toMatchObject({ commandId: 'slide.next', source: 'keyboard' });

  const input = document.createElement('input');
  document.body.appendChild(input);
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  await flush();
  expect(useLive.getState().programIndex).toBe(0); // unchanged

  input.remove();
  uninstall();
});

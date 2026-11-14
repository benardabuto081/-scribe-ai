import { invokeChecked, isTauri } from '@/outputs/tauri';
import { useOutputs } from '@/outputs/windows';
import { useAudit } from '@/commands/audit';
import { useLive } from '@/state/live';
import { useUi } from '@/state/ui';

/**
 * End-to-end startup self-check (desktop only), enabled with `SCRIBE_SELFTEST=1`:
 *
 *   1. Ctrl+K palette: type "screens" → the top result must be "Go to → Screens"; Enter navigates.
 *   2. Click the real "Open" button on the Audience card → the Audience window must open and ack.
 *   3. Ctrl+K palette: "Amazing Grace" → Enter loads the song; Arrow Right takes slide 1.
 *   4. The Audience window must report it *rendered* "Amazing grace…".
 *   5. Rust closes the Studio and probes: the Audience must still show the slide.
 *
 * Every step prints `[selftest] …` to stdout; any failure ends the run with RESULT FAIL.
 */

const report = (line: string) => invokeChecked('selftest_report', { line }).catch(() => undefined);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function waitFor<T>(
  what: string,
  check: () => T | null | undefined | false,
  timeoutMs = 10_000,
): Promise<T> {
  const start = performance.now();
  for (;;) {
    const v = check();
    if (v) return v;
    if (performance.now() - start > timeoutMs) {
      const lastError = [...useAudit.getState().entries].reverse().find((e) => e.status === 'error');
      throw new Error(
        `timed out waiting for ${what}` +
          (lastError ? ` (last error: ${lastError.commandId}: ${lastError.errorMessage})` : ''),
      );
    }
    await sleep(100);
  }
}

/** Types into the cmdk input the way a user would (React sees a real input event). */
function typeIntoPalette(text: string) {
  const input = document.querySelector<HTMLInputElement>('[cmdk-input]');
  if (!input) throw new Error('palette input not found');
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, text);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  return input;
}

function pressKey(target: EventTarget, key: string) {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

async function paletteRun(query: string, expectTop: RegExp) {
  useUi.getState().setPaletteOpen(true);
  await waitFor('palette to open', () => document.querySelector('[cmdk-input]'));
  const input = typeIntoPalette(query);
  const top = await waitFor(`palette results for "${query}"`, () =>
    document.querySelector<HTMLElement>('[cmdk-item][data-selected="true"]'),
  );
  await sleep(150); // let cmdk finish re-sorting
  const selected = document.querySelector<HTMLElement>('[cmdk-item][data-selected="true"]') ?? top;
  const label = selected.textContent?.trim() ?? '';
  await report(`palette "${query}" → top result: "${label}"`);
  if (!expectTop.test(label)) throw new Error(`palette ranked "${label}" first for "${query}"`);
  pressKey(input, 'Enter');
}

let started = false;

export async function runSelfTestIfEnabled(): Promise<void> {
  // StrictMode runs effects twice in dev; the self-test must run once.
  if (!isTauri() || started) return;
  started = true;
  const enabled = await invokeChecked<boolean>('selftest_enabled').catch(() => false);
  if (!enabled) return;
  try {
    await sleep(1500);
    await report('start');

    // 1. Palette ranking + navigation.
    await paletteRun('screens', /Screens/);
    await waitFor('navigation to /screens', () => location.hash === '#/screens');
    await report('navigated to Screens via palette');

    // 2. Real Open button on the Audience card.
    const openBtn = await waitFor('Audience "Open" button', () =>
      [...document.querySelectorAll<HTMLButtonElement>('button')].find(
        (b) => b.textContent?.trim() === 'Open',
      ),
    );
    const t0 = performance.now();
    openBtn.click();
    await waitFor('Audience window to open', () => useOutputs.getState().open.audience);
    await waitFor('first ack from Audience', () => useOutputs.getState().acks.audience);
    await report(`audience window opened and acknowledged in ${Math.round(performance.now() - t0)} ms`);

    // 3. Load a song from the palette, take slide 1 with the keyboard.
    await paletteRun('Amazing Grace', /Amazing Grace/);
    await waitFor('song to load', () => useLive.getState().activePresentationId === 'p-amazing-grace');
    (document.activeElement as HTMLElement | null)?.blur();
    pressKey(window, 'ArrowRight');
    await waitFor('slide on program', () =>
      useLive.getState().program.slide?.text.startsWith('Amazing grace'),
    );
    await report('song loaded via palette; slide 1 taken via keyboard (→)');

    // 4. The audience must have rendered it.
    const ack = await waitFor('audience to render the slide', () => {
      const a = useOutputs.getState().acks.audience;
      return a?.rendered?.includes('Amazing grace') ? a : null;
    });
    await report(`audience rendered v${ack.version}: "${ack.rendered?.split('\n')[0]}"`);

    // 5. Close the Studio; Rust probes the audience and prints the final result.
    await report('closing studio window; audience must keep the slide');
    await invokeChecked('selftest_close_studio_and_probe');
  } catch (e) {
    await invokeChecked('selftest_fail', { reason: e instanceof Error ? e.message : String(e) }).catch(
      () => undefined,
    );
  }
}

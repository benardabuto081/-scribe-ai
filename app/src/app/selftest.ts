import { invokeChecked, isTauri } from '@/outputs/tauri';
import { useOutputs } from '@/outputs/windows';
import { useAudit } from '@/commands/audit';
import { useUi } from '@/state/ui';
import { execute } from '@/commands';

/**
 * End-to-end startup self-check (desktop only), enabled with `SCRIBE_SELFTEST=1`:
 *
 *   F. Isolated fresh profile (Rust, %TEMP%; never the real one) → splash → sign-in → Local Mode → every wizard
 *      step (Next / Skip) → Finish → app shell.
 *   0. The Studio window fits its monitor's work area and the bottom strip is visible.
 *   1. Ctrl+K palette: type "screens" → the top result must be "Go to → Screens"; Enter navigates.
 *   2. Click the real "Open" button on the Audience card → the Audience window must open and ack.
 *   3. Live Control: AI panel Approve → Program shows John 3:16; plan item → Preview → Take → Program.
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

function selftestButton(id: string) {
  return document.querySelector<HTMLButtonElement>(`[data-selftest="${id}"]`);
}

async function clickSelftest(id: string) {
  const b = await waitFor(`button [data-selftest="${id}"] on ${location.hash}`, () => {
    const el = selftestButton(id);
    return el && !el.disabled ? el : null;
  });
  b.click();
}

/** Sets a React-controlled input's value the way typing does. */
function typeInto(selector: string, text: string) {
  const input = document.querySelector<HTMLInputElement>(selector);
  if (!input) throw new Error(`input ${selector} not found`);
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, text);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

let started = false;

export async function runSelfTestIfEnabled(): Promise<void> {
  // StrictMode runs effects twice in dev; the self-test must run once.
  if (!isTauri() || started) return;
  started = true;
  const enabled = await invokeChecked<boolean>('selftest_enabled').catch(() => false);
  if (!enabled) return;
  try {
    // F. Fresh profile by isolation, never by wiping: Rust gives this run its own WebView2 profile
    // under %TEMP%. Refuse to continue unless that is true and the profile is empty.
    const profile = await invokeChecked<string | null>('selftest_profile');
    if (!profile) throw new Error('refusing to run: no isolated self-test profile');
    const existing = Object.keys(localStorage).filter(
      (k) => k.startsWith('scribe.') && k !== 'scribe.settings',
    );
    if (existing.length > 0) throw new Error(`isolated profile is not empty: ${existing.join(', ')}`);
    await report(`isolated profile in use (real profile untouched): ${profile}`);
    // Surface page errors in the log (an exception must never look like a silent no-op).
    window.addEventListener('error', (e) => void report(`page error: ${e.message}`));
    window.addEventListener('hashchange', () => void report(`→ ${location.hash}`));
    document.addEventListener(
      'submit',
      (e) => void report(`form submit on ${location.hash} (defaultPrevented=${e.defaultPrevented})`),
      true,
    );
    window.addEventListener(
      'unhandledrejection',
      (e) => void report(`unhandled rejection: ${String(e.reason)}`),
    );
    const origError = console.error;
    console.error = (...args: unknown[]) => {
      void report(`console.error: ${args.map(String).join(' ').slice(0, 300)}`);
      origError(...args);
    };
    await sleep(800);
    await report('start (fresh profile)');

    // F1. Splash → sign-in → Local Mode (fully offline).
    await waitFor('splash to route to sign-in', () => location.hash === '#/auth/sign-in');
    await clickSelftest('local-mode');
    await waitFor('wizard to open', () => document.querySelector('form[data-step="church"]'));
    await report('splash → sign-in → Continue in Local Mode → wizard');

    // F2. Wizard: fill the required church name, then Next/Skip through every step.
    await waitFor('church name field', () => document.querySelector('[data-selftest="church-name"]'));
    typeInto('[data-selftest="church-name"]', 'Selftest Fellowship');
    await waitFor('Next to enable', () => !selftestButton('wizard-next')?.disabled);
    const seen: string[] = [];
    for (let guard = 0; guard < 12 && location.hash !== '#/onboarding/finish'; guard++) {
      const before = location.hash;
      seen.push(before.replace('#/onboarding/', ''));
      const btn = await waitFor(`an enabled Next/Skip on ${before}`, () => {
        const b = selftestButton('wizard-skip') ?? selftestButton('wizard-next');
        return b && !b.disabled ? b : null;
      });
      btn.click();
      await waitFor(`wizard to leave ${before}`, () => location.hash !== before);
      // React Router renders navigations as transitions: wait until the *screen* shows the new step.
      const target = location.hash.replace('#/onboarding/', '');
      await waitFor(`step "${target}" to render`, () =>
        document.querySelector(`form[data-step="${target}"]`),
      );
    }
    await report(`wizard steps: ${seen.join(' → ')} → finish`);
    await clickSelftest('finish-home');
    await waitFor(
      'app shell after onboarding',
      () => location.hash === '#/home' && document.querySelector('footer'),
    );
    await report('wizard finished → app shell (#/home)');

    // 0. The Studio window must fit inside its monitor's work area (taskbar excluded, DPI-aware).
    type Fit = {
      fits: boolean;
      maximized: boolean;
      minimized: boolean;
      scale: number;
      outer: number[];
      workArea: number[];
    };
    const fit = await invokeChecked<Fit>('studio_window_fit');
    if (fit.minimized)
      throw new Error('studio window is minimized (see "studio window resized" lines for when)');
    await report(
      `studio window outer=${fit.outer.join(',')} workArea=${fit.workArea.join(',')} scale=${fit.scale} maximized=${fit.maximized}`,
    );
    if (!fit.fits) throw new Error('studio window is larger than the visible work area');
    const strip = document.querySelector('footer')?.getBoundingClientRect();
    if (!strip || strip.bottom > window.innerHeight + 1) throw new Error('bottom strip is not visible');
    await report('studio window fits the work area; bottom strip visible');

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

    // 3. Live Control (C1): open it from the palette.
    await paletteRun('live', /Live/);
    await waitFor('Live Control to render', () => document.querySelector('[data-monitor="program"]'));
    const monitorText = (m: 'preview' | 'program') =>
      document
        .querySelector(`[data-monitor="${m}"] .sa-tr-layer:not(.sa-tr-out) [data-slide-text]`)
        ?.textContent?.trim() ?? '';

    // 3a. AI panel Approve button (same command path as keyboard / palette).
    await execute(
      'ai.propose',
      {
        kind: 'scripture',
        heard: 'turn with me to John chapter three verse sixteen',
        decision: 'Show John 3:16 (KJV)',
        why: 'self-test proposal',
        confidence: 0.9,
        commandId: 'scripture.show',
        args: { reference: 'John 3:16' },
      },
      { source: 'ai', confidence: 0.9 },
    );
    await clickSelftest('ai-approve');
    await waitFor('Program monitor to show John 3:16', () =>
      monitorText('program').startsWith('For God so loved'),
    );
    await report('AI panel: proposal approved → Program monitor shows John 3:16');

    // 3b. Plan item → Preview monitor → Take → Program monitor.
    await clickSelftest('plan-item-pi-7');
    await waitFor('Preview monitor to show Amazing Grace', () =>
      monitorText('preview').startsWith('Amazing grace'),
    );
    await clickSelftest('take');
    await waitFor('Program monitor to show Amazing Grace', () =>
      monitorText('program').startsWith('Amazing grace'),
    );
    await report('plan item → Preview → Take → Program monitor shows "Amazing grace"');

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

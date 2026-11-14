import { vi } from 'vitest';
import { createOrderTracker } from './bridge';

describe('output snapshot ordering (no wall clock)', () => {
  it('accepts increasing versions and drops stale or duplicate ones within a session', () => {
    const accept = createOrderTracker();
    expect(accept({ session: 'A', version: 1 })).toBe(true);
    expect(accept({ session: 'A', version: 2 })).toBe(true);
    expect(accept({ session: 'A', version: 2 })).toBe(false); // duplicate
    expect(accept({ session: 'A', version: 1 })).toBe(false); // stale
  });

  it('a new Studio session resets tracking, even when its versions restart from 0', () => {
    const accept = createOrderTracker();
    expect(accept({ session: 'A', version: 500 })).toBe(true);
    expect(accept({ session: 'B', version: 0 })).toBe(true);
    expect(accept({ session: 'B', version: 1 })).toBe(true);
  });
});

describe('invokeChecked', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.doUnmock('@tauri-apps/api/core');
    vi.resetModules(); // each test gets a fresh mocked @tauri-apps/api/core
  });

  it('turns a native call that never answers (e.g. a deadlock) into a visible timeout error', async () => {
    vi.doMock('@tauri-apps/api/core', () => ({ invoke: () => new Promise(() => undefined) }));
    const { invokeChecked } = await import('./tauri');
    vi.useFakeTimers();
    const p = invokeChecked('output_open', { role: 'audience' }, { timeoutMs: 8000 });
    const assertion = expect(p).rejects.toMatchObject({
      kind: 'timeout',
      command: 'output_open',
      message: 'output_open did not respond within 8s',
    });
    await vi.advanceTimersByTimeAsync(8000);
    await assertion;
  });

  it('wraps native errors with the command name', async () => {
    vi.doMock('@tauri-apps/api/core', () => ({ invoke: () => Promise.reject('unknown output role: x') }));
    const { InvokeError, invokeChecked } = await import('./tauri');
    await expect(invokeChecked('output_open', { role: 'x' })).rejects.toBeInstanceOf(InvokeError);
    await expect(invokeChecked('output_open', { role: 'x' })).rejects.toThrow(
      'output_open failed: unknown output role: x',
    );
  });
});

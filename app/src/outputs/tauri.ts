/**
 * The only way app code calls Rust. Adds a timeout so a hung native call (e.g. a deadlock)
 * surfaces as a visible error instead of a promise that never settles.
 */
export const isTauri = (): boolean => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export class InvokeError extends Error {
  readonly command: string;
  readonly kind: 'timeout' | 'failed';
  constructor(command: string, kind: 'timeout' | 'failed', message: string) {
    super(message);
    this.command = command;
    this.kind = kind;
  }
}

export async function invokeChecked<T = unknown>(
  command: string,
  args?: Record<string, unknown>,
  { timeoutMs = 8000 }: { timeoutMs?: number } = {},
): Promise<T> {
  // Start the clock before anything async so the timeout covers the whole call.
  let timer: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = window.setTimeout(
      () =>
        reject(new InvokeError(command, 'timeout', `${command} did not respond within ${timeoutMs / 1000}s`)),
      timeoutMs,
    );
  });
  try {
    const call = import('@tauri-apps/api/core').then(({ invoke }) => invoke<T>(command, args));
    return await Promise.race([call, timeout]);
  } catch (e) {
    if (e instanceof InvokeError) throw e;
    throw new InvokeError(command, 'failed', `${command} failed: ${typeof e === 'string' ? e : String(e)}`);
  } finally {
    window.clearTimeout(timer);
  }
}

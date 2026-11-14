import * as matchers from '@testing-library/jest-dom/matchers';
import '@/i18n';

// Register jest-dom matchers on the *global* expect that tests use (`globals: true`).
// Importing `expect` from 'vitest' here can bind a second module instance on Windows when the
// shell spells the drive `c:\` instead of `C:\`, leaving the matchers on the wrong object.
expect.extend(matchers);

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;

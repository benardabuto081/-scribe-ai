/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Windows: if the shell's cwd spells the drive as `c:\` instead of `C:\`, the bundler can give the
// same file two module ids and ship React twice ("Cannot read properties of null (reading 'useRef')").
// Resolving the canonical on-disk path makes every build independent of how it was launched.
const root = realpathSync.native(dirname(fileURLToPath(import.meta.url)));

// Tauri expects a fixed dev port and must not clear the terminal.
const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  root,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': join(root, 'src') },
    dedupe: ['react', 'react-dom'],
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    watch: { ignored: ['**/src-tauri/**'] },
  },
  build: {
    target: 'es2022',
    sourcemap: false,
  },
  test: {
    root,
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    env: { VITE_USE_MOCKS: 'true' },
    css: false,
  },
});

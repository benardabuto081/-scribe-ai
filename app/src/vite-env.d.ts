/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** When "true", seeded mock data from src/mocks is loaded. Never read this outside src/mocks. */
  readonly VITE_USE_MOCKS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

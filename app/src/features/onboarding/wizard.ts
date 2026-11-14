import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** First-run wizard (SPEC §3): one step per screen, resumable (persisted), skippable where safe. */
export const STEPS = [
  { id: 'church', skippable: false },
  { id: 'languages', skippable: false },
  { id: 'hardware', skippable: true },
  { id: 'audio', skippable: true },
  { id: 'models', skippable: true },
  { id: 'displays', skippable: true },
  { id: 'import', skippable: true },
  { id: 'team', skippable: true },
  { id: 'finish', skippable: false },
] as const;
export type StepId = (typeof STEPS)[number]['id'];

export type WizardData = {
  church: { name: string; city: string; country: string; logoDataUrl: string | null };
  languages: { ui: 'en' | 'sw'; service: string[]; translations: string[] };
  audio: { deviceId: string | null; tested: boolean };
  models: {
    source: 'none' | 'download' | 'folder';
    folderName: string | null;
    files: string[];
    status: 'idle' | 'ok' | 'invalid';
  };
  team: { invites: string[] };
  imported: { songs: number; media: number };
};

const initialData: WizardData = {
  church: { name: '', city: '', country: 'Kenya', logoDataUrl: null },
  languages: { ui: 'en', service: ['en', 'sw'], translations: ['kjv'] },
  audio: { deviceId: null, tested: false },
  models: { source: 'none', folderName: null, files: [], status: 'idle' },
  team: { invites: [] },
  imported: { songs: 0, media: 0 },
};

type WizardState = {
  current: StepId;
  visited: StepId[];
  skipped: StepId[];
  data: WizardData;
  goTo: (s: StepId) => void;
  patch: <K extends keyof WizardData>(key: K, value: Partial<WizardData[K]>) => void;
  markSkipped: (s: StepId) => void;
  reset: () => void;
};

export const useWizard = create<WizardState>()(
  persist(
    (set) => ({
      current: 'church',
      visited: ['church'],
      skipped: [],
      data: initialData,
      goTo: (current) =>
        set((s) => ({ current, visited: s.visited.includes(current) ? s.visited : [...s.visited, current] })),
      patch: (key, value) => set((s) => ({ data: { ...s.data, [key]: { ...s.data[key], ...value } } })),
      markSkipped: (step) =>
        set((s) => ({ skipped: s.skipped.includes(step) ? s.skipped : [...s.skipped, step] })),
      reset: () => set({ current: 'church', visited: ['church'], skipped: [], data: initialData }),
    }),
    { name: 'scribe.onboarding' },
  ),
);

export const stepIndex = (id: StepId) => STEPS.findIndex((s) => s.id === id);
export const nextStep = (id: StepId): StepId | null => STEPS[stepIndex(id) + 1]?.id ?? null;
export const prevStep = (id: StepId): StepId | null => STEPS[stepIndex(id) - 1]?.id ?? null;

/** Expected files in a faster-whisper model pack folder (validated when loading from USB/folder). */
export const MODEL_PACK_REQUIRED = ['model.bin', 'config.json'];
export const MODEL_PACK_ONE_OF = ['tokenizer.json', 'vocabulary.txt', 'vocabulary.json'];

export function validateModelPack(fileNames: string[]): { ok: boolean; missing: string[] } {
  const names = new Set(fileNames.map((f) => f.split(/[\\/]/).pop()?.toLowerCase() ?? ''));
  const missing = MODEL_PACK_REQUIRED.filter((r) => !names.has(r));
  if (!MODEL_PACK_ONE_OF.some((n) => names.has(n))) missing.push(MODEL_PACK_ONE_OF.join(' / '));
  return { ok: missing.length === 0, missing };
}

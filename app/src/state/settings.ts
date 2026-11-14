import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Density, ThemeId } from '@/design-system/tokens/tokens';
import { setLanguage, type Language } from '@/i18n';

type SettingsState = {
  theme: ThemeId;
  density: Density;
  language: Language;
  largeText: boolean;
  setTheme: (t: ThemeId) => void;
  setDensity: (d: Density) => void;
  setLanguage: (l: Language) => void;
  setLargeText: (v: boolean) => void;
};

/** Writes appearance settings onto <html> so tokens.css theme selectors apply everywhere. */
export function applyAppearance(s: Pick<SettingsState, 'theme' | 'density' | 'largeText'>) {
  const root = document.documentElement;
  root.dataset.theme = s.theme;
  root.dataset.density = s.density;
  root.dataset.textScale = s.largeText ? 'large' : 'normal';
}

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      density: 'comfortable',
      language: 'en',
      largeText: false,
      setTheme: (theme) => {
        set({ theme });
        applyAppearance(get());
      },
      setDensity: (density) => {
        set({ density });
        applyAppearance(get());
      },
      setLanguage: (language) => {
        set({ language });
        setLanguage(language);
      },
      setLargeText: (largeText) => {
        set({ largeText });
        applyAppearance(get());
      },
    }),
    {
      name: 'scribe.settings',
      onRehydrateStorage: () => (state) => {
        if (state) applyAppearance(state);
      },
    },
  ),
);

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type UiState = {
  paletteOpen: boolean;
  inspectorOpen: boolean;
  railExpanded: boolean;
  setPaletteOpen: (v: boolean) => void;
  toggleInspector: () => void;
  setRailExpanded: (v: boolean) => void;
};

export const useUi = create<UiState>()(
  persist(
    (set) => ({
      paletteOpen: false,
      inspectorOpen: true,
      railExpanded: false,
      setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
      toggleInspector: () => set((s) => ({ inspectorOpen: !s.inspectorOpen })),
      setRailExpanded: (railExpanded) => set({ railExpanded }),
    }),
    {
      name: 'scribe.ui',
      partialize: (s) => ({ inspectorOpen: s.inspectorOpen, railExpanded: s.railExpanded }),
    },
  ),
);

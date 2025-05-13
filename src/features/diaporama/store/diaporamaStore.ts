import { create } from "zustand";
import { DiaporamaState, DiaporamaConfig } from "../types";

interface DiaporamaActions {
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setDiaporamas: (diaporamas: DiaporamaConfig[]) => void;
  setCurrentDiaporama: (diaporama: DiaporamaConfig | null) => void;
  clearCurrentDiaporama: () => void;
  addDiaporama: (diaporama: DiaporamaConfig) => void;
  updateDiaporama: (diaporama: DiaporamaConfig) => void;
  deleteDiaporama: (id: number) => void;
  resetState: () => void;
}

const initialState: DiaporamaState = {
  diaporamas: [],
  currentDiaporama: null,
  isLoading: false,
  error: null,
};

export const useDiaporamaStore = create<DiaporamaState & DiaporamaActions>(
  (set) => ({
    ...initialState,

    setLoading: (isLoading: boolean) => set({ isLoading }),
    setError: (error: string | null) => set({ error }),

    setDiaporamas: (diaporamas: DiaporamaConfig[]) =>
      set({ diaporamas: Array.isArray(diaporamas) ? diaporamas : [] }),

    setCurrentDiaporama: (diaporama: DiaporamaConfig | null) =>
      set({
        currentDiaporama: diaporama,
      }),

    clearCurrentDiaporama: () =>
      set({
        currentDiaporama: null,
      }),

    addDiaporama: (diaporama: DiaporamaConfig) =>
      set((state) => ({
        diaporamas: [...state.diaporamas, diaporama],
      })),

    updateDiaporama: (diaporama: DiaporamaConfig) =>
      set((state) => ({
        diaporamas: state.diaporamas.map((d) =>
          d.id === diaporama.id ? diaporama : d
        ),
        currentDiaporama:
          state.currentDiaporama?.id === diaporama.id
            ? diaporama
            : state.currentDiaporama,
      })),

    deleteDiaporama: (id: number) =>
      set((state) => ({
        diaporamas: state.diaporamas.filter((d) => d.id !== id),
        currentDiaporama:
          state.currentDiaporama?.id === id ? null : state.currentDiaporama,
      })),

    resetState: () => set(initialState),
  })
);

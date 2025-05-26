import { create } from "zustand";
import { KonvaShape, SlideStore } from "../types";

// ===== TYPES DU STORE =====

interface SlideActions {
  // Actions de navigation
  setCurrentSlide: (slideIndex: number) => void;

  // Actions de sélection
  setSelectedShapes: (shapes: KonvaShape[]) => void;

  // Actions d'état
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Actions utilitaires
  resetState: () => void;
}

// ===== STORE ZUSTAND =====

export const slideStore = create<SlideStore & SlideActions>((set) => ({
  // État initial
  currentSlide: 0,
  isLoading: false,
  error: null,
  selectedShapes: [],

  // Actions de navigation
  setCurrentSlide: (slideIndex: number) => set({ currentSlide: slideIndex }),

  // Actions d'état
  setLoading: (isLoading: boolean) => set({ isLoading }),

  setError: (error: string | null) => set({ error }),

  // Actions de sélection
  setSelectedShapes: (shapes: KonvaShape[]) => set({ selectedShapes: shapes }),

  // Actions utilitaires
  resetState: () =>
    set({
      currentSlide: 0,
      isLoading: false,
      error: null,
      selectedShapes: [],
    }),
}));

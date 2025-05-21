import { create } from "zustand";
import { KonvaShape, SlideStore } from "../types";

interface SlideActions {
  setCurrentSlide: (slideIndex: number) => void;
  setSelectedShapes: (shapes: KonvaShape[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  resetState: () => void;
}

export const slideStore = create<SlideStore & SlideActions>((set) => ({
  currentSlide: 0,
  isLoading: false,
  error: null,
  selectedShapes: [],

  setCurrentSlide: (slideIndex: number) => set({ currentSlide: slideIndex }),
  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),
  resetState: () => set({ currentSlide: 0, isLoading: false, error: null }),
  setSelectedShapes: (shapes: KonvaShape[]) => set({ selectedShapes: shapes }),
}));

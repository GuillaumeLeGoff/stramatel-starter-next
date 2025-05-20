import { create } from "zustand";
import { SlideStore } from "../types";

interface SlideActions {
  setCurrentSlide: (slideIndex: number) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  resetState: () => void;
}

export const slideStore = create<SlideStore & SlideActions>((set) => ({
  currentSlide: 0,
  isLoading: false,
  error: null,

  setCurrentSlide: (slideIndex: number) => set({ currentSlide: slideIndex }),
  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),
  resetState: () => set({ currentSlide: 0, isLoading: false, error: null }),
}));

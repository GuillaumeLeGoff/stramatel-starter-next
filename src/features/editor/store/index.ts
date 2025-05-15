import { create } from "zustand";
import { EditorState } from "../types";

interface EditorActions {
  setCurrentSlide: (slideIndex: number) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  resetState: () => void;
}

const initialState: EditorState = {
  currentSlide: 0,
  isLoading: false,
  error: null,
};

export const useEditorStore = create<EditorState & EditorActions>((set) => ({
  ...initialState,

  setCurrentSlide: (slideIndex: number) => set({ currentSlide: slideIndex }),
  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),
  resetState: () => set(initialState),
}));

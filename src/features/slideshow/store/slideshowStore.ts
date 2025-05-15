import { create } from "zustand";
  import { SlideshowState, SlideshowConfig } from "../types";

interface SlideshowActions {
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setSlideshows: (slideshows: SlideshowConfig[]) => void;
  setCurrentSlideshow: (slideshow: SlideshowConfig | null) => void;
  clearCurrentSlideshow: () => void;
  addSlideshow: (slideshow: SlideshowConfig) => void;
  updateSlideshow: (slideshow: SlideshowConfig) => void;
  deleteSlideshow: (id: number) => void;
  resetState: () => void;
  setEditorOpen: (open: boolean) => void;
}

const initialState: SlideshowState = {
  slideshows: [],
  currentSlideshow: null,
  isLoading: false,
  error: null,
  isEditorOpen: false,
};

export const useSlideshowStore = create<SlideshowState & SlideshowActions>(
  (set) => ({
    ...initialState,

    setLoading: (isLoading: boolean) => set({ isLoading }),
    setError: (error: string | null) => set({ error }),

    setSlideshows: (slideshows: SlideshowConfig[]) =>
      set({ slideshows: Array.isArray(slideshows) ? slideshows : [] }),

    setCurrentSlideshow: (slideshow: SlideshowConfig | null) =>
      set({
        currentSlideshow: slideshow,
      }),

    clearCurrentSlideshow: () =>
      set({
        currentSlideshow: null,
      }),

    addSlideshow: (slideshow: SlideshowConfig) =>
      set((state) => ({
        slideshows: [...state.slideshows, slideshow],
      })),

    updateSlideshow: (slideshow: SlideshowConfig) =>
      set((state) => ({
        slideshows: state.slideshows.map((s) =>
          s.id === slideshow.id ? slideshow : s
        ),
        currentSlideshow:
          state.currentSlideshow?.id === slideshow.id
            ? slideshow
            : state.currentSlideshow,
      })),

    deleteSlideshow: (id: number) =>
      set((state) => ({
        slideshows: state.slideshows.filter((s) => s.id !== id),
        currentSlideshow:
          state.currentSlideshow?.id === id ? null : state.currentSlideshow,
      })),

    resetState: () => set(initialState),
    
    setEditorOpen: (isEditorOpen: boolean) => set({ isEditorOpen }),
  })
);

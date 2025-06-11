import { create } from "zustand";
import { SlideshowState, SlideshowConfig, SlideshowFormData } from "../types";
import * as slideshowApi from "../api/slideshowApi";

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
  
  // Actions API
  fetchSlideshows: () => Promise<SlideshowConfig[]>;
  createSlideshow: (formData: SlideshowFormData, userId: number) => Promise<SlideshowConfig | null>;
  deleteSlideshowById: (id: number) => Promise<boolean>;
  fetchSlideshowById: (id: number) => Promise<void>;
}

const initialState: SlideshowState = {
  slideshows: [],
  currentSlideshow: null,
  isLoading: false,
  error: null,
  isEditorOpen: false,
};

export const useSlideshowStore = create<SlideshowState & SlideshowActions>(
  (set, get) => ({
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

    // Actions API intégrées dans le store
    fetchSlideshows: async () => {
      const { isLoading } = get();
      if (isLoading) return []; // Éviter les appels multiples simultanés

      set({ isLoading: true, error: null });

      try {
        console.log("Récupération des slideshows...");
        const data = await slideshowApi.fetchAllSlideshows();

        if (Array.isArray(data)) {
          console.log(`${data.length} slideshows récupérés`);
          set({ slideshows: data, isLoading: false });
          return data;
        } else {
          console.error("Les données reçues ne sont pas un tableau:", data);
          set({ slideshows: [], isLoading: false });
          return [];
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
        console.error("Erreur lors de la récupération des slideshows:", error);
        set({ 
          error: errorMessage, 
          slideshows: [], 
          isLoading: false 
        });
        return [];
      }
    },

    createSlideshow: async (formData: SlideshowFormData, userId: number) => {
      set({ isLoading: true, error: null });

      try {
        const data = await slideshowApi.createSlideshow(formData, userId);
        
        set((state) => ({
          slideshows: [...state.slideshows, data],
          isLoading: false
        }));
        
        return data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
        console.error("Erreur lors de la création du slideshow:", error);
        set({ error: errorMessage, isLoading: false });
        return null;
      }
    },

    deleteSlideshowById: async (id: number) => {
      set({ isLoading: true, error: null });

      try {
        await slideshowApi.deleteSlideshow(id);
        
        set((state) => ({
          slideshows: state.slideshows.filter((s) => s.id !== id),
          currentSlideshow: state.currentSlideshow?.id === id ? null : state.currentSlideshow,
          isLoading: false
        }));
        
        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
        console.error("Erreur lors de la suppression du slideshow:", error);
        set({ error: errorMessage, isLoading: false });
        return false;
      }
    },

    fetchSlideshowById: async (id: number) => {
      set({ error: null });

      try {
        const data = await slideshowApi.fetchSlideshowById(id);
        set({ currentSlideshow: data });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
        console.error("Erreur lors de la récupération du slideshow:", error);
        set({ error: errorMessage });
      }
    },
  })
);

import { useCallback } from "react";
import { useSlideshowStore } from "../store/slideshowStore";
import { SlideshowFormData, KonvaData } from "../types";
import { useAuth } from "@/features/auth/hooks/useAuth";
import * as slideshowApi from "../api/slideshowApi";

export function useSlideshow() {
  const {
    slideshows,
    currentSlideshow,
    isLoading,
    error,
    setSlideshows,
    setCurrentSlideshow,
    clearCurrentSlideshow,
    addSlideshow,
    updateSlideshow,
    deleteSlideshow,
    setLoading,
    setError,
  } = useSlideshowStore();

  const { user } = useAuth();

  // Charge tous les slideshows
  const fetchSlideshows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await slideshowApi.fetchAllSlideshows();
      
      // S'assurer que data est un tableau
      if (Array.isArray(data)) {
        setSlideshows(data);
      } else {
        console.error("Les données reçues ne sont pas un tableau:", data);
        setSlideshows([]);
      }
      return data;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      setError(errorMessage);
      console.error("Erreur lors de la récupération des slideshows:", error);
      // Initialiser avec un tableau vide en cas d'erreur
      setSlideshows([]);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setSlideshows]);

  // Charge un slideshow spécifique
  const fetchSlideshowById = useCallback(
    async (id: number) => {
      try {
        setLoading(true);
        setError(null);

        const data = await slideshowApi.fetchSlideshowById(id);
        
        // Vérifier que les données sont valides
        if (data && typeof data === "object" && "id" in data) {
          // S'assurer que slides est toujours un tableau, même vide
          if (!Array.isArray(data.slides)) {
            data.slides = [];
          }
          setCurrentSlideshow(data);
          return data;
        } else {
          throw new Error("Format de données de slideshow invalide");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";
        setError(errorMessage);
        console.error("Erreur lors de la récupération du slideshow:", error);
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setCurrentSlideshow]
  );

  // Crée un nouveau slideshow
  const createSlideshow = useCallback(
    async (formData: SlideshowFormData) => {
      if (!user) {
        setError("Vous devez être connecté pour créer un slideshow");
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        const data = await slideshowApi.createSlideshow(formData, user.id);
        
        addSlideshow(data);
        return data;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";
        setError(errorMessage);
        console.error("Erreur lors de la création du slideshow:", error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user, setLoading, setError, addSlideshow]
  );

  // Met à jour un slideshow existant
  const updateSlideshowById = useCallback(
    async (id: number, formData: SlideshowFormData) => {
      try {
        setLoading(true);
        setError(null);

        const data = await slideshowApi.updateSlideshow(id, formData);
        
        updateSlideshow(data);
        return data;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";
        setError(errorMessage);
        console.error("Erreur lors de la mise à jour du slideshow:", error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, updateSlideshow]
  );

  // Met à jour une slide
  const updateSlide = useCallback(
    async (
      slideId: number,
      slideData: Partial<{
        duration?: number;
        position?: number;
        mediaId?: number | null;
        width?: number;
        height?: number;
        konvaData?: KonvaData;
      }>
    ) => {
      try {
        setLoading(true);
        setError(null);

        const updatedSlide = await slideshowApi.updateSlide(slideId, slideData);

        // Mettre à jour le slideshow courant avec la slide mise à jour
        if (currentSlideshow) {
          const updatedSlides = currentSlideshow.slides.map((slide) =>
            slide.id === updatedSlide.id ? updatedSlide : slide
          );

          setCurrentSlideshow({
            ...currentSlideshow,
            slides: updatedSlides,
          });
        }

        return updatedSlide;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";
        setError(errorMessage);
        console.error("Erreur lors de la mise à jour de la slide:", error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, currentSlideshow, setCurrentSlideshow]
  );

  // Supprime un slideshow
  const deleteSlideshowById = useCallback(
    async (id: number) => {
      try {
        setLoading(true);
        setError(null);

        await slideshowApi.deleteSlideshow(id);
        
        deleteSlideshow(id);
        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";
        setError(errorMessage);
        console.error("Erreur lors de la suppression du slideshow:", error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, deleteSlideshow]
  );

  // Crée une nouvelle slide dans un slideshow
  const createSlide = useCallback(
    async (slideData: {
      slideshowId: number;
      position: number;
      duration: number;
    }) => {
      try {
        setLoading(true);
        setError(null);

        const newSlide = await slideshowApi.createSlide(slideData);

        // Mettre à jour le slideshow courant avec la nouvelle slide
        if (currentSlideshow && newSlide.slideshowId === currentSlideshow.id) {
          setCurrentSlideshow({
            ...currentSlideshow,
            slides: [...currentSlideshow.slides, newSlide],
          });
        }

        return newSlide;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";
        setError(errorMessage);
        console.error("Erreur lors de la création de la slide:", error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, currentSlideshow, setCurrentSlideshow]
  );

  return {
    slideshows,
    currentSlideshow,
    isLoading,
    error,
    fetchSlideshows,
    fetchSlideshowById,
    createSlideshow,
    updateSlideshowById,
    deleteSlideshowById,
    clearCurrentSlideshow,
    updateSlide,
    createSlide,
  };
}

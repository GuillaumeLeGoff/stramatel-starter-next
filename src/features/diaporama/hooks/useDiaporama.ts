import { useCallback } from "react";
import { useDiaporamaStore } from "../store/diaporamaStore";
import { DiaporamaFormData, KonvaData } from "../types";
import { useAuth } from "@/features/auth/hooks/useAuth";

export function useDiaporama() {
  const {
    diaporamas,
    currentDiaporama,
    isLoading,
    error,
    setDiaporamas,
    setCurrentDiaporama,
    clearCurrentDiaporama,
    addDiaporama,
    updateDiaporama,
    deleteDiaporama,
    setLoading,
    setError,
  } = useDiaporamaStore();

  const { user } = useAuth();

  // Charge tous les diaporamas
  const fetchDiaporamas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/slideshows");

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des diaporamas");
      }

      const data = await response.json();
      // S'assurer que data est un tableau
      if (Array.isArray(data)) {
        setDiaporamas(data);
      } else {
        console.error("Les données reçues ne sont pas un tableau:", data);
        setDiaporamas([]);
      }
      return data;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      setError(errorMessage);
      console.error("Erreur lors de la récupération des diaporamas:", error);
      // Initialiser avec un tableau vide en cas d'erreur
      setDiaporamas([]);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setDiaporamas]);

  // Charge un diaporama spécifique
  const fetchDiaporamaById = useCallback(
    async (id: number) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/slideshows/${id}`);

        if (!response.ok) {
          throw new Error("Erreur lors de la récupération du diaporama");
        }

        const data = await response.json();
        // Vérifier que les données sont valides
        if (data && typeof data === "object" && "id" in data) {
          // S'assurer que slides est toujours un tableau, même vide
          if (!Array.isArray(data.slides)) {
            data.slides = [];
          }
          setCurrentDiaporama(data);
          return data;
        } else {
          throw new Error("Format de données de diaporama invalide");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";
        setError(errorMessage);
        console.error("Erreur lors de la récupération du diaporama:", error);
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setCurrentDiaporama]
  );

  // Crée un nouveau diaporama
  const createDiaporama = useCallback(
    async (formData: DiaporamaFormData) => {
      if (!user) {
        setError("Vous devez être connecté pour créer un diaporama");
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/slideshows", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            createdBy: user.id,
          }),
        });

        if (!response.ok) {
          throw new Error("Erreur lors de la création du diaporama");
        }

        const data = await response.json();
        addDiaporama(data);
        return data;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";
        setError(errorMessage);
        console.error("Erreur lors de la création du diaporama:", error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user, setLoading, setError, addDiaporama]
  );

  // Met à jour un diaporama existant
  const updateDiaporamaById = useCallback(
    async (id: number, formData: DiaporamaFormData) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/slideshows/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error("Erreur lors de la mise à jour du diaporama");
        }

        const data = await response.json();
        updateDiaporama(data);
        return data;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";
        setError(errorMessage);
        console.error("Erreur lors de la mise à jour du diaporama:", error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, updateDiaporama]
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

        const response = await fetch(`/api/slides/${slideId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(slideData),
        });

        if (!response.ok) {
          throw new Error("Erreur lors de la mise à jour de la slide");
        }

        const updatedSlide = await response.json();

        // Mettre à jour le diaporama courant avec la slide mise à jour
        if (currentDiaporama) {
          const updatedSlides = currentDiaporama.slides.map((slide) =>
            slide.id === updatedSlide.id ? updatedSlide : slide
          );

          setCurrentDiaporama({
            ...currentDiaporama,
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
    [setLoading, setError, currentDiaporama, setCurrentDiaporama]
  );

  // Supprime un diaporama
  const deleteDiaporamaById = useCallback(
    async (id: number) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/slideshows/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Erreur lors de la suppression du diaporama");
        }

        deleteDiaporama(id);
        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";
        setError(errorMessage);
        console.error("Erreur lors de la suppression du diaporama:", error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, deleteDiaporama]
  );

  // Crée une nouvelle slide dans un diaporama
  const createSlide = useCallback(
    async (slideData: {
      diaporamaId: number;
      position: number;
      duration: number;
    }) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/slides`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(slideData),
        });

        if (!response.ok) {
          throw new Error("Erreur lors de la création de la slide");
        }

        const newSlide = await response.json();

        // Mettre à jour le diaporama courant avec la nouvelle slide
        if (currentDiaporama && newSlide.diaporamaId === currentDiaporama.id) {
          setCurrentDiaporama({
            ...currentDiaporama,
            slides: [...currentDiaporama.slides, newSlide],
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
    [setLoading, setError, currentDiaporama, setCurrentDiaporama]
  );

  return {
    diaporamas,
    currentDiaporama,
    isLoading,
    error,
    fetchDiaporamas,
    fetchDiaporamaById,
    createDiaporama,
    updateDiaporamaById,
    deleteDiaporamaById,
    clearCurrentDiaporama,
    updateSlide,
    createSlide,
  };
}

import { useCallback, useEffect, useState } from "react";
import {
  createSlide,
  deleteSlide as deleteSlideAPI,
  updateSlide,
} from "../api/slideApi";
import { KonvaStage, Slide } from "../types";
import { slideStore } from "../store/slideStore";
import { useSlideshow } from "@/features/slideshow/hooks";
import { SlideshowSlide } from "@/features/slideshow/types";

interface UseSlideProps {
  stageData: KonvaStage | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function useSlide({ stageData, containerRef }: UseSlideProps) {
  const [previewScale, setPreviewScale] = useState(0.2);
  const { setCurrentSlide } = slideStore();
  const { updateCurrentSlideshow, currentSlideshow } = useSlideshow();

  // Calculer l'échelle appropriée en fonction des dimensions du conteneur
  const calculateScale = useCallback(() => {
    if (!containerRef.current || !stageData) return;

    const container = containerRef.current;

    // Obtenir les dimensions du conteneur
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Calculer le ratio pour adapter le canvas au conteneur
    const scaleX = containerWidth / stageData.width;
    const scaleY = containerHeight / stageData.height;

    // Utiliser le plus petit ratio pour s'assurer que tout est visible
    const newScale = Math.min(scaleX, scaleY) * 0.9; // 90% pour une petite marge

    setPreviewScale(newScale);
  }, [containerRef, stageData]);

  // Mettre à jour l'échelle lorsque les dimensions changent
  useEffect(() => {
    if (!stageData) return;

    // Calculer l'échelle initiale
    calculateScale();

    return () => {
      window.removeEventListener("resize", calculateScale);
    };
  }, [stageData, calculateScale]);

  // Créer une version modifiée du stageData pour n'afficher que la zone centrale
  const createViewportStageData = useCallback(() => {
    if (!stageData) return null;

    return {
      ...stageData,
      // Utiliser les dimensions du viewport (800x600)
      width: stageData.width,
      height: stageData.height,
      attrs: {
        // Pour le rendu, on maintient les dimensions du viewport
        width: stageData.width,
        height: stageData.height,
        x: 0,
        y: 0,
      },
      className: "Stage",
      // Ajuster les positions des enfants pour centrer la vue
      children: stageData.children.map((layer) => ({
        ...layer,
        attrs: { ...layer.attrs },
        children: layer.children.map((child) => {
          const centerOffsetX = (stageData.attrs.width - stageData.width) / 2;
          const centerOffsetY = (stageData.attrs.height - stageData.height) / 2;

          return {
            ...child,
            attrs: {
              ...child.attrs,
              // Ajuster la position pour que seule la partie centrale soit visible
              // (soustrait le décalage pour centrer la vue)
              x: child.attrs.x ? child.attrs.x - centerOffsetX : 0,
              y: child.attrs.y ? child.attrs.y - centerOffsetY : 0,
            },
          };
        }),
      })),
    } as KonvaStage;
  }, [stageData]);

  /**
   * Crée une nouvelle slide via l'API et l'ajoute au slideshow actuel
   */
  const createSlideAndAddToShow = async (slideData: Partial<Slide>) => {
    try {
      // 1. Créer la slide dans la base de données via l'API
      const newSlide = await createSlide(slideData);

      // 2. Mettre à jour le slideshow actuel avec la nouvelle slide
      if (currentSlideshow && updateCurrentSlideshow) {
        updateCurrentSlideshow((prev) => ({
          ...prev,
          slides: prev.slides ? [...prev.slides, newSlide] : [newSlide],
        }));
      }

      // 3. Mettre à jour la slide courante dans le store pour qu'elle soit active
      setCurrentSlide(currentSlideshow?.slides?.length || 0);

      return newSlide;
    } catch (error) {
      console.error("Erreur lors de la création de la slide", error);
      throw error;
    }
  };

  // Fonction pour ajouter une nouvelle slide
  const addSlide = async (slideData: Partial<Slide>) => {
    if (!currentSlideshow) return;
    try {
      return await createSlideAndAddToShow(slideData);
    } catch (error) {
      console.error("Erreur lors de l'ajout d'une slide", error);
      return null;
    }
  };

  /**
   * Supprime une slide via l'API et la retire du slideshow actuel
   */
  const deleteSlide = async (slideId: number) => {
    if (!currentSlideshow || !updateCurrentSlideshow) return;

    try {
      // 1. Supprimer la slide dans la base de données via l'API
      await deleteSlideAPI(slideId);

      // 2. Mettre à jour le slideshow actuel en supprimant la slide
      updateCurrentSlideshow((prev) => ({
        ...prev,
        slides: prev.slides
          ? prev.slides.filter((slide) => slide.id !== slideId)
          : [],
      }));

      // 3. Si nous avons des slides restantes et que l'index actuel est hors limites, ajustez-le
      if (currentSlideshow.slides && currentSlideshow.slides.length > 0) {
        const currentIndex = slideStore.getState().currentSlide;
        const newLength = currentSlideshow.slides.length - 1;

        if (currentIndex >= newLength) {
          setCurrentSlide(Math.max(0, newLength - 1));
        }
      }

      return true;
    } catch (error) {
      console.error("Erreur lors de la suppression de la slide", error);
      return false;
    }
  };

  /**
   * Met à jour l'ordre des slides après un déplacement par drag and drop
   */
  const updateSlidesOrder = async (slides: SlideshowSlide[]) => {
    if (!currentSlideshow || !updateCurrentSlideshow) return;

    try {
      // Créer un tableau de promesses pour mettre à jour toutes les slides en parallèle
      const updatePromises = slides.map((slide, index) =>
        updateSlide(slide.id, { position: index })
      );

      // Attendre que toutes les mises à jour soient terminées
      await Promise.all(updatePromises);

      // Mettre à jour le slideshow actuel avec les nouvelles positions
      updateCurrentSlideshow((prev) => ({
        ...prev,
        slides: slides,
      }));

      return true;
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour de l'ordre des slides",
        error
      );
      return false;
    }
  };

  return {
    previewScale,
    viewportStageData: createViewportStageData(),
    calculateScale,
    createSlideAndAddToShow,
    addSlide,
    deleteSlide,
    updateSlidesOrder,
  };
}

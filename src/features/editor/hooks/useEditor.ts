import { useSlideshow } from "@/features/slideshow/hooks";
import { useCallback, useMemo, useRef } from "react";
import { slideStore } from "../store/slideStore";
import { KonvaStage } from "../types";

export function useEditor() {
  const {
    currentSlide,
    setCurrentSlide,
    isLoading,
    setLoading,
    error,
    setError,
    selectedShapes,
    setSelectedShapes,
  } = slideStore();

  const { currentSlideshow } = useSlideshow();

  const containerRef = useRef<HTMLDivElement>(null);

  // Récupérer les données Konva du slide courant
  const getCurrentSlideKonvaData = useCallback((): KonvaStage | null => {
    if (
      !currentSlideshow ||
      !currentSlideshow.slides ||
      currentSlideshow.slides.length === 0
    ) {
      return null;
    }

    const slide = currentSlideshow.slides[currentSlide];
    if (!slide) return null;

    // Si le slide a des données Konva, les retourner
    if (slide.konvaData) {
      return slide.konvaData as unknown as KonvaStage;
    }

    // Sinon, créer un stage Konva par défaut
    return {
      width: 800,
      height: 600,
      attrs: {
        width: slide.width || 1920,
        height: slide.height || 1080,
      },
      className: "Stage",
      children: [
        {
          attrs: {},
          className: "Layer",
          children: [],
        },
      ],
    };
  }, [currentSlideshow, currentSlide]);

  // Obtenir le konvaData actuel (mémorisé)
  const currentKonvaData = useMemo(
    () => getCurrentSlideKonvaData(),
    [getCurrentSlideKonvaData]
  );

  // Changer de slide
  const changeSlide = useCallback(
    (slideIndex: number) => {
      if (!currentSlideshow || !currentSlideshow.slides) return;

      if (slideIndex >= 0 && slideIndex < currentSlideshow.slides.length) {
        // Réinitialiser les formes sélectionnées lors d'un changement de slide
        setSelectedShapes([]);
        setCurrentSlide(slideIndex);
      }
    },
    [currentSlideshow, setCurrentSlide, setSelectedShapes]
  );

  // Mettre à jour une forme sélectionnée
  const updateSelectedShape = useCallback(
    (updatedAttrs: Record<string, unknown>) => {
      if (!selectedShapes || selectedShapes.length === 0) return;

      // Mettre à jour l'état local des formes sélectionnées
      const updatedSelectedShapes = selectedShapes.map((shape) => ({
        ...shape,
        attrs: {
          ...shape.attrs,
          ...updatedAttrs,
        },
      })) as typeof selectedShapes;

      setSelectedShapes(updatedSelectedShapes);

      console.log("Formes mises à jour avec les attributs:", updatedAttrs);
    },
    [selectedShapes, setSelectedShapes]
  );

  return {
    // État
    currentSlide,
    isLoading,
    error,
    containerRef,
    selectedShapes,

    // Données Konva
    getCurrentSlideKonvaData,
    currentKonvaData,

    // Actions de navigation
    changeSlide,

    // Actions d'état
    setLoading,
    setError,
    setSelectedShapes,

    // Actions sur les formes
    updateSelectedShape,
  };
}

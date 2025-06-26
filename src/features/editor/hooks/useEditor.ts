import { useSlideshow } from "@/features/slideshow/hooks";
import { useCallback, useMemo, useRef } from "react";
import { slideStore } from "../store/slideStore";
import { useEditorStore } from "../store/editorStore";
import { KonvaStage } from "../types";
import { useAppSettings } from "@/shared/hooks/useAppSettings";

export function useEditor() {
  const {
    currentSlide,
    setCurrentSlide,
  } = slideStore();

  const {
    isLoading,
    error,
    selectedShapes,
    editingTextId,
    stageScale,
    stagePosition,
    setLoading,
    setError,
    setSelectedShapes,
    setEditingTextId,
    setStageScale,
    setStagePosition,
  } = useEditorStore();

  const { currentSlideshow } = useSlideshow();
  const { width, height } = useAppSettings();

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
    if (slide.konvaData) {
      const konvaData = slide.konvaData as unknown as KonvaStage;
      return {
        ...konvaData,
        attrs: {
          ...konvaData.attrs,
        },
      };
    }

    return null;
  }, [currentSlideshow, currentSlide]);

  // Obtenir le konvaData actuel (mémorisé)
  const currentKonvaData = useMemo(
    () => getCurrentSlideKonvaData(),
    [getCurrentSlideKonvaData]
  );

  // Actions métier implémentées dans le hook

  // Effacer la sélection
  const clearSelection = useCallback(() => {
    setSelectedShapes([]);
  }, [setSelectedShapes]);

  // Réinitialiser la transformation du canvas
  const resetCanvasTransform = useCallback(() => {
    setStageScale(1);
    setStagePosition({ x: 0, y: 0 });
  }, [setStageScale, setStagePosition]);

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
      }));

      setSelectedShapes(updatedSelectedShapes);
      console.log("Formes mises à jour avec les attributs:", updatedAttrs);
    },
    [selectedShapes, setSelectedShapes]
  );

  // Réinitialiser l'éditeur
  const resetEditor = useCallback(() => {
    setLoading(false);
    setError(null);
    setSelectedShapes([]);
    setEditingTextId(null);
    setStageScale(1);
    setStagePosition({ x: 0, y: 0 });
  }, [setLoading, setError, setSelectedShapes, setEditingTextId, setStageScale, setStagePosition]);

  // Changer de slide
  const changeSlide = useCallback(
    (slideIndex: number) => {
      if (!currentSlideshow || !currentSlideshow.slides) return;

      if (slideIndex >= 0 && slideIndex < currentSlideshow.slides.length) {
        // Réinitialiser les formes sélectionnées lors d'un changement de slide (sauf si on édite un texte)
        if (!editingTextId) {
          clearSelection();
        }
        setCurrentSlide(slideIndex);
      }
    },
    [currentSlideshow, setCurrentSlide, clearSelection, editingTextId]
  );

  return {
    // État
    currentSlide,
    isLoading,
    error,
    containerRef,
    selectedShapes,
    editingTextId,

    // État du canvas
    stageScale,
    stagePosition,

    // Dimensions depuis AppSettings
    width,
    height,

    // Données Konva
    getCurrentSlideKonvaData,
    currentKonvaData,

    // Actions de navigation
    changeSlide,

    // Actions d'état (setters simples)
    setLoading,
    setError,
    setSelectedShapes,
    setEditingTextId,
    setStageScale,
    setStagePosition,

    // Actions métier (logique implémentée dans le hook)
    clearSelection,
    resetCanvasTransform,
    updateSelectedShape,
    resetEditor,
  };
}

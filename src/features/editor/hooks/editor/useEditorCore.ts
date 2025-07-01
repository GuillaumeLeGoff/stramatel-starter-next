import { useSlideshow } from "@/features/slideshow/hooks";
import { useCallback, useMemo, useRef } from "react";
import { useEditorStore, editorSelectors } from "../../store/editorStore";
import { KonvaStage, KonvaShape } from "../../types";
import { useAppSettings } from "@/shared/hooks/useAppSettings";
import { createDefaultKonvaStage, fixStageShapes } from "../../utils";

export function useEditorCore() {
  // ===== SÉLECTEURS OPTIMISÉS =====
  
  // Navigation
  const currentSlide = useEditorStore(editorSelectors.currentSlide);
  
  // Sélection
  const selectedShapes = useEditorStore(editorSelectors.selectedShapes);
  const hasSelection = useEditorStore(editorSelectors.hasSelection);
  const editingTextId = useEditorStore(editorSelectors.editingTextId);
  const isEditingText = useEditorStore(editorSelectors.isEditingText);
  
  // États UI
  const isLoading = useEditorStore(editorSelectors.isLoading);
  const error = useEditorStore(editorSelectors.error);
  
  // Canvas
  const stageScale = useEditorStore(editorSelectors.stageScale);
  const stagePosition = useEditorStore(editorSelectors.stagePosition);
  
  // *** IMPORTANT : Écouter le cache Konva pour forcer les re-renders ***
  const konvaDataCache = useEditorStore((state) => state.konvaDataCache);
  
  // Créer canvasTransform manuellement pour éviter l'instabilité référentielle
  const canvasTransform = useMemo(() => ({
    scale: stageScale,
    position: stagePosition,
  }), [stageScale, stagePosition]);
  
  // ===== ACTIONS DU STORE =====
  
  const {
    setCurrentSlide,
    changeSlide,
    setSelectedShapes,
    addSelectedShape,
    removeSelectedShape,
    clearSelection,
    setEditingTextId,
    setEditingTextShape,
    setLoading,
    setError,
    setStageScale,
    setStagePosition,
    resetCanvasTransform,
    cacheKonvaData,
    getCachedKonvaData,
    clearKonvaCache,
    resetEditor,
    updateSelectedShape,
  } = useEditorStore();

  // ===== HOOKS EXTERNES =====
  
  const { currentSlideshow, updateCurrentSlideshow } = useSlideshow();
  const { width, height } = useAppSettings();
  const containerRef = useRef<HTMLDivElement>(null);

  // ===== FONCTIONS MÉTIER OPTIMISÉES =====

  // Récupérer les données Konva du slide courant avec cache
  const getCurrentSlideKonvaData = useCallback((): KonvaStage | null => {
    if (
      !currentSlideshow ||
      !currentSlideshow.slides ||
      currentSlideshow.slides.length === 0
    ) {
      return null;
    }

    // Essayer de récupérer depuis le cache d'abord
    const cachedData = getCachedKonvaData(currentSlide);
    if (cachedData) {
      return cachedData;
    }

    const slide = currentSlideshow.slides[currentSlide];
    if (!slide) return null;
    
    let konvaData: KonvaStage;
    
    if (slide.konvaData) {
      konvaData = {
        ...(slide.konvaData as unknown as KonvaStage),
        attrs: {
          ...(slide.konvaData as unknown as KonvaStage).attrs,
        },
      };
    } else {
      // Si pas de konvaData, créer des données par défaut
      konvaData = createDefaultKonvaStage();
    }

    // Mettre en cache
    cacheKonvaData(currentSlide, konvaData);
    
    return konvaData;
  }, [currentSlideshow, currentSlide, getCachedKonvaData, cacheKonvaData]);

  // *** CORRECTION CRITIQUE : Obtenir le konvaData actuel avec le cache comme dépendance ***
  const currentKonvaData = useMemo(() => {
    // Force le recalcul quand le cache change
    return getCurrentSlideKonvaData();
  }, [getCurrentSlideKonvaData, konvaDataCache, currentSlide]);

  // ===== ACTIONS MÉTIER OPTIMISÉES =====

  // Changer de slide avec gestion du cache
  const handleChangeSlide = useCallback(
    (slideIndex: number) => {
      if (!currentSlideshow || !currentSlideshow.slides) return;

      if (slideIndex >= 0 && slideIndex < currentSlideshow.slides.length) {
        // Invalider le cache si nécessaire
        clearKonvaCache();
        changeSlide(slideIndex);
      }
    },
    [currentSlideshow, changeSlide, clearKonvaCache]
  );

  // Mettre à jour une forme sélectionnée avec persistance
  const handleUpdateSelectedShape = useCallback(
    async (attrs: Record<string, unknown>) => {
      if (!hasSelection || !currentSlideshow || !updateCurrentSlideshow) {
        return;
      }

      try {
        // Mettre à jour l'état local d'abord pour la réactivité
        updateSelectedShape(attrs);

        // Ensuite, persister dans le slideshow
        updateCurrentSlideshow((prev) => {
          const updatedSlides = [...(prev.slides || [])];
          if (updatedSlides[currentSlide]?.konvaData) {
            const konvaData = updatedSlides[currentSlide].konvaData as KonvaStage;
            
                         // Mettre à jour les formes dans les données Konva
             // TODO: Implémenter la mise à jour des formes dans le konvaData
             updatedSlides[currentSlide].konvaData = konvaData;
            
            // Invalider le cache
            clearKonvaCache();
          }
          
          return {
            ...prev,
            slides: updatedSlides,
          };
        });
      } catch (error) {
        console.error("Erreur lors de la mise à jour de la forme:", error);
        setError("Erreur lors de la mise à jour de la forme");
      }
    },
    [hasSelection, currentSlideshow, currentSlide, selectedShapes, updateSelectedShape, updateCurrentSlideshow, clearKonvaCache, setError]
  );

  // Réinitialiser l'éditeur avec nettoyage du cache
  const handleResetEditor = useCallback(() => {
    clearKonvaCache();
    resetEditor();
  }, [clearKonvaCache, resetEditor]);

  // ===== VALEURS DÉRIVÉES MÉMORISÉES =====

  // Vérifier si l'éditeur peut être utilisé
  const isEditorReady = useMemo(() => {
    return !isLoading && !error && currentSlideshow && currentKonvaData;
  }, [isLoading, error, currentSlideshow, currentKonvaData]);

  // Statistiques de sélection
  const selectionStats = useMemo(() => ({
    count: selectedShapes.length,
    hasSelection,
    isEditingText,
    types: selectedShapes.reduce((acc, shape) => {
      const type = shape.className || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  }), [selectedShapes, hasSelection, isEditingText]);

  return {
    // État
    currentSlide,
    selectedShapes,
    editingTextId,
    isLoading,
    error,
    containerRef,
    
    // État du canvas
    stageScale,
    stagePosition,
    canvasTransform,
    
    // Données Konva
    getCurrentSlideKonvaData,
    currentKonvaData,
    
    // Actions de navigation
    changeSlide: handleChangeSlide,
    
    // Actions de sélection
    setSelectedShapes,
    addSelectedShape,
    removeSelectedShape,
    clearSelection,
    
    // Actions d'édition de texte
    setEditingTextId,
    setEditingTextShape,
    
    // Actions d'état (setters simples)
    setLoading,
    setError,
    setStageScale,
    setStagePosition,
    
    // Actions métier optimisées
    resetCanvasTransform,
    updateSelectedShape: handleUpdateSelectedShape,
    resetEditor: handleResetEditor,
    
    // Valeurs dérivées
    isEditorReady,
    selectionStats,
    hasSelection,
    isEditingText,
  };
} 
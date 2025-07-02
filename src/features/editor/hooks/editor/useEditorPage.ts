import { useEffect, useCallback, useMemo, useRef } from "react";
import { useEditorCore } from "./useEditorCore";
import { useSlideManager } from "../slide/useSlideManager";
import { useEditorZoom } from "./useEditorZoom";
import { useSlideshow } from "@/features/slideshow/hooks";
import { useAppSettingsStore } from "@/shared/store/appSettingsStore";
import { useEditorStore } from "../../store/editorStore";

export function useEditorPage() {
  const { currentSlideshow } = useSlideshow();
  const { currentSlide, currentKonvaData, changeSlide } = useEditorCore();
  const { settings, fetchSettings } = useAppSettingsStore();
  
  // Ref pour gérer le timeout de debounce
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Charger les settings au montage si pas déjà chargées
  useEffect(() => {
    if (!settings) {
      fetchSettings();
    }
  }, [settings, fetchSettings]);
  
  // Récupérer les dimensions depuis appSettings avec des valeurs par défaut
  const dimensions = useMemo(() => ({
    width: settings?.width || 1920,
    height: settings?.height || 1080,
  }), [settings?.width, settings?.height]);

  const konvaData = currentKonvaData;
  
  const { scale, normalizedScale, zoomPercentage, zoomIn, zoomOut, fitToContainer, containerRef } = useEditorZoom({
    stageWidth: dimensions.width,
    stageHeight: dimensions.height,
  });

  const { addSlide, addShape, updateSlideDuration, cleanMediaFromAllSlides, saveCurrentSlideKonvaData } = useSlideManager({
    stageData: konvaData,
    containerRef,
    scale,
    stageWidth: dimensions.width,
    stageHeight: dimensions.height,
  });

  // Récupérer la slide actuelle
  const currentSlideData = useMemo(() => {
    return currentSlideshow?.slides?.[currentSlide];
  }, [currentSlideshow?.slides, currentSlide]);

  // Fonction optimisée pour gérer l'ajout d'une slide
  const handleAddSlide = useCallback(() => {
    if (!currentSlideshow) return;
    
    addSlide({
      slideshowId: currentSlideshow.id,
      position: currentSlideshow.slides?.length || 0,
      duration: 5,
      width: dimensions.width,
      height: dimensions.height,
    });
  }, [currentSlideshow, addSlide, dimensions.width, dimensions.height]);

  // Fonction pour changer de slide
  const handleChangeSlide = useCallback(
    (newSlideIndex: number) => {
      changeSlide(newSlideIndex);
    },
    [changeSlide]
  );

  // Fonction pour supprimer un média de toutes les slides
  const handleCleanMediaFromAllSlides = useCallback(
    async (mediaUrl: string) => {
      if (!currentSlideshow) return;
      await cleanMediaFromAllSlides(mediaUrl);
    },
    [currentSlideshow, cleanMediaFromAllSlides]
  );

  // Fonction debouncée pour changer la couleur de fond
  const handleBackgroundColorChange = useCallback(
    (color: string) => {
      if (!konvaData) return;
      
      // Créer les données Konva mises à jour
      const updatedKonvaData = {
        ...konvaData,
        attrs: {
          ...konvaData.attrs,
          backgroundColor: color
        }
      };
      
      // Mettre à jour immédiatement le cache pour l'affichage
      const cacheKonvaData = useEditorStore.getState().cacheKonvaData;
      const currentSlide = useEditorStore.getState().currentSlide;
      cacheKonvaData(currentSlide, updatedKonvaData);
      
      // Annuler le timeout précédent s'il existe
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      // Programmer la sauvegarde API avec un délai de 500ms
      debounceTimeoutRef.current = setTimeout(async () => {
        try {
          await saveCurrentSlideKonvaData(updatedKonvaData);
        } catch (error) {
          console.error('Erreur lors de la sauvegarde de la couleur de fond:', error);
        }
      }, 500);
    },
    [konvaData, saveCurrentSlideKonvaData]
  );

  // Nettoyage du timeout au démontage du composant
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Données
    currentSlideshow,
    currentSlide,
    currentSlideData,
    konvaData,
    dimensions,
    
    // Zoom et container
    scale,
    normalizedScale,
    zoomPercentage,
    containerRef,
    
    // Actions zoom
    zoomIn,
    zoomOut,
    fitToContainer,
    
    // Actions slides
    handleAddSlide,
    handleChangeSlide,
    
    // Actions shapes
    addShape,
    
    // Actions média
    handleCleanMediaFromAllSlides,
    
    // Actions durée
    updateSlideDuration,
    
    // Actions couleur de fond
    handleBackgroundColorChange,
  };
} 
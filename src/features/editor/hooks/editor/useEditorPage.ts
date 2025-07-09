import { useEffect, useCallback, useMemo, useRef } from "react";
import { useEditorCore } from "./useEditorCore";
import { useSlideManager } from "../slide/useSlideManager";
import { useEditorZoom } from "./useEditorZoom";
import { useSlideshow } from "@/features/slideshow/hooks";
import { useAppSettings } from "@/shared/hooks/useAppSettings";
import { useEditorStore } from "../../store/editorStore";

export function useEditorPage() {
  const { currentSlideshow } = useSlideshow();
  const { currentSlide, currentKonvaData, changeSlide } = useEditorCore();
  const { width, height } = useAppSettings(); // ✅ Utiliser useAppSettings au lieu de useAppSettingsStore
  
  // Ref pour gérer le timeout de debounce
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // ✅ Récupérer les dimensions avec useMemo optimisé
  const dimensions = useMemo(() => {
    // ✅ Créer l'objet directement dans useMemo avec des valeurs primitives
    return {
      width: width || 1920,
      height: height || 1080,
    };
  }, [width, height]); // ✅ Dépendances primitives stables

  const konvaData = currentKonvaData;
  
  const { scale, normalizedScale, zoomPercentage, zoomIn, zoomOut, fitToContainer, containerRef } = useEditorZoom({
    stageWidth: dimensions.width,
    stageHeight: dimensions.height,
  });

  const { addSlide, addShape, updateSlideDuration, cleanMediaFromAllSlides, saveCurrentSlideKonvaData } = useSlideManager({
    stageData: konvaData,
    containerRef,
    scale,
  });

  // Récupérer la slide actuelle
  const currentSlideData = useMemo(() => {
    return currentSlideshow?.slides?.[currentSlide];
  }, [currentSlideshow?.slides, currentSlide]);

  // ✅ Fonction optimisée avec useCallback et dépendances stables
  const handleAddSlide = useCallback(() => {
    if (!currentSlideshow) return;
    
    // ✅ Créer l'objet directement dans la fonction pour éviter les dépendances d'objet
    addSlide({
      slideshowId: currentSlideshow.id,
      position: currentSlideshow.slides?.length || 0,
      duration: 5,
      width: dimensions.width,
      height: dimensions.height,
    });
  }, [currentSlideshow, addSlide, dimensions]); // ✅ Ajouter currentSlideshow complet

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
    [currentSlideshow, cleanMediaFromAllSlides] // ✅ Ajouter currentSlideshow complet
  );

  // ✅ Fonction debouncée optimisée avec useCallback
  const handleBackgroundColorChange = useCallback(
    (color: string) => {
      if (!konvaData) return;
      
      // ✅ Créer les données Konva mises à jour directement dans la fonction
      const setPresentState = useEditorStore.getState().setPresentState;
      const currentCache = useEditorStore.getState().konvaDataCache;
      const currentSlide = useEditorStore.getState().currentSlide;
      
      const updatedKonvaData = {
        ...konvaData,
        attrs: {
          ...konvaData.attrs,
          backgroundColor: color
        }
      };
      
      const newCache = new Map(currentCache);
      newCache.set(currentSlide, updatedKonvaData);
      setPresentState({ konvaDataCache: newCache });
      
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
    [konvaData, saveCurrentSlideKonvaData] // ✅ Dépendances minimales et stables
  );

  // ✅ Nettoyage du timeout optimisé - useEffect ne dépend de rien
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []); // ✅ Tableau vide - cleanup seulement au démontage

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
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useEditorStore } from "../store";
import { useSlideshow } from "@/features/slideshow/hooks";
import { KonvaStage } from "../types";

export function useEditor() {
  const { currentSlide, setCurrentSlide, isLoading, error, setLoading, setError } = useEditorStore();
  const { currentSlideshow } = useSlideshow();
  const [scale, setScale] = useState(1);
  const [containerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Zoom minimum et maximum
  const ABSOLUTE_MIN_ZOOM = 0.3; // Fixé à 30%
  const MAX_ZOOM = 2;
  const ZOOM_STEP = 0.1;

  // Récupérer les données Konva du slide courant
  const getCurrentSlideKonvaData = useCallback((): KonvaStage | null => {
    if (!currentSlideshow || !currentSlideshow.slides || currentSlideshow.slides.length === 0) {
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
          children: [
            {
              attrs: {
                x: 100,
                y: 100,
                width: 300,
                height: 50,
                fontSize: 32,
                fontFamily: "Arial",
                fill: "#333333",
                align: "center",
                text: "Nouvelle présentation",
              },
              className: "Text",
            },
          ],
        },
      ],
    };
  }, [currentSlideshow, currentSlide]);

  // Obtenir le konvaData actuel (mémorisé)
  const currentKonvaData = useMemo(() => getCurrentSlideKonvaData(), [getCurrentSlideKonvaData]);

  // Calculer le zoom minimum en fonction des dimensions du conteneur et du canvas (mémorisé)
  const minZoom = useMemo(() => {
    if (!currentKonvaData || !containerSize.width || !containerSize.height) return ABSOLUTE_MIN_ZOOM;

    // Calculer le ratio pour que le canvas s'adapte à la largeur ou à la hauteur du conteneur
    const widthRatio = containerSize.width / currentKonvaData.attrs.width;
    const heightRatio = containerSize.height / currentKonvaData.attrs.height;
    
    // Utiliser le plus petit ratio pour que le canvas s'adapte entièrement,
    // mais ne jamais descendre en-dessous de la limite absolue (30%)
    return Math.max(Math.min(widthRatio, heightRatio), ABSOLUTE_MIN_ZOOM);
  }, [containerSize, currentKonvaData, ABSOLUTE_MIN_ZOOM]);

  // Changer de slide
  const changeSlide = useCallback((slideIndex: number) => {
    if (!currentSlideshow || !currentSlideshow.slides) return;
    
    if (slideIndex >= 0 && slideIndex < currentSlideshow.slides.length) {
      setCurrentSlide(slideIndex);
    }
  }, [currentSlideshow, setCurrentSlide]);



 

  // Ajuster le zoom si nécessaire lorsque le conteneur ou le slide change
  useEffect(() => {
    if (scale < minZoom) {
      setScale(minZoom);
    }
  }, [containerSize, currentSlide, minZoom, scale]);

  // Zoomer
  const zoomIn = useCallback(() => {
    setScale(prevScale => Math.min(prevScale + ZOOM_STEP, MAX_ZOOM));
  }, [MAX_ZOOM, ZOOM_STEP]);

  // Dézoomer
  const zoomOut = useCallback(() => {
    setScale(prevScale => Math.max(prevScale - ZOOM_STEP, minZoom));
  }, [minZoom, ZOOM_STEP]);

  // Réinitialiser le zoom au zoom minimum (fit)
  const resetZoom = useCallback(() => {
    setScale(minZoom);
  }, [minZoom]);

  // Adapter au conteneur (fit)
  const fitToContainer = useCallback(() => {
    setScale(minZoom);
  }, [minZoom]);

  // Définir un niveau de zoom spécifique
  const setZoom = useCallback((newScale: number) => {
    setScale(Math.min(Math.max(newScale, minZoom), MAX_ZOOM));
  }, [minZoom, MAX_ZOOM]);

  return {
    currentSlide,
    isLoading,
    error,
    scale,
    containerRef,
    changeSlide,
    setLoading,
    setError,
    getCurrentSlideKonvaData,
    totalSlides: currentSlideshow?.slides.length || 0,
    zoomIn,
    zoomOut,
    resetZoom,
    setZoom,
    fitToContainer,
    minZoom,
  };
} 
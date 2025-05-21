import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { KonvaStage } from "../types";

export function useZoom(currentKonvaData: KonvaStage | null) {
  const [scale, setScale] = useState(1);
  const [containerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Zoom minimum et maximum
  const ABSOLUTE_MIN_ZOOM = 0.3; // Fixé à 30%
  const MAX_ZOOM = 2;
  const ZOOM_STEP = 0.1;

  // Calculer le zoom minimum en fonction des dimensions du conteneur et du canvas
  const minZoom = useMemo(() => {
    if (!currentKonvaData || !containerSize.width || !containerSize.height)
      return ABSOLUTE_MIN_ZOOM;

    // Calculer le ratio pour que le canvas s'adapte à la largeur ou à la hauteur du conteneur
    const widthRatio = containerSize.width / currentKonvaData.attrs.width;
    const heightRatio = containerSize.height / currentKonvaData.attrs.height;

    // Utiliser le plus petit ratio pour que le canvas s'adapte entièrement,
    // mais ne jamais descendre en-dessous de la limite absolue (30%)
    return Math.max(Math.min(widthRatio, heightRatio), ABSOLUTE_MIN_ZOOM);
  }, [containerSize, currentKonvaData, ABSOLUTE_MIN_ZOOM]);

  // Ajuster le zoom si nécessaire lorsque le conteneur change
  useEffect(() => {
    if (scale < minZoom) {
      setScale(minZoom);
    }
  }, [containerSize, minZoom, scale]);

  // Zoomer
  const zoomIn = useCallback(() => {
    setScale((prevScale) => Math.min(prevScale + ZOOM_STEP, MAX_ZOOM));
  }, [MAX_ZOOM, ZOOM_STEP]);

  // Dézoomer
  const zoomOut = useCallback(() => {
    setScale((prevScale) => Math.max(prevScale - ZOOM_STEP, minZoom));
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
  const setZoom = useCallback(
    (newScale: number) => {
      setScale(Math.min(Math.max(newScale, minZoom), MAX_ZOOM));
    },
    [minZoom, MAX_ZOOM]
  );

  return {
    scale,
    containerRef,
    minZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToContainer,
    setZoom,
  };
} 
import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { useAppSettings } from "@/shared/hooks/useAppSettings";

export function useZoom() {
  const [scale, setScale] = useState(1);
  const { width, height } = useAppSettings();
  const containerRef = useRef<HTMLDivElement>(null);

  // Zoom maximum et step
  const MAX_ZOOM = 3;
  const ZOOM_STEP = 0.1;

  // Calculer le zoom de référence (fit to AppSettings) - celui qui correspond à 100%
  const fitScale = useMemo(() => {
    if (!width || !height || !containerRef.current) {
      return 1; // Fallback à 100%
    }

    // Obtenir les dimensions du conteneur disponible
    const containerRect = containerRef.current.getBoundingClientRect();
    const availableWidth = containerRect.width;
    const availableHeight = containerRect.height;

    if (availableWidth === 0 || availableHeight === 0) {
      return 1;
    }

    // Calculer le ratio pour que la zone AppSettings s'adapte dans l'espace disponible
    // On laisse une marge de 20px de chaque côté
    const margin = 40;
    const widthRatio = (availableWidth - margin) / width;
    const heightRatio = (availableHeight - margin) / height;

    // Prendre le plus petit ratio pour que toute la zone AppSettings soit visible
    return Math.min(widthRatio, heightRatio);
  }, [width, height, containerRef.current?.getBoundingClientRect().width, containerRef.current?.getBoundingClientRect().height]);

  // Calculer le zoom minimum dynamiquement
  const minZoom = useMemo(() => {
    // Le minimum est 10% du fit scale pour éviter des cas extrêmes
    return Math.max(fitScale * 0.1, 0.05);
  }, [fitScale]);

  // Calculer le scale normalisé (par rapport au fitScale = 100%)
  const normalizedScale = useMemo(() => {
    if (fitScale === 0) return 1;
    return scale / fitScale;
  }, [scale, fitScale]);

  // Recalculer le fitScale quand le conteneur change de taille
  useEffect(() => {
    const handleResize = () => {
      // Force un re-calcul du fitScale
      if (fitScale > 0) {
        setScale(fitScale);
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [fitScale]);

  // Initialiser le scale à 100% (fitScale) au démarrage ou quand les données changent
  useEffect(() => {
    if (fitScale > 0) {
      setScale(fitScale);
    }
  }, [fitScale]);

  // Zoomer
  const zoomIn = useCallback(() => {
    setScale((prevScale) => Math.min(prevScale + (fitScale * ZOOM_STEP), fitScale * MAX_ZOOM));
  }, [fitScale, MAX_ZOOM, ZOOM_STEP]);

  // Dézoomer
  const zoomOut = useCallback(() => {
    setScale((prevScale) => Math.max(prevScale - (fitScale * ZOOM_STEP), minZoom));
  }, [minZoom, fitScale, ZOOM_STEP]);

  // Réinitialiser le zoom à 100% (fit to AppSettings)
  const resetZoom = useCallback(() => {
    setScale(fitScale);
  }, [fitScale]);

  // Adapter au conteneur (fit to AppSettings) - 100%
  const fitToContainer = useCallback(() => {
    setScale(fitScale);
  }, [fitScale]);

  // Définir un niveau de zoom spécifique (en pourcentage du fitScale)
  const setZoom = useCallback(
    (newScale: number) => {
      setScale(Math.min(Math.max(newScale, minZoom), fitScale * MAX_ZOOM));
    },
    [minZoom, fitScale, MAX_ZOOM]
  );

  return {
    scale,
    normalizedScale,
    containerRef,
    minZoom,
    fitScale,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToContainer,
    setZoom,
  };
} 
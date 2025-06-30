import { useState, useCallback, useRef, useEffect } from "react";

interface UseEditorZoomProps {
  stageWidth?: number;
  stageHeight?: number;
}

export function useEditorZoom({ stageWidth = 1920, stageHeight = 1080 }: UseEditorZoomProps = {}) {
  const [zoomMultiplier, setZoomMultiplier] = useState(1); // Multiplicateur de zoom (1 = 100%)
  const [fitScale, setFitScale] = useState(0.5); // Scale calculé pour "fit to container"
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculer le scale réel pour Konva
  const scale = fitScale * zoomMultiplier;
  
  // Calculer l'échelle normalisée pour l'affichage
  const normalizedScale = Math.max(0.1, Math.min(scale, fitScale * 3));
  
  // Pourcentage de zoom pour l'affichage (simple : zoomMultiplier * 100)
  const zoomPercentage = Math.round(zoomMultiplier * 100);

  // Fonction pour zoomer
  const zoomIn = useCallback(() => {
    setZoomMultiplier((prev) => Math.min(prev * 1.2, 3));
  }, []);

  // Fonction pour dézoomer
  const zoomOut = useCallback(() => {
    setZoomMultiplier((prev) => Math.max(prev / 1.2, 0.1));
  }, []);

  // Réinitialiser le zoom à 100%
  const resetZoom = useCallback(() => {
    setZoomMultiplier(1);
  }, []);

  // Ajuster le zoom pour s'adapter au conteneur
  const fitToContainer = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    if (containerWidth === 0 || containerHeight === 0) return;

    // Calculer le ratio pour s'adapter au conteneur
    const scaleX = containerWidth / stageWidth;
    const scaleY = containerHeight / stageHeight;

    // Utiliser le plus petit ratio pour s'assurer que tout est visible
    const newFitScale = Math.min(scaleX, scaleY) * 0.8; // 80% pour une marge confortable

    // Définir le nouveau fitScale et remettre le multiplicateur à 1 (100%)
    setFitScale(newFitScale);
    setZoomMultiplier(1);
  }, [stageWidth, stageHeight]);

  // Gérer le zoom avec la molette de la souris
  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      
      const scaleBy = 1.1;
      const currentMultiplier = zoomMultiplier;
      const newMultiplier = e.deltaY > 0 ? currentMultiplier / scaleBy : currentMultiplier * scaleBy;
      
      setZoomMultiplier(Math.max(0.1, Math.min(newMultiplier, 3)));
    }
  }, [zoomMultiplier]);

  // Ajouter l'écouteur de molette
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  // Ajuster automatiquement le zoom au montage et aux changements de taille
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Ajuster le zoom initial
    const initialFit = () => {
      setTimeout(() => {
        fitToContainer();
      }, 100); // Petit délai pour s'assurer que le DOM est rendu
    };

    // Observer les changements de taille du conteneur
    const resizeObserver = new ResizeObserver(() => {
      fitToContainer();
    });

    resizeObserver.observe(container);
    initialFit();

    return () => {
      resizeObserver.disconnect();
    };
  }, [fitToContainer]);

  return {
    scale,
    normalizedScale,
    zoomPercentage,
    containerRef,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToContainer,
  };
} 
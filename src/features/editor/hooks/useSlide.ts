import { useState, useEffect, useCallback } from "react";
import { KonvaStage } from "../types";

interface UseSlideProps {
  stageData: KonvaStage | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function useSlide({ stageData, containerRef }: UseSlideProps) {
  const [previewScale, setPreviewScale] = useState(0.2);

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
    
    // Recalculer si la fenêtre est redimensionnée
    window.addEventListener('resize', calculateScale);
    return () => {
      window.removeEventListener('resize', calculateScale);
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
        y: 0
      },
      className: "Stage",
      // Ajuster les positions des enfants pour centrer la vue
      children: stageData.children.map(layer => ({
        ...layer,
        attrs: { ...layer.attrs },
        children: layer.children.map(child => {
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
            }
          };
        })
      }))
    } as KonvaStage;
  }, [stageData]);

  return {
    previewScale,
    viewportStageData: createViewportStageData(),
    calculateScale
  };
}

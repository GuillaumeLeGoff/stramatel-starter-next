import { useCallback, useRef, useEffect } from "react";
import { KonvaShape } from "../types";
import Konva from "konva";

interface UseKonvaTransformerProps {
  selectedShapes: KonvaShape[];
}

export function useKonvaTransformer({
  selectedShapes,
}: UseKonvaTransformerProps) {
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const shapeRefs = useRef<Record<string, Konva.Node>>({});

  // Mettre à jour le transformer
  const updateTransformer = useCallback(() => {
    if (!transformerRef.current) {
      return;
    }

    const selectedIds = selectedShapes.map((shape) => shape.attrs.id);
    const selectedNodes = selectedIds
      .map((id) => shapeRefs.current[id as string])
      .filter(Boolean);

    if (selectedNodes.length > 0) {
      transformerRef.current.nodes(selectedNodes);
      transformerRef.current.getLayer()?.batchDraw();
    } else {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedShapes]);

  // Fonction pour enregistrer une référence à un nœud
  const registerNodeRef = useCallback(
    (nodeId: string, node: Konva.Node | null) => {
      if (node) {
        shapeRefs.current[nodeId] = node;
        // Ne pas appeler updateTransformer ici pour éviter les conflits de timing
        // Il sera appelé par useEffect quand selectedShapes change
      } else {
        delete shapeRefs.current[nodeId];
      }
    },
    [] // Pas de dépendance à updateTransformer
  );

  // Mettre à jour le transformer lorsque la sélection change
  useEffect(() => {
    // Utiliser un petit délai pour s'assurer que toutes les références sont prêtes
    const timer = setTimeout(() => {
      updateTransformer();
    }, 5);

    return () => clearTimeout(timer);
  }, [selectedShapes, updateTransformer]);

  return {
    transformerRef,
    shapeRefs: shapeRefs.current,
    registerNodeRef,
    updateTransformer,
  };
}

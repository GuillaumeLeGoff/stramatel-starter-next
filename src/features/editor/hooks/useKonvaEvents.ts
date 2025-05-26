import { useCallback } from "react";
import { KonvaShape } from "../types";
import { slideStore } from "../store/slideStore";
import Konva from "konva";

interface UseKonvaEventsProps {
  selectedShapes: KonvaShape[];
  getAllShapes: () => KonvaShape[];
  saveChanges: (
    data:
      | { nodeId: string; attrs: Record<string, unknown> }
      | Record<string, Record<string, unknown>>
  ) => Promise<void>;
  updateTransformer: () => void;
  shapeRefs: Record<string, Konva.Node>;
  isPreview?: boolean;
}

export function useKonvaEvents({
  selectedShapes,
  getAllShapes,
  saveChanges,
  updateTransformer,
  shapeRefs,
  isPreview = false,
}: UseKonvaEventsProps) {
  const { setSelectedShapes } = slideStore();

  // Fonction pour gérer les événements de transformation de plusieurs formes
  const handleMultiTransformEnd = useCallback(
    (e: Konva.KonvaEventObject<Event>) => {
      if (selectedShapes.length <= 1) return;

      e.evt.preventDefault?.();
      e.cancelBubble = true;

      const updatedNodes: Record<string, Record<string, unknown>> = {};
      const selectedIds = selectedShapes.map((shape) => shape.attrs.id);

      selectedIds.forEach((id) => {
        const node = shapeRefs[id as string];
        const shape = selectedShapes.find((s) => s.attrs.id === id);
        if (!node || !shape) return;

        const newAttrs: Record<string, unknown> = {
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
        };

        newAttrs.scaleX = node.scaleX();
        newAttrs.scaleY = node.scaleY();

        if (typeof node.width === "function") {
          newAttrs.width = node.width();
        }
        if (typeof node.height === "function") {
          newAttrs.height = node.height();
        }

        updatedNodes[id as string] = newAttrs;
      });

      // Utiliser la fonction unifiée avec plusieurs nœuds
      saveChanges(updatedNodes);

      setTimeout(() => {
        updateTransformer();
      }, 1);
    },
    [selectedShapes, shapeRefs, saveChanges, updateTransformer]
  );

  // Fonction pour gérer les événements de transformation d'une forme
  const handleTransformEnd = useCallback(
    (e: Konva.KonvaEventObject<Event>, shapeId: string, className: string) => {
      e.evt.preventDefault?.();
      e.cancelBubble = true;

      if (selectedShapes.length > 1) {
        handleMultiTransformEnd(e);
        return;
      }

      const node = e.target;
      const newAttrs: Record<string, unknown> = {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
      };

      newAttrs.scaleX = node.scaleX();
      newAttrs.scaleY = node.scaleY();

      if (typeof node.width === "function") {
        newAttrs.width = node.width();
      }
      if (typeof node.height === "function") {
        newAttrs.height = node.height();
      }

      // Utiliser la fonction unifiée avec un seul nœud
      saveChanges({ nodeId: shapeId, attrs: newAttrs });
      console.log(`Transformation enregistrée pour ${className}:${shapeId}`);

      // Mettre à jour le transformer après la transformation
      setTimeout(() => {
        updateTransformer();
      }, 1);
    },
    [selectedShapes, handleMultiTransformEnd, saveChanges, updateTransformer]
  );

  // Fonction pour gérer le déplacement
  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<Event>, shapeId: string) => {
      e.evt.preventDefault?.();
      e.cancelBubble = true;

      const node = e.target;
      const nodeId = node.id();
      const selectedIds = selectedShapes.map((shape) => shape.attrs.id);

      if (selectedShapes.length > 1 && selectedIds.includes(nodeId)) {
        handleMultiTransformEnd(e);
        return;
      }

      if (!selectedIds.includes(nodeId)) {
        const shape = getAllShapes().find((s) => s.attrs.id === nodeId);
        if (shape) {
          setSelectedShapes([shape]);
        }
      }

      const newAttrs = {
        x: node.x(),
        y: node.y(),
      };

      // Mettre à jour le transformer immédiatement pour éviter qu'il disparaisse
      updateTransformer();

      // Utiliser la fonction unifiée avec un seul nœud
      saveChanges({ nodeId: shapeId, attrs: newAttrs });
    },
    [
      selectedShapes,
      handleMultiTransformEnd,
      getAllShapes,
      setSelectedShapes,
      saveChanges,
      updateTransformer,
    ]
  );

  // Fonction pour gérer le clic sur une forme
  const handleShapeClick = useCallback(
    (
      e: Konva.KonvaEventObject<MouseEvent>,
      shapeId: string,
      handleSelect: (id: string, isMulti: boolean) => void
    ) => {
      if (isPreview) return;

      e.cancelBubble = true;
      const isMultiSelect = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
      handleSelect(shapeId, isMultiSelect);
    },
    [isPreview]
  );

  return {
    handleTransformEnd,
    handleDragEnd,
    handleShapeClick,
    handleMultiTransformEnd,
  };
}

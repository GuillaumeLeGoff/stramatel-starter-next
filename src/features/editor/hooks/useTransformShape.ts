import { useCallback, useRef, useEffect } from "react";
import { KonvaShape } from "../types";
import { slideStore } from "../store/slideStore";
import Konva from "konva";

interface UseKonvaEditorProps {
  selectedShapes: KonvaShape[];
  getAllShapes: () => KonvaShape[];
  saveChanges: (
    data:
      | { nodeId: string; attrs: Record<string, unknown> }
      | Record<string, Record<string, unknown>>
  ) => Promise<void>;
  isPreview?: boolean;
}

export function useKonvaEditor({
  selectedShapes,
  getAllShapes,
  saveChanges,
  isPreview = false,
}: UseKonvaEditorProps) {
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const shapeRefs = useRef<Record<string, Konva.Node>>({});
  const { setSelectedShapes, editingTextId } = slideStore();

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

  // Fonction pour gérer les événements de transformation de plusieurs formes
  const handleMultiTransformEnd = useCallback(
    (e: Konva.KonvaEventObject<Event>) => {
      if (selectedShapes.length <= 1) return;

      e.evt.preventDefault?.();
      e.cancelBubble = true;

      const updatedNodes: Record<string, Record<string, unknown>> = {};
      const selectedIds = selectedShapes.map((shape) => shape.attrs.id);

      selectedIds.forEach((id) => {
        const node = shapeRefs.current[id as string];
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
    [selectedShapes, saveChanges, updateTransformer]
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

      if (!selectedIds.includes(nodeId) && !editingTextId) {
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
      editingTextId,
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

  // Mettre à jour le transformer lorsque la sélection change
  useEffect(() => {
    // Utiliser un petit délai pour s'assurer que toutes les références sont prêtes
    const timer = setTimeout(() => {
      updateTransformer();
    }, 5);

    return () => clearTimeout(timer);
  }, [selectedShapes, updateTransformer]);

  return {
    // Transformer et références
    transformerRef,
    shapeRefs: shapeRefs.current,
    registerNodeRef,
    updateTransformer,
    // Gestionnaires d'événements
    handleTransformEnd,
    handleDragEnd,
    handleShapeClick,
    handleMultiTransformEnd,
  };
} 
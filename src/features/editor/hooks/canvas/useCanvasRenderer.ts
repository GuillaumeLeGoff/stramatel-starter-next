import React, { useCallback, useRef, useState } from "react";
import { KonvaStage, KonvaShape } from "../../types";
import { useCanvasSave } from "./useCanvasSave";
import { useShapeTextEditor } from "../shape/useShapeTextEditor";
import { useSlideManager } from "../slide/useSlideManager";
import { slideStore } from "../../store/slideStore";
import Konva from "konva";

interface SelectionRect {
  visible: boolean;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface UseCanvasRendererProps {
  stageData: KonvaStage;
  isPreview?: boolean;
}

export function useCanvasRenderer({
  stageData,
  isPreview = false,
}: UseCanvasRendererProps) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionRect, setSelectionRect] = useState<SelectionRect>({
    visible: false,
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
  });

  const transformerRef = useRef<Konva.Transformer>(null);
  const shapeRefs = useRef<Record<string, Konva.Node>>({});
  const { selectedShapes, setSelectedShapes } = slideStore();

  // Fonction pour collecter toutes les formes dans le stage
  const getAllShapes = useCallback(() => {
    if (!stageData) return [];

    const shapes: KonvaShape[] = [];

    const collectShapes = (nodes: KonvaShape[]) => {
      for (const node of nodes) {
        if (node.className !== "Layer" && node.className !== "Stage") {
          shapes.push(node);
        }

        if (node.children && node.children.length > 0) {
          collectShapes(node.children);
        }
      }
    };

    if (stageData.children) {
      collectShapes(stageData.children);
    }

    return shapes;
  }, [stageData]);

  // Hook pour la sauvegarde
  const { saveCurrentSlideKonvaData } = useSlideManager({
    stageData,
    containerRef: { current: null },
  });

  const saveHook = useCanvasSave({
    stageData,
    saveCurrentSlideKonvaData: isPreview
      ? async () => {}
      : saveCurrentSlideKonvaData,
  });

  // Hook pour l'édition de texte
  const textEditor = useShapeTextEditor({
    shapeRefs: shapeRefs.current,
    getAllShapes,
    saveChanges: saveHook.saveChanges,
  });

  // Enregistrer les références des nœuds
  const registerNodeRef = useCallback((id: string, node: Konva.Node | null) => {
    if (node) {
      shapeRefs.current[id] = node;
    } else {
      delete shapeRefs.current[id];
    }
  }, []);

  // Gestion de la sélection
  const handleSelect = useCallback(
    (shapeIds: string[]) => {
      if (isPreview) return;

      const shapes = getAllShapes().filter((shape) =>
        shapeIds.includes(shape.attrs.id as string)
      );
      setSelectedShapes(shapes);
    },
    [isPreview, getAllShapes, setSelectedShapes]
  );

  // Gestion du clic sur le stage
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (isPreview) return;

      // Si on clique sur le stage lui-même (pas sur une forme)
      if (e.target === e.target.getStage()) {
        setSelectedShapes([]);
      }
    },
    [isPreview, setSelectedShapes]
  );

  // Gestion du mouse down pour la sélection par rectangle
  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (isPreview) return;

      // Si on clique sur le stage et pas sur une forme
      if (e.target === e.target.getStage()) {
        const pos = e.target.getPointerPosition();
        if (pos) {
          setIsSelecting(true);
          setSelectionRect({
            visible: true,
            x1: pos.x,
            y1: pos.y,
            x2: pos.x,
            y2: pos.y,
          });
        }
      }
    },
    [isPreview]
  );

  // Gestion du mouse move pour la sélection par rectangle
  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (isPreview || !isSelecting) return;

      const pos = e.target.getStage()?.getPointerPosition();
      if (pos) {
        setSelectionRect((prev) => ({
          ...prev,
          x2: pos.x,
          y2: pos.y,
        }));
      }
    },
    [isPreview, isSelecting]
  );

  // Gestion du mouse up pour finaliser la sélection
  const handleMouseUp = useCallback(() => {
    if (isPreview || !isSelecting) return;

    setIsSelecting(false);
    setSelectionRect((prev) => ({ ...prev, visible: false }));

    // Ici on pourrait ajouter la logique pour sélectionner les formes dans le rectangle
  }, [isPreview, isSelecting]);

  // Gestion du clic sur une forme
  const handleShapeClick = useCallback(
    (
      e: Konva.KonvaEventObject<MouseEvent>,
      shapeId: string,
      handleSelect: (shapeIds: string[]) => void
    ) => {
      if (isPreview) return;

      e.cancelBubble = true;

      if (e.evt.ctrlKey || e.evt.metaKey) {
        // Ajout à la sélection existante
        const currentIds = selectedShapes.map((s) => s.attrs.id as string);
        if (currentIds.includes(shapeId)) {
          handleSelect(currentIds.filter((id) => id !== shapeId));
        } else {
          handleSelect([...currentIds, shapeId]);
        }
      } else {
        // Sélection simple
        handleSelect([shapeId]);
      }
    },
    [isPreview, selectedShapes]
  );

  // Gestion de la fin de transformation
  const handleTransformEnd = useCallback(
    async (
      e: Konva.KonvaEventObject<Event>,
      shapeId: string,
      className: string
    ) => {
      if (isPreview) return;

      const node = e.target;
      const baseAttrs = {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
        scaleX: node.scaleX(),
        scaleY: node.scaleY(),
      };

      let newAttrs: Record<string, unknown> = { ...baseAttrs };

      // Ajouter les dimensions spécifiques selon le type
      if (className === "Text" || className === "Rect" || className === "Image") {
        newAttrs.width = (node as any).width();
        newAttrs.height = (node as any).height();
      } else if (className === "Circle") {
        newAttrs.radius = (node as any).radius();
      }

      await saveHook.saveChanges({
        nodeId: shapeId,
        attrs: newAttrs,
      });
    },
    [isPreview, saveHook.saveChanges]
  );

  // Gestion de la fin de drag
  const handleDragEnd = useCallback(
    async (e: Konva.KonvaEventObject<Event>, shapeId: string) => {
      if (isPreview) return;

      const node = e.target;
      await saveHook.saveChanges({
        nodeId: shapeId,
        attrs: {
          x: node.x(),
          y: node.y(),
        },
      });
    },
    [isPreview, saveHook.saveChanges]
  );

  // Mettre à jour le transformer quand la sélection change
  const updateTransformer = useCallback(() => {
    if (!transformerRef.current || isPreview) return;

    const selectedNodes = selectedShapes
      .map((shape) => shapeRefs.current[shape.attrs.id as string])
      .filter(Boolean);

    transformerRef.current.nodes(selectedNodes);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedShapes, isPreview]);

  // Mettre à jour le transformer à chaque changement de sélection
  React.useEffect(() => {
    updateTransformer();
  }, [updateTransformer]);

  return {
    // Données
    getAllShapes,

    // Sélection
    selectedShapes,
    selectionRect,
    handleSelect,
    handleStageClick,

    // Événements de souris pour la sélection
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,

    // Transformer et références
    transformerRef,
    registerNodeRef,
    updateTransformer,
    shapeRefs: shapeRefs.current,

    // Événements des formes
    handleTransformEnd,
    handleDragEnd,
    handleShapeClick,

    // Sauvegarde
    saveChanges: saveHook.saveChanges,

    // Édition de texte
    textEditor,
  };
} 
import { useCallback, useState, useRef, useEffect } from "react";
import { KonvaShape } from "../types";
import { slideStore } from "../store/slideStore";
import Konva from "konva";

interface SelectionRect {
  visible: boolean;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface UseKonvaSelectionProps {
  getAllShapes: () => KonvaShape[];
  isPreview?: boolean;
}

export function useKonvaSelection({
  getAllShapes,
  isPreview = false,
}: UseKonvaSelectionProps) {
  const { selectedShapes, setSelectedShapes, editingTextId } = slideStore();
  const [selectionRect, setSelectionRect] = useState<SelectionRect>({
    visible: false,
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
  });
  const [selectMode, setSelectMode] = useState(false);
  const [selectionModeStrict, setSelectionModeStrict] = useState(true);
  const startPos = useRef({ x: 0, y: 0 });
  const stageRef = useRef<Konva.Stage | null>(null);

  // Raccourci clavier pour changer le mode de sélection
  useEffect(() => {
    if (isPreview) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "m") {
        e.preventDefault();
        setSelectionModeStrict((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPreview]);

  // Fonction pour vérifier si un nœud est complètement à l'intérieur d'un rectangle
  const isNodeInsideRect = useCallback(
    (
      node: Konva.Node,
      rect: { x: number; y: number; width: number; height: number }
    ) => {
      const nodeRect = node.getClientRect();
      return (
        nodeRect.x >= rect.x &&
        nodeRect.y >= rect.y &&
        nodeRect.x + nodeRect.width <= rect.x + rect.width &&
        nodeRect.y + nodeRect.height <= rect.y + rect.height
      );
    },
    []
  );

  // Gérer la sélection d'une forme
  const handleSelect = useCallback(
    (shapeId: string | null, isMultiSelect: boolean = false) => {
      if (!shapeId) {
        setSelectedShapes([]);
      } else if (isMultiSelect) {
        const isAlreadySelected = selectedShapes.some(
          (shape) => shape.attrs.id === shapeId
        );

        if (isAlreadySelected) {
          setSelectedShapes(
            selectedShapes.filter((shape) => shape.attrs.id !== shapeId)
          );
        } else {
          const shapeToAdd = getAllShapes().find(
            (shape) => shape.attrs.id === shapeId
          );
          if (shapeToAdd) {
            setSelectedShapes([...selectedShapes, shapeToAdd]);
          }
        }
      } else {
        const selectedNode = getAllShapes().find(
          (shape) => shape.attrs.id === shapeId
        );
        if (selectedNode) {
          setSelectedShapes([selectedNode]);
        }
      }
    },
    [selectedShapes, getAllShapes, setSelectedShapes]
  );

  // Gérer le début de la sélection par zone
  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.target !== e.target.getStage()) return;

      e.evt.preventDefault();
      const stage = e.target.getStage();
      if (!stage) return;

      stageRef.current = stage;
      const pos = stage.getPointerPosition();
      if (!pos) return;

      startPos.current = { x: pos.x, y: pos.y };
      setSelectMode(true);

      setSelectionRect({
        visible: true,
        x1: pos.x,
        y1: pos.y,
        x2: pos.x,
        y2: pos.y,
      });

      // Ne pas désélectionner si on est en train d'éditer un texte
      if (!e.evt.shiftKey && !editingTextId) {
        setSelectedShapes([]);
      }
    },
    [setSelectedShapes, editingTextId]
  );

  // Mettre à jour le rectangle de sélection
  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!selectMode) return;

      e.evt.preventDefault();
      const stage = e.target.getStage();
      if (!stage) return;

      const pos = stage.getPointerPosition();
      if (!pos) return;

      setSelectionRect((prev) => ({
        ...prev,
        x2: pos.x,
        y2: pos.y,
      }));
    },
    [selectMode]
  );

  // Finaliser la sélection par zone
  const handleMouseUp = useCallback(
    (
      e: Konva.KonvaEventObject<MouseEvent>,
      shapeRefs: Record<string, Konva.Node>
    ) => {
      if (!selectMode) return;

      e.evt.preventDefault();
      e.cancelBubble = true;
      setSelectMode(false);

      const box = {
        x: Math.min(selectionRect.x1, selectionRect.x2),
        y: Math.min(selectionRect.y1, selectionRect.y2),
        width: Math.abs(selectionRect.x2 - selectionRect.x1),
        height: Math.abs(selectionRect.y2 - selectionRect.y1),
      };

      if (box.width < 5 || box.height < 5) {
        setSelectionRect((prev) => ({ ...prev, visible: false }));
        return;
      }

      const shapes = getAllShapes();
      const shapesInSelection = shapes.filter((shape) => {
        if (!shape.attrs || !shape.attrs.id) return false;

        const node = shapeRefs[shape.attrs.id as string];
        if (!node) return false;

        if (selectionModeStrict) {
          return isNodeInsideRect(node, box);
        } else {
          const nodeRect = node.getClientRect();
          return Konva.Util.haveIntersection(box, nodeRect);
        }
      });

      if (e.evt.shiftKey) {
        const currentSelectedIds = selectedShapes.map(
          (shape) => shape.attrs.id
        );
        const newShapes = shapesInSelection.filter(
          (shape) => !currentSelectedIds.includes(shape.attrs.id)
        );
        setSelectedShapes([...selectedShapes, ...newShapes]);
      } else {
        setSelectedShapes(shapesInSelection);
      }

      setSelectionRect((prev) => ({ ...prev, visible: false }));
    },
    [
      selectMode,
      selectionRect,
      getAllShapes,
      isNodeInsideRect,
      selectionModeStrict,
      selectedShapes,
      setSelectedShapes,
    ]
  );

  // Gérer le clic sur le stage
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (selectMode) {
        e.cancelBubble = true;
        return;
      }

      const clickedOnEmpty = e.target === e.target.getStage();
      // Ne pas désélectionner si on est en train d'éditer un texte
      if (clickedOnEmpty && !e.evt.shiftKey && !editingTextId) {
        setSelectedShapes([]);
      }
    },
    [selectMode, setSelectedShapes, editingTextId]
  );

  return {
    selectedShapes,
    selectionRect,
    selectMode,
    selectionModeStrict,
    handleSelect,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleStageClick,
  };
}

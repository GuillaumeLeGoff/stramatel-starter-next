import { useCallback } from "react";
import { KonvaStage, KonvaShape } from "../types";
import { useKonvaSelection } from "./useKonvaSelection";
import { useKonvaTransformer } from "./useKonvaTransformer";
import { useKonvaSave } from "./useKonvaSave";
import { useKonvaEvents } from "./useKonvaEvents";
import { useTextEditor } from "./useTextEditor";
import { useSlide } from "./useSlide";
import Konva from "konva";

interface UseKonvaStageRendererProps {
  stageData: KonvaStage;
  isPreview?: boolean;
}

export function useKonvaStageRenderer({
  stageData,
  isPreview = false,
}: UseKonvaStageRendererProps) {
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

  // Hooks spécialisés
  const selection = useKonvaSelection({ getAllShapes, isPreview });
  const transformer = useKonvaTransformer({
    selectedShapes: selection.selectedShapes,
  });

  // Récupérer la fonction de sauvegarde depuis useSlide (seulement si pas en preview)
  const { saveCurrentSlideKonvaData } = useSlide({
    stageData,
    containerRef: { current: null }, // Pas besoin du containerRef pour la sauvegarde
  });

  const save = useKonvaSave({
    stageData,
    saveCurrentSlideKonvaData: isPreview
      ? async () => {}
      : saveCurrentSlideKonvaData,
  });

  const textEditor = useTextEditor({
    shapeRefs: transformer.shapeRefs,
    getAllShapes,
    saveChanges: save.saveChanges,
  });

  const events = useKonvaEvents({
    selectedShapes: selection.selectedShapes,
    getAllShapes,
    saveChanges: save.saveChanges,
    updateTransformer: transformer.updateTransformer,
    shapeRefs: transformer.shapeRefs,
    isPreview,
  });

  // Fonction pour gérer le mouseUp avec les références des formes
  const handleMouseUp = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      selection.handleMouseUp(e, transformer.shapeRefs);
    },
    [selection, transformer.shapeRefs]
  );

  return {
    // Données
    getAllShapes,

    // Sélection
    selectedShapes: selection.selectedShapes,
    selectionRect: selection.selectionRect,
    selectMode: selection.selectMode,
    selectionModeStrict: selection.selectionModeStrict,
    handleSelect: selection.handleSelect,
    handleStageClick: selection.handleStageClick,

    // Événements de souris pour la sélection
    handleMouseDown: selection.handleMouseDown,
    handleMouseMove: selection.handleMouseMove,
    handleMouseUp,

    // Transformer
    transformerRef: transformer.transformerRef,
    registerNodeRef: transformer.registerNodeRef,

    // Événements des formes
    handleTransformEnd: events.handleTransformEnd,
    handleDragEnd: events.handleDragEnd,
    handleShapeClick: events.handleShapeClick,

    // Sauvegarde
    saveChanges: save.saveChanges,

    // Édition de texte
    textEditor,
  };
}

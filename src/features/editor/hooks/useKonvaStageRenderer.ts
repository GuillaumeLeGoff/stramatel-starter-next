import { useCallback } from "react";
import { KonvaStage, KonvaShape } from "../types";
import { useKonvaSelection } from "./useKonvaSelection";
import { useKonvaEditor } from "./useTransformShape";
import { useKonvaSave } from "./useKonvaSave";
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

  // Hook unifié pour la gestion Konva
  const editor = useKonvaEditor({
    selectedShapes: selection.selectedShapes,
    getAllShapes,
    saveChanges: save.saveChanges,
    isPreview,
  });

  // Hook pour l'édition de texte
  const textEditor = useTextEditor({
    shapeRefs: editor.shapeRefs,
    getAllShapes,
    saveChanges: save.saveChanges,
  });

  // Fonction pour gérer le mouseUp avec les références des formes
  const handleMouseUp = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      selection.handleMouseUp(e, editor.shapeRefs);
    },
    [selection, editor.shapeRefs]
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

    // Transformer et références
    transformerRef: editor.transformerRef,
    registerNodeRef: editor.registerNodeRef,
    shapeRefs: editor.shapeRefs,
    updateTransformer: editor.updateTransformer,

    // Événements des formes
    handleTransformEnd: editor.handleTransformEnd,
    handleDragEnd: editor.handleDragEnd,
    handleShapeClick: editor.handleShapeClick,

    // Sauvegarde
    saveChanges: save.saveChanges,

    // Édition de texte
    textEditor,
  };
}

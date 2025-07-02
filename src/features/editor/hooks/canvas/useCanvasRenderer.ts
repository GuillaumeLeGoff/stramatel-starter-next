import React, { useCallback, useRef, useState } from "react";
import { KonvaStage, KonvaShape } from "../../types";
import { useCanvasSave } from "./useCanvasSave";
import { useShapeTextEditor } from "../shape/useShapeTextEditor";
import { useSlideManager } from "../slide/useSlideManager";
import { useEditorStore, editorSelectors } from "../../store/editorStore";
import { useCtrlKeyState } from "../editor/useCtrlKeyState";
import { createTransformHandler } from "../../utils/transformUtils";
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
  
  // État de la touche Ctrl pour maintenir le ratio
  const isCtrlPressed = useCtrlKeyState();
  
  // Utilisation du nouveau store unifié
  const selectedShapes = useEditorStore(editorSelectors.selectedShapes);
  const setSelectedShapes = useEditorStore((state) => state.setSelectedShapes);

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

      if (e.evt.ctrlKey || e.evt.metaKey || e.evt.shiftKey) {
        // Ajout à la sélection existante avec Ctrl, Cmd ou Shift
        const currentIds = selectedShapes.map((s: KonvaShape) => s.attrs.id as string);
        if (currentIds.includes(shapeId)) {
          handleSelect(currentIds.filter((id: string) => id !== shapeId));
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

  // Créer le handler de transformation avec support du ratio
  const createTransformHandlerWithRatio = useCallback(() => {
    return createTransformHandler(isCtrlPressed);
  }, [isCtrlPressed]);

  // Gestion de la fin de transformation
  const handleTransformEnd = useCallback(
    async (
      e: Konva.KonvaEventObject<Event>,
      shapeId: string,
      className: string
    ) => {
      if (isPreview) return;

      const node = e.target;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      
      console.log(`🔧 TransformEnd - ${className} (${shapeId}):`, {
        scaleX,
        scaleY,
        currentWidth: (node as any).width?.() || 'N/A',
        currentHeight: (node as any).height?.() || 'N/A'
      });
      
      const baseAttrs = {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
      };

      let newAttrs: Record<string, unknown> = { ...baseAttrs };

      // Calculer les nouvelles dimensions en appliquant les facteurs d'échelle
      if (className === "Text" || className === "Rect" || className === "Image" || 
          className === "liveDate" || className === "liveTime" || className === "liveDateTime" ||
          className === "currentDaysWithoutAccident" || className === "currentDaysWithoutAccidentWithStop" || 
          className === "currentDaysWithoutAccidentWithoutStop" || className === "recordDaysWithoutAccident" ||
          className === "yearlyAccidentsCount" || className === "yearlyAccidentsWithStopCount" || 
          className === "yearlyAccidentsWithoutStopCount" || className === "monthlyAccidentsCount" ||
          className === "lastAccidentDate" || className === "monitoringStartDate" ||
          className === "Video") {
        const currentWidth = (node as any).width();
        const currentHeight = (node as any).height();
        
        // Appliquer les facteurs d'échelle aux dimensions
        newAttrs.width = currentWidth * scaleX;
        newAttrs.height = currentHeight * scaleY;
        
        console.log(`📐 Nouvelles dimensions calculées:`, {
          oldWidth: currentWidth,
          oldHeight: currentHeight,
          newWidth: newAttrs.width,
          newHeight: newAttrs.height
        });
        
        // Réinitialiser les scales après avoir appliqué les dimensions
        newAttrs.scaleX = 1;
        newAttrs.scaleY = 1;
        
        // Appliquer immédiatement les nouvelles propriétés au nœud pour éviter la désynchronisation
        node.scaleX(1);
        node.scaleY(1);
        (node as any).width(newAttrs.width);
        (node as any).height(newAttrs.height);
      } else if (className === "Circle") {
        const currentRadius = (node as any).radius();
        // Pour un cercle, utiliser la moyenne des scales ou le plus grand scale
        const avgScale = Math.max(scaleX, scaleY);
        newAttrs.radius = currentRadius * avgScale;
        
        // Réinitialiser les scales
        newAttrs.scaleX = 1;
        newAttrs.scaleY = 1;
        
        // Appliquer immédiatement
        node.scaleX(1);
        node.scaleY(1);
        (node as any).radius(newAttrs.radius);
      } else {
        // Pour les autres shapes (Line, Arrow), garder les scales
        newAttrs.scaleX = scaleX;
        newAttrs.scaleY = scaleY;
      }

      console.log(`💾 Sauvegarde des attributs:`, newAttrs);

      await saveHook.saveChanges({
        nodeId: shapeId,
        attrs: newAttrs,
      });
    },
    [isPreview, saveHook.saveChanges]
  );

  // Gestion du début de drag (sélectionner la shape)
  const handleDragStart = useCallback(
    (e: Konva.KonvaEventObject<Event>, shapeId: string) => {
      if (isPreview) return;

      // Sélectionner automatiquement la shape au début du drag
      const shape = getAllShapes().find(s => s.attrs.id === shapeId);
      if (shape) {
        const isAlreadySelected = selectedShapes.some(s => s.attrs.id === shapeId);
        if (!isAlreadySelected) {
          const mouseEvent = e.evt as MouseEvent;
          // Si Shift/Ctrl/Cmd est enfoncé et qu'on a déjà des shapes sélectionnées, ajouter à la sélection
          if ((mouseEvent.shiftKey || mouseEvent.ctrlKey || mouseEvent.metaKey) && selectedShapes.length > 0) {
            const currentIds = selectedShapes.map((s: KonvaShape) => s.attrs.id as string);
            handleSelect([...currentIds, shapeId]);
          } else {
            // Sinon, sélection simple
            handleSelect([shapeId]);
          }
        }
      }
    },
    [isPreview, getAllShapes, selectedShapes, handleSelect]
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
      .map((shape: KonvaShape) => shapeRefs.current[shape.attrs.id as string])
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
    handleDragStart,
    handleDragEnd,
    handleShapeClick,

    // Transformation avec ratio
    createTransformHandlerWithRatio,
    isCtrlPressed,

    // Sauvegarde
    saveChanges: saveHook.saveChanges,

    // Édition de texte
    textEditor,
  };
} 
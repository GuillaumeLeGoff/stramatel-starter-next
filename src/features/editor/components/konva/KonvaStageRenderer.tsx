import React, { useCallback, useState, useRef, useEffect } from "react";
import {
  Stage,
  Layer,
  Text,
  Circle,
  Rect,
  Line,
  Arrow,
  Group,
  Transformer,
} from "react-konva";
import { KonvaStage, KonvaShape } from "../../types";
import { useEditor } from "../../hooks/useEditor";
import Konva from "konva";
import { updateSlide } from "../../api/slideApi";
import { useSlideshow } from "@/features/slideshow/hooks";
import { slideStore } from "../../store/slideStore";

interface KonvaStageRendererProps {
  stageData: KonvaStage;
  isPreview?: boolean;
}

// Extension des types existants pour inclure id
interface ExtendedKonvaShape extends KonvaShape {
  attrs: {
    id?: string;
    points?: number[];
    [key: string]: unknown;
  };
}

export function KonvaStageRenderer({
  stageData,
  isPreview = false,
}: KonvaStageRendererProps) {
  const { saveCurrentSlideKonvaData } = useEditor();
  const { currentSlideshow } = useSlideshow();
  const { currentSlide, selectedShapes, setSelectedShapes } = slideStore();
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const shapeRefs = useRef<Record<string, Konva.Node>>({});
  const [selectionRect, setSelectionRect] = useState({
    visible: false,
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
  });
  const stageRef = useRef<Konva.Stage | null>(null);
  const selectionRectRef = useRef<Konva.Rect | null>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const [selectMode, setSelectMode] = useState(false);
  const [selectionModeStrict, setSelectionModeStrict] = useState(true);

  // Raccourci clavier pour changer le mode de sélection
  useEffect(() => {
    // Ne pas ajouter d'écouteurs d'événements en mode prévisualisation
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

  // Cette fonction va collecter toutes les formes dans le stage
  const getAllShapes = useCallback(() => {
    if (!stageData) return [];

    const shapes: ExtendedKonvaShape[] = [];

    const collectShapes = (nodes: ExtendedKonvaShape[]) => {
      for (const node of nodes) {
        if (node.className !== "Layer" && node.className !== "Stage") {
          shapes.push(node);
        }

        if (node.children && node.children.length > 0) {
          collectShapes(node.children as ExtendedKonvaShape[]);
        }
      }
    };

    if (stageData.children) {
      collectShapes(stageData.children as ExtendedKonvaShape[]);
    }

    return shapes;
  }, [stageData]);

  // Fonction pour vérifier si un nœud est complètement à l'intérieur d'un rectangle
  const isNodeInsideRect = useCallback(
    (
      node: Konva.Node,
      rect: { x: number; y: number; width: number; height: number }
    ) => {
      const nodeRect = node.getClientRect();

      // Vérifier si le nœud est complètement à l'intérieur du rectangle
      return (
        nodeRect.x >= rect.x &&
        nodeRect.y >= rect.y &&
        nodeRect.x + nodeRect.width <= rect.x + rect.width &&
        nodeRect.y + nodeRect.height <= rect.y + rect.height
      );
    },
    []
  );

  // Fonction pour enregistrer les modifications de plusieurs nœuds
  const saveMultipleChanges = useCallback(
    async (updatedNodes: Record<string, Record<string, unknown>>) => {
      if (!stageData) return;

      // Créer une copie profonde du stageData
      const updatedStageData = JSON.parse(
        JSON.stringify(stageData)
      ) as KonvaStage;

      // Fonction récursive pour trouver et mettre à jour les nœuds
      const updateNodesInTree = (nodes: ExtendedKonvaShape[]) => {
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];

          // Vérifier si ce nœud doit être mis à jour
          if (node.attrs && node.attrs.id && updatedNodes[node.attrs.id]) {
            // Mettre à jour les attributs
            nodes[i] = {
              ...node,
              attrs: {
                ...node.attrs,
                ...updatedNodes[node.attrs.id],
              },
            };
          }

          // Vérifier les enfants si ce nœud en a
          if (node.children && node.children.length > 0) {
            updateNodesInTree(node.children as ExtendedKonvaShape[]);
          }
        }
      };

      // Mettre à jour les nœuds dans l'arbre
      if (updatedStageData.children) {
        updateNodesInTree(updatedStageData.children as ExtendedKonvaShape[]);
      }

      // Enregistrer les modifications dans le state local
      saveCurrentSlideKonvaData(updatedStageData);
      console.log(
        `Changements sauvegardés pour ${Object.keys(updatedNodes).length} nœuds`
      );

      // Synchroniser avec l'API si possible
      try {
        if (
          currentSlideshow &&
          currentSlideshow.slides &&
          currentSlideshow.slides[currentSlide]
        ) {
          const slideId = currentSlideshow.slides[currentSlide].id;
          await updateSlide(slideId, { konvaData: updatedStageData });
          console.log(`Modifications synchronisées avec l'API`);
        }
      } catch (error) {
        console.error("Erreur lors de la synchronisation avec l'API:", error);
      }
    },
    [stageData, saveCurrentSlideKonvaData, currentSlideshow, currentSlide]
  );

  // Fonction pour enregistrer les modifications
  const saveChanges = useCallback(
    async (updatedNode: Record<string, unknown>, nodeId: string) => {
      if (!stageData) return;

      // Créer une copie profonde du stageData
      const updatedStageData = JSON.parse(
        JSON.stringify(stageData)
      ) as KonvaStage;

      // Fonction récursive pour trouver et mettre à jour le nœud
      const updateNodeInTree = (nodes: ExtendedKonvaShape[]): boolean => {
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];

          // Vérifier si c'est le nœud que nous cherchons
          if (node.attrs && node.attrs.id === nodeId) {
            // Mettre à jour les attributs
            nodes[i] = {
              ...node,
              attrs: {
                ...node.attrs,
                ...updatedNode,
              },
            };
            return true;
          }

          // Vérifier les enfants si ce nœud en a
          if (node.children && node.children.length > 0) {
            if (updateNodeInTree(node.children as ExtendedKonvaShape[])) {
              return true;
            }
          }
        }

        return false;
      };

      // Mettre à jour le nœud dans l'arbre
      if (updatedStageData.children) {
        updateNodeInTree(updatedStageData.children as ExtendedKonvaShape[]);
      }

      // Enregistrer les modifications dans le state local
      saveCurrentSlideKonvaData(updatedStageData);
      console.log(`Changements sauvegardés pour le nœud ${nodeId}`);

      // Synchroniser avec l'API si possible
      try {
        if (
          currentSlideshow &&
          currentSlideshow.slides &&
          currentSlideshow.slides[currentSlide]
        ) {
          const slideId = currentSlideshow.slides[currentSlide].id;
          await updateSlide(slideId, { konvaData: updatedStageData });
          console.log(`Nœud ${nodeId} synchronisé avec l'API`);
        }
      } catch (error) {
        console.error("Erreur lors de la synchronisation avec l'API:", error);
      }
    },
    [stageData, saveCurrentSlideKonvaData, currentSlideshow, currentSlide]
  );

  // Fonction pour enregistrer une référence à un nœud
  const registerNodeRef = useCallback(
    (nodeId: string, node: Konva.Node | null) => {
      if (node) {
        shapeRefs.current[nodeId] = node;
        updateTransformer();
      } else {
        // Si node est null, supprimer la référence
        delete shapeRefs.current[nodeId];
      }
    },
    []
  );

  // Mettre à jour le transformer lorsque les références ou la sélection changent
  const updateTransformer = useCallback(() => {
    if (!transformerRef.current) return;

    // Utiliser selectedShapes pour récupérer les IDs
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

  // Gérer la sélection d'une forme
  const handleSelect = useCallback(
    (shapeId: string | null, isMultiSelect: boolean = false) => {
      if (!shapeId) {
        setSelectedShapes([]);
      } else if (isMultiSelect) {
        // Si multi-sélection, ajouter ou retirer de la sélection
        const isAlreadySelected = selectedShapes.some(
          (shape) => shape.attrs.id === shapeId
        );

        if (isAlreadySelected) {
          // Retirer de la sélection
          setSelectedShapes(
            selectedShapes.filter((shape) => shape.attrs.id !== shapeId)
          );
        } else {
          // Ajouter à la sélection
          const shapeToAdd = getAllShapes().find(
            (shape) => shape.attrs.id === shapeId
          );
          if (shapeToAdd) {
            setSelectedShapes([...selectedShapes, shapeToAdd as KonvaShape]);
          }
        }
      } else {
        // Sélection simple
        console.log("sélectionner le nœud", shapeId);
        const selectedNode = getAllShapes().find(
          (shape) => shape.attrs.id === shapeId
        );
        if (selectedNode) {
          setSelectedShapes([selectedNode as KonvaShape]);
        }
      }
    },
    [selectedShapes, getAllShapes, setSelectedShapes]
  );

  // Mettre à jour le transformer lorsque la sélection change
  useEffect(() => {
    updateTransformer();
  }, [selectedShapes, updateTransformer]);

  // NOUVEAU SYSTÈME DE SÉLECTION PAR ZONE
  // Gérer le début de la sélection
  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Vérifier si le clic a été fait sur le stage et non sur une forme
      if (e.target !== e.target.getStage()) {
        return;
      }

      e.evt.preventDefault();

      // Récupérer la position de la souris
      const stage = e.target.getStage();
      if (!stage) return;

      stageRef.current = stage;
      const pos = stage.getPointerPosition();
      if (!pos) return;

      // Stocker la position de départ
      startPos.current = { x: pos.x, y: pos.y };

      // Activer le mode sélection
      setSelectMode(true);

      // Initialiser le rectangle de sélection
      setSelectionRect({
        visible: true,
        x1: pos.x,
        y1: pos.y,
        x2: pos.x,
        y2: pos.y,
      });

      // Effacer la sélection existante sauf si Shift est enfoncé
      if (!e.evt.shiftKey) {
        console.log("déselectionner tout");
        setSelectedShapes([]);
      }
    },
    [setSelectedShapes]
  );

  // Mettre à jour le rectangle de sélection pendant le déplacement
  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Ne rien faire si on n'est pas en mode sélection
      if (!selectMode) return;

      e.evt.preventDefault();

      // Mettre à jour la position finale du rectangle
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

  // Finaliser la sélection
  const handleMouseUp = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Ne rien faire si on n'est pas en mode sélection
      if (!selectMode) return;

      e.evt.preventDefault();
      e.cancelBubble = true;

      // Désactiver le mode sélection
      setSelectMode(false);

      // Calculer les dimensions finales du rectangle
      const box = {
        x: Math.min(selectionRect.x1, selectionRect.x2),
        y: Math.min(selectionRect.y1, selectionRect.y2),
        width: Math.abs(selectionRect.x2 - selectionRect.x1),
        height: Math.abs(selectionRect.y2 - selectionRect.y1),
      };

      // Si le rectangle est trop petit, l'ignorer (c'était un clic)
      if (box.width < 5 || box.height < 5) {
        setSelectionRect((prev) => ({
          ...prev,
          visible: false,
        }));
        return;
      }

      // Trouver toutes les formes qui intersectent le rectangle
      const shapes = getAllShapes();
      const shapesInSelection = shapes.filter((shape) => {
        if (!shape.attrs || !shape.attrs.id) return false;

        const node = shapeRefs.current[shape.attrs.id];
        if (!node) return false;

        // Sélectionner selon le mode (strict = complètement inclus, non strict = intersecte simplement)
        if (selectionModeStrict) {
          // Mode strict: la forme doit être complètement à l'intérieur du rectangle
          return isNodeInsideRect(node, box);
        } else {
          // Mode non strict: la forme peut simplement toucher le rectangle
          const nodeRect = node.getClientRect();
          return Konva.Util.haveIntersection(box, nodeRect);
        }
      });

      // Mettre à jour la sélection
      if (e.evt.shiftKey) {
        // Ajouter à la sélection existante si Shift est enfoncé
        const currentSelectedIds = selectedShapes.map(
          (shape) => shape.attrs.id
        );
        const newShapes = shapesInSelection.filter(
          (shape) => !currentSelectedIds.includes(shape.attrs.id)
        );

        setSelectedShapes([...selectedShapes, ...(newShapes as KonvaShape[])]);
      } else {
        // Remplacer la sélection existante
        setSelectedShapes(shapesInSelection as KonvaShape[]);
      }

      // Masquer le rectangle de sélection
      setSelectionRect((prev) => ({
        ...prev,
        visible: false,
      }));
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

  // Empêcher le clic sur le stage de désélectionner lorsqu'on vient de terminer une sélection
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Ne rien faire pendant le mode sélection
      if (selectMode) {
        e.cancelBubble = true;
        return;
      }

      // Vérifier si le clic est sur le stage lui-même
      const clickedOnEmpty = e.target === e.target.getStage();
      if (clickedOnEmpty && !e.evt.shiftKey) {
        setSelectedShapes([]);
      }
    },
    [selectMode, setSelectedShapes]
  );

  if (!stageData) return null;

  const renderShape = (shape: ExtendedKonvaShape) => {
    const { className, attrs, children } = shape;
    const shapeId = attrs.id || `shape_${Math.random()}`;

    // Fonction pour gérer les événements de transformation et déplacement de plusieurs formes
    const handleMultiTransformEnd = (e: Konva.KonvaEventObject<Event>) => {
      // Utiliser selectedShapes pour vérifier s'il y a plusieurs formes sélectionnées
      if (selectedShapes.length <= 1) return;

      e.evt.preventDefault?.();
      e.cancelBubble = true;

      // Créer un objet pour stocker toutes les mises à jour
      const updatedNodes: Record<string, Record<string, unknown>> = {};

      // Récupérer les IDs des formes sélectionnées
      const selectedIds = selectedShapes.map((shape) => shape.attrs.id);

      // Mettre à jour chaque nœud sélectionné
      selectedIds.forEach((id) => {
        const node = shapeRefs.current[id as string];
        if (!node) return;

        const newAttrs: Record<string, unknown> = {
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          scaleX: node.scaleX(),
          scaleY: node.scaleY(),
        };

        // Ajouter width et height si disponibles
        if (typeof node.width === "function") {
          newAttrs.width = node.width();
        }
        if (typeof node.height === "function") {
          newAttrs.height = node.height();
        }

        updatedNodes[id as string] = newAttrs;
      });

      // Sauvegarder toutes les modifications en une seule fois
      saveMultipleChanges(updatedNodes);

      // Garantir que la sélection est préservée
      // Utiliser setTimeout pour éviter que d'autres événements interfèrent
      setTimeout(() => {
        updateTransformer();
      }, 10);
    };

    // Fonction pour gérer les événements de transformation et déplacement d'une forme
    const handleTransformEnd = (e: Konva.KonvaEventObject<Event>) => {
      // Empêcher la propagation pour éviter la désélection
      e.evt.preventDefault?.();
      e.cancelBubble = true;

      // Si plusieurs formes sont sélectionnées, utiliser la fonction multi
      if (selectedShapes.length > 1) {
        handleMultiTransformEnd(e);
        return;
      }

      // Récupérer les nouvelles propriétés
      const node = e.target;
      const newAttrs: Record<string, unknown> = {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
        scaleX: node.scaleX(),
        scaleY: node.scaleY(),
      };

      // Ajouter width et height seulement si disponibles
      if (typeof node.width === "function") {
        newAttrs.width = node.width();
      }
      if (typeof node.height === "function") {
        newAttrs.height = node.height();
      }

      // Pour les lignes et flèches, mettre à jour les points si nécessaire
      if ((className === "Line" || className === "Arrow") && attrs.points) {
        // Logique spéciale pour les points, si nécessaire
        // ...
      }

      // Enregistrer les modifications
      saveChanges(newAttrs, shapeId);
      console.log(`Transformation enregistrée pour ${className}:${shapeId}`);
    };

    // Fonction pour gérer le déplacement
    const handleDragEnd = (e: Konva.KonvaEventObject<Event>) => {
      // Empêcher la propagation pour éviter la désélection
      e.evt.preventDefault?.();
      e.cancelBubble = true;

      // Récupérer l'ID du nœud déplacé
      const node = e.target;
      const nodeId = node.id();

      // Vérifier si plusieurs formes sont sélectionnées et si le nœud déplacé fait partie de la sélection
      const selectedIds = selectedShapes.map((shape) => shape.attrs.id);
      if (selectedShapes.length > 1 && selectedIds.includes(nodeId)) {
        handleMultiTransformEnd(e);
        return;
      }

      // Si l'élément déplacé n'était pas déjà sélectionné, le sélectionner uniquement
      if (!selectedIds.includes(nodeId)) {
        console.log("sélectionner le nœud", nodeId);

        // Trouver la forme dans la liste de toutes les formes
        const shape = getAllShapes().find((s) => s.attrs.id === nodeId);
        if (shape) {
          setSelectedShapes([shape as KonvaShape]);
        }
      }

      const newAttrs = {
        x: node.x(),
        y: node.y(),
      };

      // Enregistrer les modifications
      saveChanges(newAttrs, shapeId);
    };

    // Propriétés communes à tous les composants
    const commonProps = {
      ...attrs,
      id: shapeId,
      ref: (node: Konva.Node | null) => registerNodeRef(shapeId, node),
      onTransformEnd: isPreview ? undefined : handleTransformEnd,
      onDragEnd: isPreview ? undefined : handleDragEnd,
      onClick: isPreview
        ? undefined
        : (e: Konva.KonvaEventObject<MouseEvent>) => {
            e.cancelBubble = true; // Empêcher la propagation au stage

            // Vérifier si la touche Shift, Ctrl ou Meta est pressée pour la multi-sélection
            const isMultiSelect =
              e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
            handleSelect(shapeId, isMultiSelect);
          },
      draggable: isPreview ? false : attrs.draggable !== false,
    };

    let shapeElement;

    switch (className) {
      case "Text":
        shapeElement = <Text key={shapeId} {...commonProps} />;
        break;
      case "Circle":
        shapeElement = <Circle key={shapeId} {...commonProps} />;
        break;
      case "Rect":
        shapeElement = <Rect key={shapeId} {...commonProps} />;
        break;
      case "Line":
        shapeElement = <Line key={shapeId} {...commonProps} />;
        break;
      case "Arrow":
        if (!attrs.points) {
          console.warn("Arrow requiert des points", attrs);
          return null;
        }
        shapeElement = (
          <Arrow
            key={shapeId}
            {...commonProps}
            points={attrs.points as number[]}
          />
        );
        break;
      case "Group":
        shapeElement = (
          <Group key={shapeId} {...commonProps}>
            {children &&
              children.map((childShape: KonvaShape, index: number) => {
                // Assurer que chaque enfant a un ID unique
                const childAttrs = {
                  ...childShape.attrs,
                  id: `${shapeId}_child_${index}`,
                };
                return renderShape({
                  ...childShape,
                  attrs: childAttrs,
                } as ExtendedKonvaShape);
              })}
          </Group>
        );
        break;
      default:
        return null;
    }

    return shapeElement;
  };

  if (!stageData) return null;

  // Collecter toutes les formes de toutes les couches pour les rendre dans une seule couche
  const allShapes: React.ReactNode[] = [];

  // Parcourir toutes les couches et récupérer leurs formes
  stageData.children.forEach((layer: KonvaShape) => {
    if (layer.children) {
      layer.children.forEach((shape: KonvaShape) => {
        allShapes.push(renderShape(shape as ExtendedKonvaShape));
      });
    }
  });

  // Rendre un stage avec une seule couche contenant toutes les formes
  return (
    <Stage
      width={stageData.attrs.width}
      height={stageData.attrs.height}
      onClick={isPreview ? undefined : handleStageClick}
      onMouseDown={isPreview ? undefined : handleMouseDown}
      onMouseMove={isPreview ? undefined : handleMouseMove}
      onMouseUp={isPreview ? undefined : handleMouseUp}
    >
      <Layer>
        {allShapes}

        {/* Transformer pour la sélection - seulement affiché en mode édition */}
        {!isPreview && (
          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              // Limiter la taille minimale
              if (newBox.width < 5 || newBox.height < 5) {
                return oldBox;
              }
              return newBox;
            }}
            enabledAnchors={[
              "top-left",
              "top-right",
              "bottom-left",
              "bottom-right",
            ]}
            rotateEnabled={true}
            keepRatio={false}
          />
        )}

        {/* Rectangle de sélection - seulement affiché en mode édition */}
        {!isPreview && selectionRect.visible && (
          <Rect
            ref={(node) => {
              selectionRectRef.current = node;
              return undefined;
            }}
            fill="rgba(0, 0, 255, 0.2)"
            stroke="rgba(0, 0, 255, 0.8)"
            strokeWidth={1}
            x={Math.min(selectionRect.x1, selectionRect.x2)}
            y={Math.min(selectionRect.y1, selectionRect.y2)}
            width={Math.abs(selectionRect.x2 - selectionRect.x1)}
            height={Math.abs(selectionRect.y2 - selectionRect.y1)}
          />
        )}
      </Layer>
    </Stage>
  );
}

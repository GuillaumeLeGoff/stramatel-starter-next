import React, { useCallback, useState, useRef } from "react";
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
import { KonvaStage, KonvaShape } from "../types";
import { useEditor } from "../hooks/useEditor";
import Konva from "konva";

interface KonvaStageRendererProps {
  stageData: KonvaStage;
}

// Extension des types existants pour inclure id
interface ExtendedKonvaShape extends KonvaShape {
  attrs: {
    id?: string;
    points?: number[];
    [key: string]: unknown;
  };
}

export function KonvaStageRenderer({ stageData }: KonvaStageRendererProps) {
  const { saveCurrentSlideKonvaData } = useEditor();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const shapeRefs = useRef<Record<string, Konva.Node>>({});

  // Fonction pour enregistrer les modifications
  const saveChanges = useCallback(
    (updatedNode: Record<string, unknown>, nodeId: string) => {
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

      // Enregistrer les modifications
      saveCurrentSlideKonvaData(updatedStageData);
      console.log(`Changements sauvegardés pour le nœud ${nodeId}`);
    },
    [stageData, saveCurrentSlideKonvaData]
  );

  // Fonction pour enregistrer une référence à un nœud
  const registerNodeRef = useCallback(
    (nodeId: string, node: Konva.Node | null) => {
      if (node) {
        shapeRefs.current[nodeId] = node;

        // Si ce nœud est sélectionné, mettre à jour le transformer
        if (selectedId === nodeId && transformerRef.current) {
          transformerRef.current.nodes([node]);
          transformerRef.current.getLayer()?.batchDraw();
        }
      } else {
        // Si node est null, supprimer la référence
        delete shapeRefs.current[nodeId];
      }
    },
    [selectedId]
  );

  // Gérer la sélection d'une forme
  const handleSelect = useCallback((shapeId: string | null) => {
    setSelectedId(shapeId);

    // Si nous avons un transformer et un nœud sélectionné
    if (transformerRef.current && shapeId && shapeRefs.current[shapeId]) {
      transformerRef.current.nodes([shapeRefs.current[shapeId]]);
      transformerRef.current.getLayer()?.batchDraw();
    } else if (transformerRef.current) {
      // Si aucun nœud n'est sélectionné, vider le transformer
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, []);

  // Gérer le clic sur le stage pour désélectionner
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Vérifier si le clic est sur le stage lui-même et pas sur une forme
      const clickedOnEmpty = e.target === e.currentTarget;
      if (clickedOnEmpty) {
        setSelectedId(null);
        if (transformerRef.current) {
          transformerRef.current.nodes([]);
          transformerRef.current.getLayer()?.batchDraw();
        }
      }
    },
    []
  );

  if (!stageData) return null;

  const renderShape = (shape: ExtendedKonvaShape) => {
    const { className, attrs, children } = shape;
    const shapeId = attrs.id || `shape_${Math.random()}`;

    // Fonction pour gérer les événements de transformation et déplacement
    const handleTransformEnd = (e: Konva.KonvaEventObject<Event>) => {
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
      const node = e.target;
      const newAttrs = {
        x: node.x(),
        y: node.y(),
      };

      // Enregistrer les modifications
      saveChanges(newAttrs, shapeId);
      console.log(`Déplacement enregistré pour ${className}:${shapeId}`);
    };

    // Propriétés communes à tous les composants
    const commonProps = {
      ...attrs,
      id: shapeId,
      ref: (node: Konva.Node | null) => registerNodeRef(shapeId, node),
      onTransformEnd: handleTransformEnd,
      onDragEnd: handleDragEnd,
      onClick: (e: Konva.KonvaEventObject<MouseEvent>) => {
        e.cancelBubble = true; // Empêcher la propagation au stage
        handleSelect(shapeId);
      },
      draggable: attrs.draggable !== false,
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

  const renderLayer = (layerData: ExtendedKonvaShape) => {
    return (
      <Layer key={layerData.attrs?.id || `layer_${Math.random()}`}>
        {layerData.children &&
          layerData.children.map((shape: KonvaShape) =>
            renderShape(shape as ExtendedKonvaShape)
          )}

        {/* Ajouter un transformer unique par couche */}
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limiter la taille minimale
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      </Layer>
    );
  };

  return (
    <Stage
      width={stageData.attrs.width}
      height={stageData.attrs.height}
      onClick={handleStageClick}
    >
      {stageData.children.map((layer) =>
        renderLayer(layer as ExtendedKonvaShape)
      )}
    </Stage>
  );
}

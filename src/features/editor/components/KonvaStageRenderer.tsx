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
import { KonvaStage, KonvaShape } from "../types";
import { useEditor } from "../hooks/useEditor";
import Konva from "konva";
import { updateSlide } from "../api/slideApi";
import { useSlideshow } from "@/features/slideshow/hooks";
import { slideStore } from "../store/slideStore";

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
  const { currentSlideshow } = useSlideshow();
  const { currentSlide } = slideStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const shapeRefs = useRef<Record<string, Konva.Node>>({});
  const [selectionRect, setSelectionRect] = useState({
    visible: false,
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
  });
  const isSelecting = useRef(false);
  
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
      console.log(`Changements sauvegardés pour ${Object.keys(updatedNodes).length} nœuds`);
      
      // Synchroniser avec l'API si possible
      try {
        if (currentSlideshow && currentSlideshow.slides && currentSlideshow.slides[currentSlide]) {
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
        if (currentSlideshow && currentSlideshow.slides && currentSlideshow.slides[currentSlide]) {
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
    [selectedIds]
  );
  
  // Mettre à jour le transformer lorsque les références ou la sélection changent
  const updateTransformer = useCallback(() => {
    if (!transformerRef.current) return;
    
    const selectedNodes = selectedIds
      .map(id => shapeRefs.current[id])
      .filter(Boolean);
    
    if (selectedNodes.length > 0) {
      transformerRef.current.nodes(selectedNodes);
      transformerRef.current.getLayer()?.batchDraw();
    } else {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedIds]);

  // Gérer la sélection d'une forme
  const handleSelect = useCallback((shapeId: string | null, isMultiSelect: boolean = false) => {
    if (!shapeId) {
      setSelectedIds([]);
    } else if (isMultiSelect) {
      // Si multi-sélection, ajouter ou retirer de la sélection
      setSelectedIds(prev => {
        return prev.includes(shapeId)
          ? prev.filter(id => id !== shapeId)
          : [...prev, shapeId];
      });
    } else {
      // Sélection simple
      setSelectedIds([shapeId]);
    }
  }, []);

  // Mettre à jour le transformer lorsque la sélection change
  useEffect(() => {
    updateTransformer();
  }, [selectedIds, updateTransformer]);

  // Gérer le début du rectangle de sélection
  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // Ne rien faire si on clique sur une forme
    if (e.target !== e.target.getStage()) {
      return;
    }
    
    isSelecting.current = true;
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;
    
    setSelectionRect({
      visible: true,
      x1: pos.x,
      y1: pos.y,
      x2: pos.x,
      y2: pos.y
    });
    
    // Désélectionner tout si SHIFT n'est pas enfoncé
    if (!e.evt.shiftKey) {
      setSelectedIds([]);
    }
  }, []);

  // Gérer le déplacement pendant le dessin du rectangle de sélection
  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isSelecting.current) return;
    
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;
    
    setSelectionRect(prev => ({
      ...prev,
      x2: pos.x,
      y2: pos.y
    }));
  }, []);

  // Gérer la fin du rectangle de sélection
  const handleMouseUp = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isSelecting.current) return;
    
    isSelecting.current = false;
    
    // Cache la sélection après un court délai pour éviter les conflits avec les clics
    setTimeout(() => {
      setSelectionRect(prev => ({
        ...prev,
        visible: false
      }));
    });
    
    // Si le rectangle est trop petit, considérer comme un clic et non une sélection
    const width = Math.abs(selectionRect.x2 - selectionRect.x1);
    const height = Math.abs(selectionRect.y2 - selectionRect.y1);
    if (width < 5 || height < 5) return;
    
    // Créer le rectangle de sélection
    const selBox = {
      x: Math.min(selectionRect.x1, selectionRect.x2),
      y: Math.min(selectionRect.y1, selectionRect.y2),
      width,
      height
    };
    
    // Trouver toutes les formes dans l'arbre Konva
    const shapes: ExtendedKonvaShape[] = [];
    
    // Fonction récursive pour collecter toutes les formes
    const collectShapes = (nodes: ExtendedKonvaShape[]) => {
      for (const node of nodes) {
        if (node.className !== 'Layer' && node.className !== 'Stage') {
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
    
    // Vérifier quelles formes sont dans la zone de sélection
    const selected = shapes.filter(shape => {
      if (!shape.attrs || !shape.attrs.id) return false;
      
      const node = shapeRefs.current[shape.attrs.id];
      if (!node) return false;
      
      // Utiliser getClientRect pour tenir compte des transformations
      const nodeRect = node.getClientRect();
      
      return Konva.Util.haveIntersection(selBox, nodeRect);
    });
    
    // Mettre à jour la sélection
    const newSelectedIds = selected.map(s => s.attrs.id!).filter(Boolean);
    
    // Si SHIFT est enfoncé, ajouter à la sélection existante
    if (e.evt.shiftKey) {
      setSelectedIds(prev => {
        const combined = [...prev];
        newSelectedIds.forEach(id => {
          if (!combined.includes(id)) {
            combined.push(id);
          }
        });
        return combined;
      });
    } else {
      // Sinon, remplacer la sélection
      setSelectedIds(newSelectedIds);
    }
    
  }, [selectionRect, stageData]);

  // Gérer le clic sur le stage pour désélectionner
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Si on est en train de dessiner un rectangle de sélection, ne rien faire
      if (selectionRect.visible && 
          Math.abs(selectionRect.x2 - selectionRect.x1) > 5 && 
          Math.abs(selectionRect.y2 - selectionRect.y1) > 5) {
        return;
      }
      
      // Vérifier si le clic est sur le stage lui-même et pas sur une forme
      const clickedOnEmpty = e.target === e.currentTarget;
      if (clickedOnEmpty && !e.evt.shiftKey) {
        setSelectedIds([]);
      }
    },
    [selectionRect]
  );

  if (!stageData) return null;

  const renderShape = (shape: ExtendedKonvaShape) => {
    const { className, attrs, children } = shape;
    const shapeId = attrs.id || `shape_${Math.random()}`;

    // Fonction pour gérer les événements de transformation et déplacement de plusieurs formes
    const handleMultiTransformEnd = (e: Konva.KonvaEventObject<Event>) => {
      if (selectedIds.length <= 1) return;
      
      // Créer un objet pour stocker toutes les mises à jour
      const updatedNodes: Record<string, Record<string, unknown>> = {};
      
      // Mettre à jour chaque nœud sélectionné
      selectedIds.forEach(id => {
        const node = shapeRefs.current[id];
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
        
        updatedNodes[id] = newAttrs;
      });
      
      // Sauvegarder toutes les modifications en une seule fois
      saveMultipleChanges(updatedNodes);
      console.log(`Transformation multiple terminée pour ${selectedIds.length} formes`);
    };

    // Fonction pour gérer les événements de transformation et déplacement d'une forme
    const handleTransformEnd = (e: Konva.KonvaEventObject<Event>) => {
      // Si plusieurs formes sont sélectionnées, utiliser la fonction multi
      if (selectedIds.length > 1) {
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

      // Stocker l'ID pour garder la sélection
      const nodeId = node.id();

      // Enregistrer les modifications
      saveChanges(newAttrs, shapeId);
      console.log(`Transformation enregistrée pour ${className}:${shapeId}`);
      
      // S'assurer que le nœud reste sélectionné
      setTimeout(() => {
        if (nodeId && !selectedIds.includes(nodeId)) {
          setSelectedIds(prev => [...prev, nodeId]);
        }
      }, 0);
    };

    // Fonction pour gérer le déplacement
    const handleDragEnd = (e: Konva.KonvaEventObject<Event>) => {
      // Si plusieurs formes sont sélectionnées, utiliser la fonction multi
      if (selectedIds.length > 1) {
        handleMultiTransformEnd(e);
        return;
      }
      
      const node = e.target;
      const newAttrs = {
        x: node.x(),
        y: node.y(),
      };

      // Stocker l'ID pour garder la sélection
      const nodeId = node.id();

      // Enregistrer les modifications
      saveChanges(newAttrs, shapeId);
      console.log(`Déplacement enregistré pour ${className}:${shapeId}`);
      
      // S'assurer que le nœud reste sélectionné
      setTimeout(() => {
        if (nodeId && !selectedIds.includes(nodeId)) {
          setSelectedIds(prev => [...prev, nodeId]);
        }
      }, 0);
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
        
        // Vérifier si la touche Shift, Ctrl ou Meta est pressée pour la multi-sélection
        const isMultiSelect = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
        handleSelect(shapeId, isMultiSelect);
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
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          rotateEnabled={true}
          keepRatio={false}
        />
        
        {/* Rectangle de sélection */}
        {selectionRect.visible && (
          <Rect
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
    );
  };

  return (
    <Stage
      width={stageData.attrs.width}
      height={stageData.attrs.height}
      onClick={handleStageClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {stageData.children.map((layer) =>
        renderLayer(layer as ExtendedKonvaShape)
      )}
    </Stage>
  );
}

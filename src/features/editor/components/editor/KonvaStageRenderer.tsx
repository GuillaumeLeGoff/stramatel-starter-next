import React from "react";
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
import { useKonvaStageRenderer } from "../../hooks";
import { KonvaTextEditor } from "./KonvaTextEditor";
import { KonvaImage } from "./KonvaImage";
import { KonvaVideo } from "./KonvaVideo";
import { KonvaLiveText } from "./KonvaLiveText";
import { ArrowTransformer } from "./ArrowTransformer";
import Konva from "konva";
import { fixShapeProperties } from "../../utils";
import { useEditorStore } from "../../store/editorStore";

interface KonvaStageRendererProps {
  stageData: KonvaStage;
  isPreview?: boolean;
  scale?: number;
}

// Extension des types existants pour inclure id
type ExtendedKonvaShape = KonvaShape & {
  attrs: KonvaShape["attrs"] & {
    id?: string;
    points?: number[];
    [key: string]: unknown;
  };
};

export function KonvaStageRenderer({
  stageData,
  isPreview = false,
  scale = 1,
}: KonvaStageRendererProps) {
  const {
    handleSelect,
    handleStageClick,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    transformerRef,
    registerNodeRef,
    handleTransformEnd,
    handleTransformContinuous,
    handleDragStart,
    handleDragEnd,
    handleShapeClick,
    createTransformHandlerWithRatio,
    textEditor,
    selectedShapes,
    shapeRefs,
    saveChanges,
  } = useKonvaStageRenderer({ stageData, isPreview });

  // Combiner les gestionnaires de clic du stage
  const combinedStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // D'abord gérer l'édition de texte
    if (textEditor.isEditing) {
      textEditor.handleStageClickForTextEditor(e);
    }
    // Puis gérer la sélection normale
    if (!isPreview) {
      handleStageClick(e);
    }
  };

  if (!stageData) return null;

  const renderShape = (shape: ExtendedKonvaShape) => {
    // Corriger les propriétés manquantes de la forme
    const correctedShape = fixShapeProperties(shape as KonvaShape) as ExtendedKonvaShape;
    const { className, attrs, children } = correctedShape;
    const shapeId = attrs.id || `shape_${Math.random()}`;

    // Propriétés communes à tous les composants
    const commonProps = {
      ...attrs,
      id: shapeId,
      ref: (node: Konva.Node | null) => registerNodeRef(shapeId, node),
      onTransformEnd: isPreview
        ? undefined
        : (e: Konva.KonvaEventObject<Event>) =>
            handleTransformEnd(e, shapeId, className),
      onDragStart: isPreview
        ? undefined
        : (e: Konva.KonvaEventObject<Event>) => handleDragStart(e, shapeId),
      onDragEnd: isPreview
        ? undefined
        : (e: Konva.KonvaEventObject<Event>) => handleDragEnd(e, shapeId),
      onClick: isPreview
        ? undefined
        : (e: Konva.KonvaEventObject<MouseEvent>) =>
            handleShapeClick(e, shapeId, handleSelect),
      draggable: isPreview ? false : attrs.draggable !== false,
    };

    let shapeElement;

    switch (className) {
      case "Text":
        shapeElement = (
          <Text
            key={shapeId}
            {...commonProps}
            visible={textEditor.editingTextId !== shapeId}
            onDblClick={
              isPreview
                ? undefined
                : () => textEditor.handleTextDoubleClick(shapeId)
            }
            onTransform={
              isPreview
                ? undefined
                : (e: Konva.KonvaEventObject<Event>) => {
                    handleTransformContinuous(e, shapeId, className);
                  }
            }
          />
        );
        break;
      case "Circle":
        shapeElement = (
          <Circle 
            key={shapeId} 
            {...commonProps}
            onTransform={
              isPreview
                ? undefined
                : (e: Konva.KonvaEventObject<Event>) => {
                    handleTransformContinuous(e, shapeId, className);
                  }
            }
          />
        );
        break;
      case "Rect":
        shapeElement = (
          <Rect 
            key={shapeId} 
            {...commonProps}
            onTransform={
              isPreview
                ? undefined
                : (e: Konva.KonvaEventObject<Event>) => {
                    handleTransformContinuous(e, shapeId, className);
                  }
            }
          />
        );
        break;
      case "Line":
        shapeElement = (
          <Line 
            key={shapeId} 
            {...commonProps}
            onTransform={
              isPreview
                ? undefined
                : (e: Konva.KonvaEventObject<Event>) => {
                    handleTransformContinuous(e, shapeId, className);
                  }
            }
          />
        );
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
            stroke={attrs.stroke as string}
            strokeWidth={attrs.strokeWidth as number}
            pointerLength={attrs.pointerLength as number}
            pointerWidth={attrs.pointerWidth as number}
            fill={attrs.fill as string}
            onTransform={
              isPreview
                ? undefined
                : (e: Konva.KonvaEventObject<Event>) => {
                    handleTransformContinuous(e, shapeId, className);
                  }
            }
          />
        );
        break;
      case "Image":
        if (!attrs.src) {
          console.warn("Image requiert une propriété src", attrs);
          return null;
        }
        shapeElement = (
          <KonvaImage
            key={shapeId}
            ref={commonProps.ref}
            src={attrs.src as string}
            x={attrs.x as number}
            y={attrs.y as number}
            width={attrs.width as number}
            height={attrs.height as number}
            rotation={attrs.rotation as number}
            id={shapeId}
            draggable={commonProps.draggable}
            autoResize={attrs.autoResize as boolean}
            onDimensionsChange={async (newWidth: number, newHeight: number) => {
              // ✅ OPTIMISATION: Mettre à jour seulement le cache local pour l'autoResize
              // Pas besoin de sauvegarde backend immédiate pour l'ajustement automatique
              console.log(`📐 AutoResize Image - nouvelles dimensions:`, { newWidth, newHeight });
              
              // Mettre à jour le store local immédiatement
              const updateSelectedShape = useEditorStore.getState().updateSelectedShape;
              updateSelectedShape({ 
                width: newWidth, 
                height: newHeight, 
                autoResize: false // Désactiver après usage automatique
              });
              
              // ✅ Mettre à jour le cache Konva local sans sauvegarder en backend
              const currentKonvaData = useEditorStore.getState().getCachedKonvaData(useEditorStore.getState().currentSlide);
              if (currentKonvaData) {
                const updatedKonvaData = JSON.parse(JSON.stringify(currentKonvaData));
                
                // Trouver et mettre à jour la shape dans les données Konva
                const updateShapeInNodes = (nodes: any[]): any[] => {
                  return nodes.map(node => {
                    if (node.attrs?.id === shapeId) {
                      return {
                        ...node,
                        attrs: { 
                          ...node.attrs, 
                          width: newWidth, 
                          height: newHeight, 
                          autoResize: false 
                        }
                      };
                    }
                    if (node.children && Array.isArray(node.children)) {
                      return {
                        ...node,
                        children: updateShapeInNodes(node.children)
                      };
                    }
                    return node;
                  });
                };
                
                if (updatedKonvaData.children && Array.isArray(updatedKonvaData.children)) {
                  updatedKonvaData.children = updateShapeInNodes(updatedKonvaData.children);
                }
                
                // Mettre à jour le cache immédiatement (sans historique)
                const cacheKonvaData = useEditorStore.getState().cacheKonvaData;
                cacheKonvaData(useEditorStore.getState().currentSlide, updatedKonvaData);
              }
            }}
            onTransform={
              isPreview
                ? undefined
                : (e: Konva.KonvaEventObject<Event>) => {
                    handleTransformContinuous(e, shapeId, className);
                  }
            }
            onTransformEnd={commonProps.onTransformEnd}
            onDragStart={commonProps.onDragStart}
            onDragEnd={commonProps.onDragEnd}
            onClick={(e) => commonProps.onClick && commonProps.onClick(e)}
          />
        );
        break;
      case "Video":
        if (!attrs.src) {
          console.warn("Video requiert une propriété src", attrs);
          return null;
        }
        shapeElement = (
          <KonvaVideo
            key={shapeId}
            ref={commonProps.ref}
            src={attrs.src as string}
            x={attrs.x as number}
            y={attrs.y as number}
            width={attrs.width as number}
            height={attrs.height as number}
            rotation={attrs.rotation as number}
            id={shapeId}
            draggable={commonProps.draggable}
            autoResize={attrs.autoResize as boolean}
            onDimensionsChange={async (newWidth: number, newHeight: number) => {
              // ✅ OPTIMISATION: Mettre à jour seulement le cache local pour l'autoResize
              // Pas besoin de sauvegarde backend immédiate pour l'ajustement automatique
              console.log(`📐 AutoResize Video - nouvelles dimensions:`, { newWidth, newHeight });
              
              // Mettre à jour le store local immédiatement
              const updateSelectedShape = useEditorStore.getState().updateSelectedShape;
              updateSelectedShape({ 
                width: newWidth, 
                height: newHeight, 
                autoResize: false // Désactiver après usage automatique
              });
              
              // ✅ Mettre à jour le cache Konva local sans sauvegarder en backend
              const currentKonvaData = useEditorStore.getState().getCachedKonvaData(useEditorStore.getState().currentSlide);
              if (currentKonvaData) {
                const updatedKonvaData = JSON.parse(JSON.stringify(currentKonvaData));
                
                // Trouver et mettre à jour la shape dans les données Konva
                const updateShapeInNodes = (nodes: any[]): any[] => {
                  return nodes.map(node => {
                    if (node.attrs?.id === shapeId) {
                      return {
                        ...node,
                        attrs: { 
                          ...node.attrs, 
                          width: newWidth, 
                          height: newHeight, 
                          autoResize: false 
                        }
                      };
                    }
                    if (node.children && Array.isArray(node.children)) {
                      return {
                        ...node,
                        children: updateShapeInNodes(node.children)
                      };
                    }
                    return node;
                  });
                };
                
                if (updatedKonvaData.children && Array.isArray(updatedKonvaData.children)) {
                  updatedKonvaData.children = updateShapeInNodes(updatedKonvaData.children);
                }
                
                // Mettre à jour le cache immédiatement (sans historique)
                const cacheKonvaData = useEditorStore.getState().cacheKonvaData;
                cacheKonvaData(useEditorStore.getState().currentSlide, updatedKonvaData);
              }
            }}
            onTransform={
              isPreview
                ? undefined
                : (e: Konva.KonvaEventObject<Event>) => {
                    handleTransformContinuous(e, shapeId, className);
                  }
            }
            onTransformEnd={commonProps.onTransformEnd}
            onDragStart={commonProps.onDragStart}
            onDragEnd={commonProps.onDragEnd}
            onClick={commonProps.onClick}
          />
        );
        break;
      case "Group":
        shapeElement = (
          <Group key={shapeId} {...commonProps}>
            {children &&
              children.map((childShape: KonvaShape, index: number) => {
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
      case "liveDate":
      case "liveTime":
      case "liveDateTime":
        const liveType = className === "liveDate" ? "date" : 
                        className === "liveTime" ? "time" : "datetime";
        shapeElement = (
          <KonvaLiveText
            key={shapeId}
            ref={commonProps.ref}
            x={attrs.x as number}
            y={attrs.y as number}
            width={attrs.width as number}
            height={attrs.height as number}
            rotation={attrs.rotation as number}
            id={shapeId}
            type={liveType}
            fontSize={attrs.fontSize as number}
            fontFamily={attrs.fontFamily as string}
            fontStyle={attrs.fontStyle as string}
            fill={attrs.fill as string}
            align={attrs.align as string}
            draggable={commonProps.draggable}
            onTransform={
              isPreview
                ? undefined
                : (e: Konva.KonvaEventObject<Event>) => {
                    handleTransformContinuous(e, shapeId, className);
                  }
            }
            onTransformEnd={commonProps.onTransformEnd}
            onDragStart={commonProps.onDragStart}
            onDragEnd={commonProps.onDragEnd}
            onClick={commonProps.onClick}
          />
        );
        break;
      
      // Données de sécurité - Compteurs de jours
      case "currentDaysWithoutAccident":
      case "currentDaysWithoutAccidentWithStop":
      case "currentDaysWithoutAccidentWithoutStop":
      case "recordDaysWithoutAccident":
      case "yearlyAccidentsCount":
      case "yearlyAccidentsWithStopCount":
      case "yearlyAccidentsWithoutStopCount":
      case "monthlyAccidentsCount":
      case "lastAccidentDate":
      case "monitoringStartDate":
        shapeElement = (
          <KonvaLiveText
            key={shapeId}
            ref={commonProps.ref}
            x={attrs.x as number}
            y={attrs.y as number}
            width={attrs.width as number}
            height={attrs.height as number}
            rotation={attrs.rotation as number}
            id={shapeId}
            type={className as any}
            fontSize={attrs.fontSize as number}
            fontFamily={attrs.fontFamily as string}
            fontStyle={attrs.fontStyle as string}
            fill={attrs.fill as string}
            align={attrs.align as string}
            draggable={commonProps.draggable}
            onTransform={
              isPreview
                ? undefined
                : (e: Konva.KonvaEventObject<Event>) => {
                    handleTransformContinuous(e, shapeId, className);
                  }
            }
            onTransformEnd={commonProps.onTransformEnd}
            onDragStart={commonProps.onDragStart}
            onDragEnd={commonProps.onDragEnd}
            onClick={commonProps.onClick}
          />
        );
        break;
      default:
        return null;
    }

    return shapeElement;
  };

  // Collecter toutes les formes de toutes les couches
  const allShapes: React.ReactNode[] = [];

  stageData.children.forEach((layer: KonvaShape) => {
    if (layer.children) {
      layer.children.forEach((shape: KonvaShape) => {
        allShapes.push(renderShape(shape as ExtendedKonvaShape));
      });
    }
  });

  return (
    <Stage
      width={stageData.attrs.width}
      height={stageData.attrs.height}
      onClick={isPreview ? undefined : combinedStageClick}
      onMouseDown={isPreview ? undefined : handleMouseDown}
      onMouseMove={isPreview ? undefined : handleMouseMove}
      onMouseUp={isPreview ? undefined : handleMouseUp}
    >
      <Layer>
        {/* Rectangle de fond pour la couleur */}
        {stageData.attrs.backgroundColor && (
          <Rect
            x={0}
            y={0}
            width={stageData.attrs.width}
            height={stageData.attrs.height}
            fill={stageData.attrs.backgroundColor}
            listening={false}
          />
        )}
        
        {allShapes}

        {/* Transformer pour la sélection */}
        {!isPreview && (() => {
          // Déterminer si on a sélectionné uniquement une flèche
          const isArrowOnly = selectedShapes.length === 1 && 
                             selectedShapes[0]?.className === 'Arrow';
          
          if (isArrowOnly) {
            // Utiliser le transformer personnalisé pour les flèches
            const arrowShape = selectedShapes[0];
            const arrowNode = shapeRefs[arrowShape.attrs.id as string] as Konva.Arrow;
            

            
            return (
              <ArrowTransformer
                target={arrowNode}
                scale={scale}
                onPointsChange={async (newPoints) => {
                  // Sauvegarder les nouveaux points
                  await saveChanges({
                    nodeId: arrowShape.attrs.id as string,
                    attrs: { points: newPoints },
                  }, { skipHistory: true });
                }}
              />
            );
          } else {
            // Utiliser le transformer standard pour les autres formes
            return (
              <Transformer
                ref={transformerRef}
                anchorSize={10 / scale}
                boundBoxFunc={(oldBox, newBox) => {
                  if (newBox.width < 5 || newBox.height < 5) {
                    return oldBox;
                  }
                  return newBox;
                }}
                enabledAnchors={[
                  "top-left",
                  "top-center",
                  "top-right",
                  "middle-left",
                  "middle-right",
                  "bottom-left",
                  "bottom-center",
                  "bottom-right",
                ]}
                rotateEnabled={true}
                keepRatio={false}
              />
            );
          }
        })()}

        {/* Rectangle de sélection */}
        {/*  {!isPreview && selectionRect.visible && (
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
 */}
        {/* Éditeur de texte */}
        {!isPreview &&
          textEditor.isEditing &&
          textEditor.getEditingTextNode() && (
            <KonvaTextEditor
              textNode={textEditor.getEditingTextNode()! as Konva.Text}
              onClose={textEditor.stopTextEditing}
              onTextChange={(newText) => {
                textEditor.updateTextContentDuringEdit(newText);
              }}
              onFinalize={async (newText) => {
                await textEditor.finalizeTextEdit(newText);
              }}
            />
          )}
      </Layer>
    </Stage>
  );
}

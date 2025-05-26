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
import Konva from "konva";

interface KonvaStageRendererProps {
  stageData: KonvaStage;
  isPreview?: boolean;
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
}: KonvaStageRendererProps) {
  const {
    selectionRect,
    handleSelect,
    handleStageClick,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    transformerRef,
    registerNodeRef,
    handleTransformEnd,
    handleDragEnd,
    handleShapeClick,
  } = useKonvaStageRenderer({ stageData, isPreview });

  if (!stageData) return null;

  const renderShape = (shape: ExtendedKonvaShape) => {
    const { className, attrs, children } = shape;
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
      onClick={isPreview ? undefined : handleStageClick}
      onMouseDown={isPreview ? undefined : handleMouseDown}
      onMouseMove={isPreview ? undefined : handleMouseMove}
      onMouseUp={isPreview ? undefined : handleMouseUp}
    >
      <Layer>
        {allShapes}

        {/* Transformer pour la sélection */}
        {!isPreview && (
          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
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

        {/* Rectangle de sélection */}
        {!isPreview && selectionRect.visible && (
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
    </Stage>
  );
}

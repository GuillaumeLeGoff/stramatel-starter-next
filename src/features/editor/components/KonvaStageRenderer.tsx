import React from "react";
import { Stage, Layer, Text, Circle, Rect, Line } from "react-konva";
import { KonvaStage, KonvaShape } from "../types";

interface KonvaStageRendererProps {
  stageData: KonvaStage;
}

export function KonvaStageRenderer({ stageData }: KonvaStageRendererProps) {
  if (!stageData) return null;

  const renderShape = (shape: KonvaShape) => {
    const { className, attrs } = shape;

    switch (className) {
      case "Text":
        return <Text key={`${attrs.x}-${attrs.y}`} {...attrs} />;
      case "Circle":
        return <Circle key={`${attrs.x}-${attrs.y}`} {...attrs} />;
      case "Rect":
        return <Rect key={`${attrs.x}-${attrs.y}`} {...attrs} />;
      case "Line":
        return <Line key={`${attrs.x}-${attrs.y}`} {...attrs} />;
      default:
        return null;
    }
  };

  const renderLayer = (layerData: any) => {
    return (
      <Layer key={Math.random()}>
        {layerData.children && layerData.children.map((shape: KonvaShape) => renderShape(shape))}
      </Layer>
    );
  };

  return (
    <Stage width={stageData.attrs.width} height={stageData.attrs.height} >
      {stageData.children.map((layer) => renderLayer(layer))}
    </Stage>
  );
} 
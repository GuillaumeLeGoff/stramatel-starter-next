"use client";

import React, { useRef, useEffect } from "react";
import { toast } from "sonner";
import { Stage, Layer, Rect, Circle, Text, Transformer } from "react-konva";
import { useEditorStore } from "../../store/editorStore";

interface KonvaElement {
  id: string;
  type: string;
  attrs: Record<string, unknown>;
}

interface KonvaCanvasProps {
  elements: KonvaElement[];
  selectedElementId: string | null;
  scale: number;
  onSelectElement: (elementId: string | null) => void;
  onUpdateElement: (id: string, attrs: Record<string, unknown>) => void;
}

export default function KonvaCanvas({
  elements,
  selectedElementId,
  scale,
  onSelectElement,
  onUpdateElement,
}: KonvaCanvasProps) {
  // Refs pour accéder aux composants Konva
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stageRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transformerRef = useRef<any>(null);
  const { setDragging } = useEditorStore();

  // Effet pour appliquer le transformer à l'élément sélectionné
  useEffect(() => {
    if (!transformerRef.current || !selectedElementId || !stageRef.current)
      return;

    try {
      const stage = stageRef.current;
      const selectedNode = stage.findOne(`#${selectedElementId}`);

      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer().batchDraw();
      } else {
        transformerRef.current.nodes([]);
        transformerRef.current.getLayer().batchDraw();
      }
    } catch (error) {
      console.error("Erreur lors de l'application du transformer:", error);
    }
  }, [selectedElementId, elements]);

  // Handler pour la fin du drag
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDragEnd = (e: any, id: string) => {
    try {
      onUpdateElement(id, {
        x: e.target.x(),
        y: e.target.y(),
      });
    } catch (error) {
      console.error("Erreur lors du drag end:", error);
      toast.error("Erreur lors du déplacement de l'élément");
    }
    setDragging(false);
  };

  // Handler pour la fin de la transformation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleTransformEnd = (e: any, id: string, type: string) => {
    try {
      const node = e.target;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      // Reset scale and update width/height instead
      node.scaleX(1);
      node.scaleY(1);

      onUpdateElement(id, {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
        width:
          type === "Circle" ? node.width() * scaleX : node.width() * scaleX,
        height:
          type === "Circle" ? node.height() * scaleY : node.height() * scaleY,
        radius:
          type === "Circle"
            ? node.radius() * Math.max(scaleX, scaleY)
            : undefined,
      });
    } catch (error) {
      console.error("Erreur lors du transform end:", error);
      toast.error("Erreur lors de la transformation de l'élément");
    }
  };

  // Rendu des éléments Konva
  const renderShape = (element: KonvaElement) => {
    const { id, type, attrs } = element;

    // Extraire la key pour éviter l'erreur "key prop is being spread into JSX"
    const commonProps = {
      id,
      ...attrs,
      onClick: () => onSelectElement(id),
      onTap: () => onSelectElement(id),
      draggable: true,
      onDragStart: () => {
        onSelectElement(id);
        setDragging(true);
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onDragEnd: (e: any) => handleDragEnd(e, id),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onTransformEnd: (e: any) => handleTransformEnd(e, id, type),
    };

    switch (type) {
      case "Rect":
        return <Rect key={id} {...commonProps} />;
      case "Circle":
        return <Circle key={id} {...commonProps} />;
      case "Text":
        return <Text key={id} {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="border rounded shadow-sm bg-white">
      <Stage
        ref={stageRef}
        width={800}
        height={450}
        scaleX={scale}
        scaleY={scale}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onClick={(e: any) => {
          if (e.target === e.currentTarget) {
            onSelectElement(null);
          }
        }}
      >
        <Layer>
          {/* Arrière-plan */}
          <Rect width={800} height={450} fill="#ffffff" />

          {/* Éléments de la slide */}
          {elements.map(renderShape)}

          {/* Transformer pour la sélection */}
          <Transformer
            ref={transformerRef}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            boundBoxFunc={(oldBox: any, newBox: any) => {
              // Limiter la taille minimale
              if (newBox.width < 5 || newBox.height < 5) {
                return oldBox;
              }
              return newBox;
            }}
          />
        </Layer>
      </Stage>
    </div>
  );
}

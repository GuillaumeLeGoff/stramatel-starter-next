import React, { useEffect, useState, useRef } from "react";
import { Text } from "react-konva";
import Konva from "konva";

interface KonvaLiveTextProps {
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  id: string;
  type: "date" | "time" | "datetime";
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  fontStyle?: string;
  align?: string;
  draggable?: boolean;
  onTransform?: (e: Konva.KonvaEventObject<Event>) => void;
  onTransformEnd?: (e: Konva.KonvaEventObject<Event>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<Event>) => void;
  onClick?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  ref?: (node: Konva.Text | null) => void;
}

export const KonvaLiveText: React.FC<KonvaLiveTextProps> = ({
  x,
  y,
  width = 200,
  height = 30,
  rotation = 0,
  id,
  type,
  fontSize = 16,
  fontFamily = "Arial",
  fill = "black",
  fontStyle,
  align,
  draggable = true,
  onTransform,
  onTransformEnd,
  onDragEnd,
  onClick,
  ref,
}) => {
  const [currentText, setCurrentText] = useState("");
  const textRef = useRef<Konva.Text | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Transmettre la référence au parent
  useEffect(() => {
    if (ref && textRef.current) {
      ref(textRef.current);
    }
    return () => {
      if (ref) {
        ref(null);
      }
    };
  }, [ref]);

  // Fonction pour formater le texte selon le type
  const formatText = () => {
    const now = new Date();
    
    switch (type) {
      case "date":
        return now.toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      case "time":
        return now.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      case "datetime":
        return now.toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) + ' à ' + now.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit'
        });
      default:
        return "";
    }
  };

  // Mettre à jour le texte
  useEffect(() => {
    const updateText = () => {
      const formattedText = formatText();
      setCurrentText(formattedText);
    };

    // Mise à jour immédiate
    updateText();

    // Intervalle de mise à jour
    const updateInterval = type === "time" ? 1000 : 60000; // 1s pour l'heure, 1min pour date/datetime
    intervalRef.current = setInterval(updateText, updateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [type]);

  return (
    <Text
      ref={textRef}
      text={currentText}
      x={x}
      y={y}
      width={width}
      height={height}
      rotation={rotation}
      fontSize={fontSize}
      fontFamily={fontFamily}
      fontStyle={fontStyle}
      fill={fill}
      align={align}
      id={id}
      draggable={draggable}
      onTransform={onTransform}
      onTransformEnd={onTransformEnd}
      onDragEnd={onDragEnd}
      onClick={onClick}
    />
  );
}; 
"use client";

import React, { useEffect, useState } from "react";
import {
  Stage,
  Layer,
  Text,
  Circle,
  Rect,
  Line,
  Arrow,
  Image,
} from "react-konva";
import { KonvaStage } from "@/features/editor/types";
import { PanelLiveText } from "./PanelLiveText";
import { useAppSettings } from "@/shared/hooks/useAppSettings";

interface KonvaSlideViewerProps {
  konvaData: KonvaStage;
  width?: number;
  height?: number;
}

// Composant simple pour charger et afficher les images
const SimpleKonvaImage: React.FC<{
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  id: string;
}> = ({ src, x, y, width, height, rotation = 0, id }) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageStatus, setImageStatus] = useState<
    "loading" | "loaded" | "error"
  >("loading");

  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      setImage(img);
      setImageStatus("loaded");
    };

    img.onerror = () => {
      setImageStatus("error");
      console.error(`Erreur lors du chargement de l'image: ${src}`);
    };

    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  if (imageStatus === "loading") {
    // Placeholder de chargement
    return (
      <Rect
        x={x}
        y={y}
        width={width}
        height={height}
        rotation={rotation}
        fill="#f3f4f6"
        stroke="#d1d5db"
        strokeWidth={2}
      />
    );
  }

  if (imageStatus === "error" || !image) {
    // Placeholder d'erreur
    return (
      <Rect
        x={x}
        y={y}
        width={width}
        height={height}
        rotation={rotation}
        fill="#fef2f2"
        stroke="#f87171"
        strokeWidth={2}
      />
    );
  }

  return (
    <Image
      image={image}
      x={x}
      y={y}
      width={width}
      height={height}
      rotation={rotation}
      id={id}
    />
  );
};

export default function KonvaSlideViewerClient({
  konvaData,
}: KonvaSlideViewerProps) {
  const { width, height } = useAppSettings();
  
  if (!konvaData || !konvaData.children) {
    return null;
  }

  // Utiliser les dimensions depuis AppSettings avec fallback par défaut
  const VIEWPORT_WIDTH = width;
  const VIEWPORT_HEIGHT = height;

  // Calculer l'offset pour centrer le viewport
  const offsetX = (konvaData.attrs.width - VIEWPORT_WIDTH) / 2;
  const offsetY = (konvaData.attrs.height - VIEWPORT_HEIGHT) / 2;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderShape = (
    shape: { className: string; attrs: Record<string, any> },
    index: number
  ) => {
    const { className, attrs } = shape;
    const shapeId = attrs.id || `shape_${index}`;

    // Ajuster les coordonnées pour le viewport centré
    const adjustedAttrs = {
      ...attrs,
      x: (attrs.x || 0) - offsetX,
      y: (attrs.y || 0) - offsetY,
    };

    // Ne rendre que les formes visibles dans le viewport (avec une marge plus généreuse)
    if (
      adjustedAttrs.x < -500 ||
      adjustedAttrs.y < -500 ||
      adjustedAttrs.x > VIEWPORT_WIDTH + 500 ||
      adjustedAttrs.y > VIEWPORT_HEIGHT + 500
    ) {
      return null;
    }

    switch (className) {
      case "Text":
        // Vérifier si c'est un texte live avec les nouvelles données
        if (attrs.type && attrs.type !== "text") {
          return (
            <PanelLiveText
              key={shapeId}
              x={adjustedAttrs.x}
              y={adjustedAttrs.y}
              width={attrs.width}
              height={attrs.height}
              rotation={attrs.rotation}
              id={shapeId}
              type={attrs.type}
              fontSize={attrs.fontSize}
              fontFamily={attrs.fontFamily}
              fill={attrs.fill}
              fontStyle={attrs.fontStyle}
              align={attrs.align}
            />
          );
        }
        return <Text key={shapeId} {...adjustedAttrs} draggable={false} />;
      case "Circle":
        return <Circle key={shapeId} {...adjustedAttrs} draggable={false} />;
      case "Rect":
        return <Rect key={shapeId} {...adjustedAttrs} draggable={false} />;
      case "Line":
        return <Line key={shapeId} {...adjustedAttrs} draggable={false} />;
      case "Arrow":
        if (!attrs.points) {
          return null;
        }
        return (
          <Arrow
            key={shapeId}
            {...adjustedAttrs}
            points={attrs.points.map((point: number, i: number) =>
              i % 2 === 0 ? point - offsetX : point - offsetY
            )}
            draggable={false}
          />
        );
      case "Image":
        if (!attrs.src) {
          console.warn("Image requiert une propriété src", attrs);
          return null;
        }
        return (
          <SimpleKonvaImage
            key={shapeId}
            src={attrs.src}
            x={adjustedAttrs.x}
            y={adjustedAttrs.y}
            width={attrs.width || 200}
            height={attrs.height || 150}
            rotation={attrs.rotation || 0}
            id={shapeId}
          />
        );
      // Gérer tous les nouveaux types de données de sécurité comme des Text
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
        return (
          <PanelLiveText
            key={shapeId}
            x={adjustedAttrs.x}
            y={adjustedAttrs.y}
            width={attrs.width}
            height={attrs.height}
            rotation={attrs.rotation}
            id={shapeId}
            type={className as any}
            fontSize={attrs.fontSize}
            fontFamily={attrs.fontFamily}
            fill={attrs.fill}
            fontStyle={attrs.fontStyle}
            align={attrs.align}
          />
        );
      default:
        return null;
    }
  };

  return (
   
        <Stage width={VIEWPORT_WIDTH} height={VIEWPORT_HEIGHT}>
          {konvaData.children.map((layer, layerIndex) => (
            <Layer key={layerIndex}>
              {layer.children?.map((shape, shapeIndex) =>
                renderShape(shape, shapeIndex)
              )}
            </Layer>
          ))}
        </Stage>
    
  );
}

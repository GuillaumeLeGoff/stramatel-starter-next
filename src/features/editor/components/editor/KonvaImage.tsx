import React, { useEffect, useState, useRef } from "react";
import { Image } from "react-konva";
import Konva from "konva";
import { calculateImageDimensions } from "../../utils";
import { useAppSettings } from "@/shared/hooks/useAppSettings";

interface KonvaImageProps {
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  id: string;
  draggable?: boolean;
  autoResize?: boolean; // Nouvelle prop pour redimensionnement automatique
  onTransform?: (e: Konva.KonvaEventObject<Event>) => void;
  onTransformEnd?: (e: Konva.KonvaEventObject<Event>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<Event>) => void;
  onClick?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDimensionsChange?: (width: number, height: number) => void; // Callback pour signaler le changement de dimensions
  ref?: (node: Konva.Image | null) => void;
}

export const KonvaImage: React.FC<KonvaImageProps> = ({
  src,
  x,
  y,
  width,
  height,
  rotation = 0,
  id,
  draggable = true,
  autoResize = false,
  onTransform,
  onTransformEnd,
  onDragEnd,
  onClick,
  onDimensionsChange,
  ref,
}) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageStatus, setImageStatus] = useState<
    "loading" | "loaded" | "error"
  >("loading");
  const [finalDimensions, setFinalDimensions] = useState({ width, height });
  const imageRef = useRef<Konva.Image | null>(null);
  const { width: editorWidth, height: editorHeight } = useAppSettings();

  // Transmettre la référence au parent
  useEffect(() => {
    if (ref && imageRef.current) {
      ref(imageRef.current);
    }
    return () => {
      if (ref) {
        ref(null);
      }
    };
  }, [ref, imageStatus]); // Déclencher quand l'état de l'image change

  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      setImage(img);
      setImageStatus("loaded");
      
      // Si autoResize est activé, recalculer les dimensions
      if (autoResize) {
        const newDimensions = calculateImageDimensions(
          img.naturalWidth,
          img.naturalHeight,
          editorWidth,
          editorHeight
        );
        setFinalDimensions(newDimensions);
        
        // Notifier le parent du changement de dimensions
        if (onDimensionsChange) {
          onDimensionsChange(newDimensions.width, newDimensions.height);
        }
      }
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
  }, [src, autoResize, editorWidth, editorHeight, onDimensionsChange]);

  if (imageStatus === "loading") {
    // Afficher un placeholder pendant le chargement
    return (
      <Image
        alt="Image"
        ref={imageRef}
        image={undefined}
        x={x}
        y={y}
        width={finalDimensions.width}
        height={finalDimensions.height}
        rotation={rotation}
        id={id}
        draggable={draggable}
        fill="#f3f4f6"
        stroke="#d1d5db"
        strokeWidth={2}
        onTransform={onTransform}
        onTransformEnd={onTransformEnd}
        onDragEnd={onDragEnd}
        onClick={onClick}
      />
    );
  }

  if (imageStatus === "error" || !image) {
    // Afficher un placeholder d'erreur
    return (
      <Image
        alt="Image"
        ref={imageRef}
        image={undefined}
        x={x}
        y={y}
        width={finalDimensions.width}
        height={finalDimensions.height}
        rotation={rotation}
        id={id}
        draggable={draggable}
        fill="#fef2f2"
        stroke="#f87171"
        strokeWidth={2}
        onTransform={onTransform}
        onTransformEnd={onTransformEnd}
        onDragEnd={onDragEnd}
        onClick={onClick}
      />
    );
  }

  return (
    <Image
      alt="Image"
      ref={imageRef}
      image={image}
      x={x}
      y={y}
      width={finalDimensions.width}
      height={finalDimensions.height}
      rotation={rotation}
      id={id}
      draggable={draggable}
      onTransform={onTransform}
      onTransformEnd={onTransformEnd}
      onDragEnd={onDragEnd}
      onClick={onClick}
    />
  );
};

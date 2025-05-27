import React, { useEffect, useState } from "react";
import { Image } from "react-konva";
import Konva from "konva";

interface KonvaImageProps {
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  id: string;
  draggable?: boolean;
  onTransformEnd?: (e: Konva.KonvaEventObject<Event>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<Event>) => void;
  onClick?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  [key: string]: unknown;
}

export const KonvaImage: React.FC<KonvaImageProps> = ({
  src,
  x,
  y,
  width,
  height,
  id,
  draggable = true,
  onTransformEnd,
  onDragEnd,
  onClick,
  ...otherProps
}) => {
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
    // Afficher un placeholder pendant le chargement
    return (
      <Image
        image={undefined}
        x={x}
        y={y}
        width={width}
        height={height}
        id={id}
        draggable={draggable}
        fill="#f3f4f6"
        stroke="#d1d5db"
        strokeWidth={2}
        {...otherProps}
      />
    );
  }

  if (imageStatus === "error" || !image) {
    // Afficher un placeholder d'erreur
    return (
      <Image
        image={undefined}
        x={x}
        y={y}
        width={width}
        height={height}
        id={id}
        draggable={draggable}
        fill="#fef2f2"
        stroke="#f87171"
        strokeWidth={2}
        {...otherProps}
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
      id={id}
      draggable={draggable}
      onTransformEnd={onTransformEnd}
      onDragEnd={onDragEnd}
      onClick={onClick}
      {...otherProps}
    />
  );
};

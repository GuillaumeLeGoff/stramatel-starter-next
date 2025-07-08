import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { Image, Rect } from "react-konva"; // ✅ Ajouter Rect pour le placeholder
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
  onDragStart?: (e: Konva.KonvaEventObject<Event>) => void;
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
  onDragStart,
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
  
  // Ref pour éviter les conflits entre transformations locales et props
  const isTransformingRef = useRef(false);

  // ✅ SOLUTION: Memoiser les dimensions précédentes pour éviter les boucles
  const previousDimensions = useRef({ width, height });
  
  // ✅ Vérifier si les dimensions ont réellement changé
  const dimensionsChanged = useMemo(() => {
    const changed = previousDimensions.current.width !== width || previousDimensions.current.height !== height;
    if (changed) {
      previousDimensions.current = { width, height };
    }
    return changed;
  }, [width, height]);

  // ✅ Transmettre la référence au parent avec dépendances optimisées
  useEffect(() => {
    if (ref && imageRef.current) {
      ref(imageRef.current);
    }
    return () => {
      if (ref) {
        ref(null);
      }
    };
  }, [ref, imageStatus]); // ✅ Déclencher quand l'état de l'image change

  // ✅ Synchroniser finalDimensions avec les props width/height seulement si nécessaire
  useEffect(() => {
    if (!isTransformingRef.current && dimensionsChanged) {
      setFinalDimensions({ width, height });
    }
  }, [dimensionsChanged, width, height]); // ✅ Utiliser dimensionsChanged pour éviter les boucles

  // ✅ Callback stable pour le chargement de l'image
  const handleImageLoad = useCallback((img: HTMLImageElement) => {
    setImage(img);
    setImageStatus("loaded");
    
    // Si autoResize est activé, recalculer les dimensions seulement si c'est les dimensions par défaut
    if (autoResize && finalDimensions.width === width && finalDimensions.height === height) {
      const newDimensions = calculateImageDimensions(
        img.naturalWidth,
        img.naturalHeight,
        editorWidth,
        editorHeight
      );
      setFinalDimensions(newDimensions);
      
      // Notifier le parent du changement de dimensions ET désactiver autoResize
      if (onDimensionsChange) {
        onDimensionsChange(newDimensions.width, newDimensions.height);
      }
    }
  }, [autoResize, finalDimensions.width, finalDimensions.height, width, height, editorWidth, editorHeight, onDimensionsChange]);

  // ✅ Callback stable pour les erreurs de chargement
  const handleImageError = useCallback(() => {
    setImageStatus("error");
    console.error(`Erreur lors du chargement de l'image: ${src}`);
  }, [src]);

  // ✅ useEffect optimisé pour le chargement d'image
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";

    img.onload = () => handleImageLoad(img);
    img.onerror = handleImageError;

    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, handleImageLoad, handleImageError]); // ✅ Dépendances stables grâce aux callbacks

  if (imageStatus === "error") {
    return null;
  }

  if (imageStatus === "loading" || !image) {
    // ✅ Utiliser Rect au lieu d'Image pour le placeholder
    return (
      <Rect
        x={x}
        y={y}
        width={finalDimensions.width}
        height={finalDimensions.height}
        rotation={rotation}
        id={id}
        draggable={draggable}
        fill="lightgray"
        onClick={onClick}
        onTransform={onTransform}
        onTransformEnd={onTransformEnd}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      />
    );
  }

  return (
    <Image
      image={image}
      x={x}
      y={y}
      width={finalDimensions.width}
      height={finalDimensions.height}
      rotation={rotation}
      id={id}
      draggable={draggable}
      ref={(node) => {
        imageRef.current = node;
      }}
      onClick={onClick}
      onTransform={onTransform}
      onTransformEnd={onTransformEnd}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    />
  );
};

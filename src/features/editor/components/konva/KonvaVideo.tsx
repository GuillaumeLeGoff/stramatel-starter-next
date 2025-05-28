import React, { useEffect, useState, useRef } from "react";
import { Image } from "react-konva";
import Konva from "konva";

interface KonvaVideoProps {
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  id: string;
  draggable?: boolean;
  onTransform?: (e: Konva.KonvaEventObject<Event>) => void;
  onTransformEnd?: (e: Konva.KonvaEventObject<Event>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<Event>) => void;
  onClick?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  ref?: (node: Konva.Image | null) => void;
}

export const KonvaVideo: React.FC<KonvaVideoProps> = ({
  src,
  x,
  y,
  width,
  height,
  rotation = 0,
  id,
  draggable = true,
  onTransform,
  onTransformEnd,
  onDragEnd,
  onClick,
  ref,
}) => {
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [videoStatus, setVideoStatus] = useState<
    "loading" | "loaded" | "error"
  >("loading");
  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });
  const videoRef = useRef<Konva.Image | null>(null);
  const animationRef = useRef<Konva.Animation | null>(null);
  const layerRef = useRef<Konva.Layer | null>(null);

  // Transmettre la référence au parent
  useEffect(() => {
    if (ref && videoRef.current) {
      ref(videoRef.current);
    }
    return () => {
      if (ref) {
        ref(null);
      }
    };
  }, [ref, videoStatus]);

  useEffect(() => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true; // Nécessaire pour l'autoplay dans certains navigateurs
    video.loop = true;
    video.preload = "metadata";

    const handleMetadata = () => {
      setVideoSize({
        width: video.videoWidth,
        height: video.videoHeight,
      });
      setVideoStatus("loaded");
      
      // Démarrer la lecture automatiquement
      video.play().catch((error) => {
        console.warn("Autoplay bloqué:", error);
      });
    };

    const handleError = () => {
      setVideoStatus("error");
      console.error(`Erreur lors du chargement de la vidéo: ${src}`);
    };

    const handlePlay = () => {
      // Démarrer l'animation Konva pour rafraîchir l'image
      if (videoRef.current) {
        const layer = videoRef.current.getLayer();
        if (layer && !animationRef.current) {
          const anim = new Konva.Animation(() => {
            // L'animation force le redraw de la layer
          }, layer);
          animationRef.current = anim;
          anim.start();
        }
      }
    };

    const handlePause = () => {
      // Arrêter l'animation Konva
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
    };

    video.addEventListener("loadedmetadata", handleMetadata);
    video.addEventListener("error", handleError);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    video.src = src;
    setVideoElement(video);

    return () => {
      video.removeEventListener("loadedmetadata", handleMetadata);
      video.removeEventListener("error", handleError);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      
      if (animationRef.current) {
        animationRef.current.stop();
      }
      
      video.pause();
      video.src = "";
    };
  }, [src]);

  if (videoStatus === "loading") {
    // Afficher un placeholder pendant le chargement
    return (
      <Image
        alt="Video"
        ref={videoRef}
        image={undefined}
        x={x}
        y={y}
        width={width}
        height={height}
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

  if (videoStatus === "error" || !videoElement) {
    // Afficher un placeholder d'erreur
    return (
      <Image
        alt="Video"
        ref={videoRef}
        image={undefined}
        x={x}
        y={y}
        width={width}
        height={height}
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
      alt="Video"
      ref={videoRef}
      image={videoElement}
      x={x}
      y={y}
      width={width}
      height={height}
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
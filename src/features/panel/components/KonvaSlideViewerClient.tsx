"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
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

interface KonvaSlideViewerProps {
  konvaData: KonvaStage;
  width?: number;
  height?: number;
  // ✅ Dimensions depuis WebSocket
  dimensions?: {
    width: number;
    height: number;
  };
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

// Composant simple pour charger et afficher les vidéos
const SimpleKonvaVideo: React.FC<{
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  id: string;
  onVideoStatusChange?: (status: string) => void;
}> = ({ src, x, y, width, height, rotation = 0, id, onVideoStatusChange }) => {
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const [videoStatus, setVideoStatus] = useState<
    "loading" | "ready" | "playing" | "error"
  >("loading");

  useEffect(() => {
    const videoElement = document.createElement("video");
    videoElement.crossOrigin = "anonymous";
    videoElement.muted = true;
    videoElement.loop = true;
    videoElement.preload = "metadata";
    videoElement.playsInline = true;

    // Convertir l'URL relative en URL absolue
    const absoluteSrc = src.startsWith('/') 
      ? `${window.location.origin}${src}`
      : src;
    
    videoElement.src = absoluteSrc;

    const onLoadedMetadata = () => {
      console.log("✅ Panel - Métadonnées vidéo chargées:", { src, width: videoElement.videoWidth, height: videoElement.videoHeight });
      setVideo(videoElement);
      setVideoStatus("ready");
      onVideoStatusChange?.("ready");
    };

    const onCanPlay = () => {
      console.log("🎮 Panel - Vidéo prête à jouer:", src);
      videoElement.play().then(() => {
        console.log("▶️ Panel - Lecture vidéo démarrée:", src);
        setVideoStatus("playing");
        onVideoStatusChange?.("playing");
      }).catch((error) => {
        console.warn("⚠️ Panel - Lecture automatique bloquée:", error);
        setVideoStatus("ready");
        onVideoStatusChange?.("ready");
      });
    };

    const onError = () => {
      console.error("❌ Panel - Erreur de chargement vidéo:", src);
      setVideoStatus("error");
      onVideoStatusChange?.("error");
    };

    videoElement.addEventListener("loadedmetadata", onLoadedMetadata);
    videoElement.addEventListener("canplay", onCanPlay);
    videoElement.addEventListener("error", onError);

    return () => {
      console.log("🧹 Panel - Nettoyage élément vidéo:", src);
      videoElement.removeEventListener("loadedmetadata", onLoadedMetadata);
      videoElement.removeEventListener("canplay", onCanPlay);
      videoElement.removeEventListener("error", onError);
      videoElement.pause();
      videoElement.src = "";
      setVideo(null);
      onVideoStatusChange?.("stopped");
    };
  }, [src]); // Enlever onVideoStatusChange des dépendances

  if (videoStatus === "loading") {
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

  if (videoStatus === "error" || !video) {
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
      image={video}
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
  dimensions
}: KonvaSlideViewerProps) {
  const [playingVideos, setPlayingVideos] = useState<Set<string>>(new Set());
  const animationFrameRef = useRef<number | null>(null);
  const stageRef = useRef<any>(null);
  
  // ✅ Utiliser les dimensions depuis WebSocket avec des valeurs par défaut
  const viewportDimensions = useMemo(() => ({
    width: dimensions?.width || 1920,
    height: dimensions?.height || 1080,
  }), [dimensions?.width, dimensions?.height]);

  // Gérer l'animation globale des vidéos
  useEffect(() => {
    if (playingVideos.size > 0 && stageRef.current) {
      const animateVideos = () => {
        if (stageRef.current && playingVideos.size > 0) {
          stageRef.current.batchDraw();
          animationFrameRef.current = requestAnimationFrame(animateVideos);
        }
      };
      
      animateVideos();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [playingVideos.size]);

  // Gérer le changement de statut des vidéos
  const handleVideoStatusChange = useCallback((videoId: string, status: string) => {
    setPlayingVideos(prev => {
      const newSet = new Set(prev);
      if (status === "playing") {
        newSet.add(videoId);
      } else {
        newSet.delete(videoId);
      }
      return newSet;
    });
  }, []);
  
  if (!konvaData || !konvaData.children) {
    return null;
  }

  // Utiliser les dimensions depuis AppSettings
  const VIEWPORT_WIDTH = viewportDimensions.width;
  const VIEWPORT_HEIGHT = viewportDimensions.height;

  // Calculer l'offset pour centrer le viewport
  const offsetX = (konvaData.attrs.width - VIEWPORT_WIDTH) / 2;
  const offsetY = (konvaData.attrs.height - VIEWPORT_HEIGHT) / 2;

   
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
        // ✅ Gestion spéciale pour les triangles (qui utilisent Line avec closed=true)
        if (attrs.closed && attrs.points && attrs.points.length === 6) {
          // C'est un triangle - ajuster les points aussi
          const adjustedPoints = attrs.points.map((point: number, i: number) =>
            i % 2 === 0 ? point - offsetX : point - offsetY
          );
          return (
            <Line 
              key={shapeId} 
              {...adjustedAttrs}
              points={adjustedPoints}
              closed={true}
              fill={attrs.fill}
              stroke={attrs.stroke}
              strokeWidth={attrs.strokeWidth}
              draggable={false} 
            />
          );
        } else {
          // Ligne normale
          return <Line key={shapeId} {...adjustedAttrs} draggable={false} />;
        }
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
      case "Video":
        if (!attrs.src) {
          console.warn("Video requiert une propriété src", attrs);
          return null;
        }
        return (
          <SimpleKonvaVideo
            key={shapeId}
            src={attrs.src}
            x={adjustedAttrs.x}
            y={adjustedAttrs.y}
            width={attrs.width || 200}
            height={attrs.height || 150}
            rotation={attrs.rotation || 0}
            id={shapeId}
            onVideoStatusChange={(status) => handleVideoStatusChange(shapeId, status)}
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
    <Stage
      width={VIEWPORT_WIDTH}
      height={VIEWPORT_HEIGHT}
      ref={stageRef}
    >
      {konvaData.children.map((layer, layerIndex) => (
        <Layer key={layerIndex}>
          {/* Rectangle de fond pour la couleur si définie */}
          {layerIndex === 0 && konvaData.attrs.backgroundColor && (
            <Rect
              x={0}
              y={0}
              width={VIEWPORT_WIDTH}
              height={VIEWPORT_HEIGHT}
              fill={konvaData.attrs.backgroundColor}
              listening={false}
            />
          )}
          
          {layer.children?.map((shape, shapeIndex) =>
            renderShape(shape, shapeIndex)
          )}
        </Layer>
      ))}
    </Stage>
  );
}

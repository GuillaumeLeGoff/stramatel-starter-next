import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Image, Text } from "react-konva";
import Konva from "konva";
import { calculateImageDimensions } from "../../utils";
import { useAppSettings } from "@/shared/hooks/useAppSettings";

interface KonvaVideoProps {
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  id?: string;
  draggable?: boolean;
  autoResize?: boolean; // Nouvelle prop pour redimensionnement automatique
  onClick?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onTransform?: (e: Konva.KonvaEventObject<Event>) => void;
  onTransformEnd?: (e: Konva.KonvaEventObject<Event>) => void;
  onDragStart?: (e: Konva.KonvaEventObject<Event>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<Event>) => void;
  onDimensionsChange?: (width: number, height: number) => void; // Callback pour signaler le changement de dimensions
  ref?: (node: Konva.Image | null) => void;
}

// ✅ Fonction de comparaison pour React.memo - évite les re-renders lors du drag/resize
const arePropsEqual = (prevProps: KonvaVideoProps, nextProps: KonvaVideoProps): boolean => {
  // ✅ Propriétés critiques qui nécessitent un re-render complet de la vidéo
  const criticalProps: (keyof KonvaVideoProps)[] = [
    'src', 'id', 'draggable', 'autoResize'
  ];
  
  // Vérifier les propriétés critiques
  for (const prop of criticalProps) {
    if (prevProps[prop] !== nextProps[prop]) {
      return false; // Re-render nécessaire
    }
  }
  
  // ✅ width, height, rotation, x, y peuvent changer sans re-render
  // Car Konva gère ces propriétés directement sans affecter l'élément vidéo HTML
  
  // ✅ Les callbacks peuvent changer sans affecter le rendu vidéo
  // onTransform, onDragStart, etc. sont juste passés à Konva
  
  return true; // Pas de re-render nécessaire
};

const KonvaVideoComponent: React.FC<KonvaVideoProps> = ({
  src,
  x = 0,
  y = 0,
  width = 320,
  height = 240,
  rotation = 0,
  id,
  draggable = true,
  autoResize = false,
  onClick,
  onTransform,
  onTransformEnd,
  onDragStart,
  onDragEnd,
  onDimensionsChange,
  ref,
}) => {
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "playing" | "error">("loading");
  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });
  const animationRef = useRef<Konva.Animation | null>(null);
  const imageRef = useRef<Konva.Image | null>(null);
  const { width: editorWidth, height: editorHeight } = useAppSettings();
  
  // ✅ Refs stables pour éviter les re-créations inutiles
  const autoResizeRef = useRef(autoResize);
  const onDimensionsChangeRef = useRef(onDimensionsChange);
  
  // ✅ Mettre à jour les refs sans déclencher de re-render
  useEffect(() => {
    autoResizeRef.current = autoResize;
    onDimensionsChangeRef.current = onDimensionsChange;
  }, [autoResize, onDimensionsChange]);

  // ✅ Log seulement lors des initialisations importantes (pas à chaque drag/resize)
  const isInitialRender = useRef(true);
  useEffect(() => {
    if (isInitialRender.current) {
      console.log("🎬 KonvaVideo - Initialisation:", { src, id, width, height, autoResize });
      isInitialRender.current = false;
    }
  }, [src, id]); // Seulement quand src ou id changent

  // ✅ Calculer les dimensions finales directement (sans state local)
  const finalDimensions = useMemo(() => {
    // Si autoResize est activé et qu'on a les dimensions de la vidéo, calculer les nouvelles dimensions
    if (autoResize && videoSize.width > 0 && videoSize.height > 0) {
      const newDimensions = calculateImageDimensions(
        videoSize.width,
        videoSize.height,
        editorWidth,
        editorHeight
      );
      
      // Notifier le parent du changement de dimensions
      if (onDimensionsChangeRef.current) {
        // Utiliser setTimeout pour éviter les updates pendant le render
        setTimeout(() => {
          onDimensionsChangeRef.current?.(newDimensions.width, newDimensions.height);
        }, 0);
      }
      
      return newDimensions;
    }
    
    // Sinon utiliser les dimensions des props
    return { width, height };
  }, [autoResize, videoSize.width, videoSize.height, editorWidth, editorHeight, width, height]);

  // ✅ Callback stable pour le chargement des métadonnées vidéo (pas de dépendances changeantes)
  const handleLoadedMetadata = useCallback((video: HTMLVideoElement) => {
    console.log("✅ Métadonnées vidéo chargées:", {
      src,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      duration: video.duration,
    });
    
    setVideoSize({
      width: video.videoWidth,
      height: video.videoHeight,
    });
    setStatus("ready");
  }, [src]);

  // ✅ Créer l'élément vidéo HTML5 (dépendances minimales)
  useEffect(() => {
    if (!src) return;

    console.log("🔄 Création de l'élément vidéo pour:", src);
    
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.loop = true;
    video.preload = "metadata";
    video.playsInline = true; // ✅ Important pour mobile
    video.style.display = "none";
    
    // ✅ Convertir l'URL relative en URL absolue
    const absoluteSrc = src.startsWith('/') 
      ? `${window.location.origin}${src}`
      : src;
    
    video.src = absoluteSrc;
    
    // ✅ Event listeners stables
    const onLoadedMetadata = () => handleLoadedMetadata(video);
    const onCanPlay = () => {
      console.log("🎮 Vidéo prête à jouer:", src);
      video.play().then(() => {
        console.log("▶️ Lecture vidéo démarrée:", src);
        setStatus("playing");
      }).catch((error) => {
        console.warn("⚠️ Lecture automatique bloquée:", error);
        setStatus("ready");
      });
    };
    const onPlay = () => setStatus("playing");
    const onPause = () => setStatus("ready");
    const onError = () => {
      console.error("❌ Erreur de chargement vidéo:", src);
      setStatus("error");
    };
    
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("error", onError);
    
    setVideoElement(video);

    return () => {
      console.log("🧹 Nettoyage élément vidéo:", src);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("error", onError);
      video.pause();
      video.src = "";
      setVideoElement(null);
    };
  }, [src, handleLoadedMetadata]);

  // ✅ Animation Konva optimisée selon les bonnes pratiques de la doc
  useEffect(() => {
    if (videoElement && status === "playing" && imageRef.current) {
      console.log("🎞️ Démarrage de l'animation Konva pour:", src);
      
      const layer = imageRef.current.getLayer();
      if (layer) {
        // ✅ Optimisation Konva : Animation personnalisée avec contrôle manuel du draw
        const anim = new Konva.Animation(() => {
          // L'animation redessine automatiquement le layer
          // Pas besoin de layer.draw() ici car Konva.Animation le gère
        }, layer);
        
        animationRef.current = anim;
        anim.start();
      }
    }

    return () => {
      if (animationRef.current) {
        console.log("⏹️ Arrêt de l'animation Konva pour:", src);
        animationRef.current.stop();
        animationRef.current = null;
      }
    };
  }, [videoElement, status, src]);

  // ✅ Callback pour transmettre la référence au parent
  useEffect(() => {
    if (ref && imageRef.current) {
      ref(imageRef.current);
    }
    return () => {
      if (ref) {
        ref(null);
      }
    };
  }, [ref, status]); // ✅ Se déclenche quand l'état de la vidéo change

  // ✅ Gestionnaire de clic stable
  const handleClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    console.log("🖱️ Clic sur vidéo");
    
    if (videoElement && status !== "error") {
      if (status === "playing") {
        console.log("⏸️ Pause de la vidéo");
        videoElement.pause();
      } else {
        console.log("▶️ Lecture de la vidéo");
        videoElement.play().catch((error) => {
          console.error("❌ Erreur de lecture:", error);
        });
      }
    }
    
    // Appeler le onClick du parent si fourni
    if (onClick) {
      onClick(e);
    }
  }, [videoElement, status, onClick]);

  // ✅ Props communes optimisées selon les bonnes pratiques Konva
  const commonImageProps = useMemo(() => ({
    x,
    y,
    width: finalDimensions.width,
    height: finalDimensions.height,
    rotation,
    id,
    draggable,
    onClick: handleClick,
    onTransform,
    onTransformEnd,
    onDragStart,
    onDragEnd,
    // ✅ Optimisations Konva selon la documentation
    transformsEnabled: 'position' as const, // Limiter aux transformations de position
    perfectDrawEnabled: false, // Désactiver le pixel perfect drawing coûteux
    listening: true, // Garder l'interactivité pour le clic
  }), [x, y, finalDimensions.width, finalDimensions.height, rotation, id, draggable, handleClick, onTransform, onTransformEnd, onDragStart, onDragEnd]);

  // ✅ Rendu conditionnel simplifié avec optimisations Konva

  // État de chargement
  if (status === "loading") {
    return (
      <Text
        {...commonImageProps}
        text="⏳ Chargement..."
        fontSize={16}
        fill="#FFFFFF"
        align="center"
        verticalAlign="middle"
        // ✅ Optimisations pour le texte de placeholder
        perfectDrawEnabled={false}
        transformsEnabled="position"
      />
    );
  }

  // État d'erreur
  if (status === "error") {
    return (
      <Text
        {...commonImageProps}
        text="❌ Erreur vidéo"
        fontSize={16}
        fill="#E53E3E"
        align="center"
        verticalAlign="middle"
        // ✅ Optimisations pour le texte d'erreur
        perfectDrawEnabled={false}
        transformsEnabled="position"
      />
    );
  }

  // Vidéo prête ou en lecture
  if (videoElement && (status === "ready" || status === "playing")) {
    return (
      <Image
        ref={imageRef}
        image={videoElement}
        {...commonImageProps}
      />
    );
  }

  // Fallback (ne devrait pas arriver)
  return null;
};

// ✅ Export memoized pour éviter les re-renders inutiles
export const KonvaVideo = React.memo(KonvaVideoComponent, arePropsEqual); 
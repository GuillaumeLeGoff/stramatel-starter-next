import { DEFAULT_SHAPE_STYLES } from "../constants";
import { KonvaShape, KonvaStage, ShapeType, KonvaShapeAttrs, KonvaTextNodeAttrs } from "../types";

// ===== UTILITAIRES KONVA =====

/**
 * Génère un ID unique pour une forme
 */
export const generateShapeId = (prefix: string = "shape"): string => {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
};

/**
 * Crée un stage Konva par défaut avec une couche vide
 */
export const createDefaultKonvaStage = (): KonvaStage => {
  return {
    attrs: {
      width: 10000, // Canvas large pour permettre le déplacement
      height: 10000, // Canvas large pour permettre le déplacement
      backgroundColor: "#000000", // Couleur de fond par défaut (noir)
    },
    className: "Stage",
    children: [
      {
        attrs: {},
        className: "Layer",
        children: [],
      },
    ],
  };
};

/**
 * Ajoute une fonction utilitaire pour calculer la taille des formes proportionnellement à l'éditeur
 */
export const calculateShapeDimensions = (
  defaultWidth: number,
  defaultHeight: number,
  editorWidth: number,
  editorHeight: number,
  maxPercent: number = 0.4
): { width: number; height: number } => {
  const maxW = editorWidth * maxPercent;
  const maxH = editorHeight * maxPercent;
  return {
    width: Math.min(defaultWidth, maxW),
    height: Math.min(defaultHeight, maxH),
  };
};

/**
 * Crée une nouvelle forme avec les styles par défaut
 */
export const createShape = (
  shapeType: ShapeType,
  centerX: number,
  centerY: number,
  stageWidth: number = 1920,
  stageHeight: number = 1080
): KonvaShape => {
  switch (shapeType) {
    case "rectangle": {
      const { width, height } = calculateShapeDimensions(200, 100, stageWidth, stageHeight);
      return {
        attrs: {
          x: centerX - width / 2,
          y: centerY - height / 2,
          width,
          height,
          fill: "#3B82F6",
          stroke: "#2563EB",
          strokeWidth: 2,
          id: generateShapeId("rect"),
          draggable: true,
        },
        className: "Rect",
      };
    }
    case "circle": {
      const maxRadius = Math.min(stageWidth, stageHeight) * 0.2;
      const radius = Math.min(50, maxRadius);
      return {
        attrs: {
          x: centerX,
          y: centerY,
          radius,
          fill: "#10B981",
          stroke: "#059669",
          strokeWidth: 2,
          id: generateShapeId("circle"),
          draggable: true,
        },
        className: "Circle",
      };
    }
    case "triangle": {
      const { width, height } = calculateShapeDimensions(120, 120, stageWidth, stageHeight);
      // Points d'un triangle équilatéral centré
      const halfWidth = width / 2;
      const halfHeight = height / 2;
      const points = [
        0, -halfHeight,    // Point du haut (centre horizontal, haut vertical)
        -halfWidth, halfHeight,  // Point bas gauche
        halfWidth, halfHeight    // Point bas droit
      ];
      return {
        attrs: {
          x: centerX,
          y: centerY,
          points,
          fill: "#F59E0B",
          stroke: "#D97706",
          strokeWidth: 2,
          id: generateShapeId("triangle"),
          draggable: true,
          closed: true,
        },
        className: "Line", // ✅ Utiliser Line car Konva n'a pas de Triangle natif
      };
    }
    case "text": {
      const { width } = calculateShapeDimensions(200, 50, stageWidth, stageHeight);
      // Taille de police dynamique (ex: 4% de la plus petite dimension)
      const fontSize = Math.round(Math.min(stageWidth, stageHeight) * 0.05); // ~43px pour 1080p
      // Hauteur du bloc texte = fontSize * 1.2 (pour 1 ligne)
      const height = Math.round(fontSize * 1.2);
      return {
        attrs: {
          x: centerX - width / 2,
          y: centerY - height / 2,
          width,
          height,
          text: "Nouveau texte",
          fontSize,
          fontFamily: "Arial",
          fill: "#ffffff",
          align: "center",
          wrap: "word",
          id: generateShapeId("text"),
          draggable: true,
        },
        className: "Text",
      };
    }
    case "line": {
      const lineLength = Math.min(200, stageWidth * 0.4);
      return {
        attrs: {
          x: centerX - lineLength / 2,
          y: centerY,
          points: [0, 0, lineLength, 0],
          stroke: "#ffffff",
          strokeWidth: 4,
          id: generateShapeId("line"),
          draggable: true,
        },
        className: "Line",
      };
    }
    case "arrow": {
      const arrowLength = Math.min(200, stageWidth * 0.4);
      const arrowShape = {
        attrs: {
          x: centerX - arrowLength / 2,
          y: centerY,
          points: [0, 0, arrowLength, 0],
          stroke: "#ffffff",
          strokeWidth: 4,
          pointerLength: 10,
          pointerWidth: 10,
          id: generateShapeId("arrow"),
          draggable: true,
        },
        className: "Arrow",
      };

      return arrowShape;
    }

    case "image": {
      // Utiliser des dimensions adaptées aux app settings (30% de la taille de l'éditeur)
      const { width: imgWidth, height: imgHeight } = calculateShapeDimensions(
        DEFAULT_SHAPE_STYLES.image.width,
        DEFAULT_SHAPE_STYLES.image.height,
        stageWidth,
        stageHeight,
        0.3 // 30% de la taille de l'éditeur maximum
      );
      return {
        attrs: {
          x: centerX - imgWidth / 2,
          y: centerY - imgHeight / 2,
          width: imgWidth,
          height: imgHeight,
          id: generateShapeId("img"),
          draggable: true,
        },
        className: "Image",
      };
    }

    case "video": {
      // Utiliser des dimensions adaptées aux app settings (30% de la taille de l'éditeur)
      const { width: vidWidth, height: vidHeight } = calculateShapeDimensions(
        DEFAULT_SHAPE_STYLES.video.width,
        DEFAULT_SHAPE_STYLES.video.height,
        stageWidth,
        stageHeight,
        0.3 // 30% de la taille de l'éditeur maximum
      );
      return {
        attrs: {
          x: centerX - vidWidth / 2,
          y: centerY - vidHeight / 2,
          width: vidWidth,
          height: vidHeight,
          id: generateShapeId("vid"),
          draggable: true,
        },
        className: "Video",
      };
    }

    case "liveDate":
    case "liveTime":
    case "liveDateTime": {
      const { width } = calculateShapeDimensions(250, 60, stageWidth, stageHeight, 0.25);
      const fontSize = Math.round(Math.min(stageWidth, stageHeight) * 0.04); // 4% de la plus petite dimension
      const height = Math.round(fontSize * 1.2);
      return {
        attrs: {
          x: centerX - width / 2,
          y: centerY - height / 2,
          width,
          height,
          fontSize,
          fontFamily: "Arial",
          fill: "#ffffff",
          align: "center",
          wrap: "word",
          id: generateShapeId("live"),
          draggable: true,
        },
        className: shapeType,
      };
    }
    case "currentDaysWithoutAccident":
    case "currentDaysWithoutAccidentWithStop":
    case "currentDaysWithoutAccidentWithoutStop":
    case "recordDaysWithoutAccident":
    case "yearlyAccidentsCount":
    case "yearlyAccidentsWithStopCount":
    case "yearlyAccidentsWithoutStopCount":
    case "monthlyAccidentsCount":
    case "lastAccidentDate":
    case "monitoringStartDate": {
      const { width } = calculateShapeDimensions(220, 50, stageWidth, stageHeight, 0.22);
      const fontSize = Math.round(Math.min(stageWidth, stageHeight) * 0.04); // 4% de la plus petite dimension
      const height = Math.round(fontSize * 1.2);
      return {
        attrs: {
          x: centerX - width / 2,
          y: centerY - height / 2,
          width,
          height,
          fontSize,
          fontFamily: "Arial",
          fill: "#ffffff",
          align: "center",
          wrap: "word",
          id: generateShapeId("data"),
          draggable: true,
        },
        className: shapeType,
      };
    }

    default:
      throw new Error(`Type de forme non supporté: ${shapeType}`);
  }
};

/**
 * Retourne le nom d'affichage d'une forme
 */
export const getShapeDisplayName = (shapeType: ShapeType): string => {
  const displayNames: Record<ShapeType, string> = {
    rectangle: "Rectangle",
    circle: "Cercle",
    text: "Texte",
    line: "Ligne",
    arrow: "Flèche",
    image: "Image",
    video: "Vidéo",
    liveDate: "Date en direct",
    liveTime: "Heure en direct",
    liveDateTime: "Date/heure en direct",
    currentDaysWithoutAccident: "Jours sans accident",
    currentDaysWithoutAccidentWithStop: "Jours sans arrêt",
    currentDaysWithoutAccidentWithoutStop: "Jours sans arrêt léger",
    recordDaysWithoutAccident: "Record jours sans accident",
    yearlyAccidentsCount: "Accidents cette année",
    yearlyAccidentsWithStopCount: "Accidents avec arrêt",
    yearlyAccidentsWithoutStopCount: "Accidents sans arrêt",
    monthlyAccidentsCount: "Accidents ce mois",
    lastAccidentDate: "Dernier accident",
    monitoringStartDate: "Début de suivi",
  };

  return displayNames[shapeType];
};

// ===== UTILITAIRES DE VALIDATION =====

/**
 * Vérifie si un objet est un stage Konva valide
 */
export const isValidKonvaStage = (data: unknown): data is KonvaStage => {
  if (!data || typeof data !== "object") return false;

  const stage = data as Record<string, unknown>;
  return (
    typeof stage.width === "number" &&
    typeof stage.height === "number" &&
    stage.className === "Stage" &&
    Array.isArray(stage.children)
  );
};

/**
 * Clone profondément un objet Konva
 */
export const deepCloneKonvaData = <T>(data: T): T => {
  return JSON.parse(JSON.stringify(data));
};

// ===== UTILITAIRES DE CALCUL =====

/**
 * Calcule le centre d'un stage
 */
export const getStageCenter = (stage: KonvaStage): { x: number; y: number } => {
  return {
    x: stage.attrs.width / 2,
    y: stage.attrs.height / 2,
  };
};

/**
 * Calcule les limites d'un stage pour le zoom
 */
export const getStageBounds = (stage: KonvaStage) => {
  return {
    width: stage.attrs.width,
    height: stage.attrs.height,
    centerX: stage.attrs.width / 2,
    centerY: stage.attrs.height / 2,
  };
};

/**
 * Nettoie les références à un média supprimé dans les données Konva
 */
export const cleanMediaFromKonvaData = (
  konvaData: KonvaStage,
  mediaUrl: string
): KonvaStage => {
  const cleanedData = deepCloneKonvaData(konvaData);

  const cleanShapes = (shapes: KonvaShape[]): KonvaShape[] => {
    return shapes.filter((shape) => {
      // Supprimer les images et vidéos qui référencent le média supprimé
      if (
        (shape.className === "Image" || shape.className === "Video") &&
        ('src' in shape.attrs && typeof (shape.attrs as KonvaShapeAttrs).src === 'string') &&
        (shape.attrs as KonvaShapeAttrs).src === mediaUrl
      ) {
        return false;
      }

      // Nettoyer récursivement les enfants (pour les groupes)
      if (shape.children && shape.children.length > 0) {
        shape.children = cleanShapes(shape.children);
      }

      return true;
    });
  };

  // Nettoyer toutes les couches
  cleanedData.children = cleanedData.children.map((layer) => ({
    ...layer,
    children: cleanShapes(layer.children),
  }));

  return cleanedData;
};

/**
 * Trouve tous les médias utilisés dans les données Konva
 */
export const findMediasInKonvaData = (konvaData: KonvaStage): string[] => {
  const mediaUrls: string[] = [];

  const findInShapes = (shapes: KonvaShape[]) => {
    shapes.forEach((shape) => {
      if (
        (shape.className === "Image" || shape.className === "Video") &&
        ('src' in shape.attrs && typeof (shape.attrs as KonvaShapeAttrs).src === 'string') &&
        (shape.attrs as KonvaShapeAttrs).src
      ) {
        const src = (shape.attrs as KonvaShapeAttrs).src;
        if (typeof src === 'string') {
          mediaUrls.push(src);
        }
      }

      // Chercher récursivement dans les enfants
      if (shape.children && shape.children.length > 0) {
        findInShapes(shape.children);
      }
    });
  };

  konvaData.children.forEach((layer) => {
    findInShapes(layer.children);
  });

  return [...new Set(mediaUrls)]; // Supprimer les doublons
};

/**
 * Calcule les dimensions d'une image en conservant son ratio
 * et en s'adaptant aux dimensions de l'éditeur (appSettings)
 */
export const calculateImageDimensions = (
  imageWidth: number,
  imageHeight: number,
  editorWidth: number,
  editorHeight: number,
  maxPercent: number = 0.4 // Maximum 40% de la taille de l'éditeur par défaut
): { width: number; height: number } => {
  // Calculer le ratio de l'image
  const imageRatio = imageWidth / imageHeight;
  
  // Calculer les dimensions maximales (pourcentage de l'éditeur)
  const maxWidth = editorWidth * maxPercent;
  const maxHeight = editorHeight * maxPercent;
  
  let finalWidth: number;
  let finalHeight: number;
  
  // Déterminer quelle dimension limite en premier
  if (imageWidth / imageHeight > maxWidth / maxHeight) {
    // L'image est plus large proportionnellement, limiter par la largeur
    finalWidth = maxWidth;
    finalHeight = maxWidth / imageRatio;
  } else {
    // L'image est plus haute proportionnellement, limiter par la hauteur
    finalHeight = maxHeight;
    finalWidth = maxHeight * imageRatio;
  }
  
  return {
    width: Math.round(finalWidth),
    height: Math.round(finalHeight)
  };
};

/**
 * Charge une image et retourne ses dimensions naturelles
 */
export const loadImageDimensions = (src: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    
    img.onerror = () => {
      reject(new Error(`Impossible de charger l'image: ${src}`));
    };
    
    img.src = src;
  });
};

/**
 * Corrige les propriétés manquantes d'une forme
 */
export const fixShapeProperties = (shape: KonvaShape): KonvaShape => {
  const { className, attrs } = shape;
  
  switch (className) {
    case "Rect": {
      const defaultRect = DEFAULT_SHAPE_STYLES.rectangle;
      const rectAttrs = attrs as KonvaShapeAttrs;
      return {
        ...shape,
        attrs: {
          ...rectAttrs,
          fill: rectAttrs.fill || defaultRect.fill,
          stroke: rectAttrs.stroke || defaultRect.stroke,
          strokeWidth: rectAttrs.strokeWidth ?? defaultRect.strokeWidth,
          width: rectAttrs.width || defaultRect.width,
          height: rectAttrs.height || defaultRect.height,
        },
      };
    }
    
    case "Circle": {
      const defaultCircle = DEFAULT_SHAPE_STYLES.circle;
      const circleAttrs = attrs as KonvaShapeAttrs;
      return {
        ...shape,
        attrs: {
          ...circleAttrs,
          fill: circleAttrs.fill || defaultCircle.fill,
          stroke: circleAttrs.stroke || defaultCircle.stroke,
          strokeWidth: circleAttrs.strokeWidth ?? defaultCircle.strokeWidth,
          radius: circleAttrs.radius || defaultCircle.radius,
        },
      };
    }
    
    case "Line": {
      // Gestion spéciale pour les triangles (Line avec closed=true)
      if (attrs.closed && attrs.points && (attrs.points as number[]).length === 6) {
        const defaultTriangle = DEFAULT_SHAPE_STYLES.triangle;
        return {
          ...shape,
          attrs: {
            ...attrs,
            fill: attrs.fill || defaultTriangle.fill,
            stroke: attrs.stroke || defaultTriangle.stroke,
            strokeWidth: attrs.strokeWidth ?? defaultTriangle.strokeWidth,
            closed: true,
          },
        };
      }
      // Ligne normale
      const defaultLine = DEFAULT_SHAPE_STYLES.line;
      return {
        ...shape,
        attrs: {
          ...attrs,
          stroke: attrs.stroke || defaultLine.stroke,
          strokeWidth: attrs.strokeWidth ?? defaultLine.strokeWidth,
        },
      };
    }
    
    case "Text": {
      const defaultText = DEFAULT_SHAPE_STYLES.text;
      const textAttrs = attrs as KonvaTextNodeAttrs;
      return {
        ...shape,
        attrs: {
          ...textAttrs,
          fill: textAttrs.fill || defaultText.fill,
          fontSize: textAttrs.fontSize || defaultText.fontSize,
          fontFamily: textAttrs.fontFamily || defaultText.fontFamily,
          align: textAttrs.align || defaultText.align,
        },
      };
    }
    
    default:
      return shape;
  }
};

/**
 * Corrige récursivement toutes les formes dans un stage
 */
export const fixStageShapes = (stage: KonvaStage): KonvaStage => {
  const fixShapesRecursively = (shapes: KonvaShape[]): KonvaShape[] => {
    return shapes.map(shape => {
      const fixedShape = fixShapeProperties(shape);
      if (fixedShape.children) {
        return {
          ...fixedShape,
          children: fixShapesRecursively(fixedShape.children),
        };
      }
      return fixedShape;
    });
  };

  return {
    ...stage,
    children: stage.children.map(layer => ({
      ...layer,
      children: layer.children ? fixShapesRecursively(layer.children) : [],
    })),
  };
};

/**
 * Convertit une couleur hex en valeurs RGB
 */
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

/**
 * Calcule la luminosité d'une couleur selon la formule W3C
 */
const getLuminance = (r: number, g: number, b: number): number => {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

/**
 * Détermine si une couleur est sombre ou claire
 */
const isColorDark = (hex: string): boolean => {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  
  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  return luminance < 0.5;
};

/**
 * Retourne la couleur appropriée pour les zones de délimitation
 * selon la luminosité de la couleur de fond
 */
export const getOverlayColor = (backgroundColor: string): string => {
  const isDark = isColorDark(backgroundColor);
  // Si le fond est sombre, utiliser du blanc avec transparence
  // Si le fond est clair, utiliser du noir avec transparence
  return isDark ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)";
};

import { DEFAULT_SHAPE_STYLES } from "../constants";
import { KonvaShape, KonvaStage, ShapeType } from "../types";

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
export const createDefaultKonvaStage = (

): KonvaStage => {
  return {
    attrs: {
      width: 10000, // Canvas large pour permettre le déplacement
      height: 10000, // Canvas large pour permettre le déplacement
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
 * Crée une nouvelle forme avec les styles par défaut
 */
export const createShape = (
  shapeType: ShapeType,
  centerX: number,
  centerY: number
): KonvaShape => {
  const shapeId = generateShapeId(shapeType);

  const baseAttrs = {
    id: shapeId,
    name: getShapeDisplayName(shapeType),
    draggable: true,
  };

  switch (shapeType) {
    case "rectangle": {
      const rectStyle = DEFAULT_SHAPE_STYLES.rectangle;
      return {
        attrs: {
          ...baseAttrs,
          x: centerX - rectStyle.width / 2,
          y: centerY - rectStyle.height / 2,
          ...rectStyle,
        },
        className: "Rect",
      };
    }

    case "circle": {
      const circleStyle = DEFAULT_SHAPE_STYLES.circle;
      return {
        attrs: {
          ...baseAttrs,
          x: centerX,
          y: centerY,
          ...circleStyle,
        },
        className: "Circle",
      };
    }

    case "text": {
      const textStyle = DEFAULT_SHAPE_STYLES.text;
      return {
        attrs: {
          ...baseAttrs,
          x: centerX - textStyle.width / 2,
          y: centerY - textStyle.height / 2,
          ...textStyle,
        },
        className: "Text",
      };
    }

    case "line": {
      const lineStyle = DEFAULT_SHAPE_STYLES.line;
      return {
        attrs: {
          ...baseAttrs,
          points: [centerX - 100, centerY, centerX + 100, centerY] as number[],
          ...lineStyle,
        },
        className: "Line",
      };
    }

    case "arrow": {
      const arrowStyle = DEFAULT_SHAPE_STYLES.arrow;
      return {
        attrs: {
          ...baseAttrs,
          points: [centerX - 100, centerY, centerX + 100, centerY] as number[],
          ...arrowStyle,
        },
        className: "Arrow",
      };
    }

    case "image": {
      const imageStyle = DEFAULT_SHAPE_STYLES.image;
      return {
        attrs: {
          ...baseAttrs,
          x: centerX - imageStyle.width / 2,
          y: centerY - imageStyle.height / 2,
          ...imageStyle,
        },
        className: "Image",
      };
    }

    case "video": {
      const videoStyle = DEFAULT_SHAPE_STYLES.video;
      return {
        attrs: {
          ...baseAttrs,
          x: centerX - videoStyle.width / 2,
          y: centerY - videoStyle.height / 2,
          ...videoStyle,
        },
        className: "Video",
      };
    }

    case "liveDate": {
      return {
        attrs: {
          ...baseAttrs,
          x: centerX - 100,
          y: centerY - 15,
          width: 200,
          height: 30,
          fontSize: 16,
          fontFamily: "Arial",
          fontStyle: "normal",
          fill: "#000000",
          align: "left",
        },
        className: "liveDate",
      };
    }

    case "liveTime": {
      return {
        attrs: {
          ...baseAttrs,
          x: centerX - 100,
          y: centerY - 15,
          width: 200,
          height: 30,
          fontSize: 16,
          fontFamily: "Arial",
          fontStyle: "normal",
          fill: "#000000",
          align: "left",
        },
        className: "liveTime",
      };
    }

    case "liveDateTime": {
      return {
        attrs: {
          ...baseAttrs,
          x: centerX - 150,
          y: centerY - 15,
          width: 300,
          height: 30,
          fontSize: 16,
          fontFamily: "Arial",
          fontStyle: "normal",
          fill: "#000000",
          align: "left",
        },
        className: "liveDateTime",
      };
    }

    // Données de sécurité - Compteurs de jours
    case "currentDaysWithoutAccident": {
      return {
        attrs: {
          ...baseAttrs,
          x: centerX - 100,
          y: centerY - 20,
          width: 200,
          height: 40,
          fontSize: 24,
          fontFamily: "Arial",
          fontStyle: "bold",
          fill: "#22c55e",
          align: "center",
        },
        className: "currentDaysWithoutAccident",
      };
    }

    case "currentDaysWithoutAccidentWithStop": {
      return {
        attrs: {
          ...baseAttrs,
          x: centerX - 100,
          y: centerY - 20,
          width: 200,
          height: 40,
          fontSize: 24,
          fontFamily: "Arial",
          fontStyle: "bold",
          fill: "#22c55e",
          align: "center",
        },
        className: "currentDaysWithoutAccidentWithStop",
      };
    }

    case "currentDaysWithoutAccidentWithoutStop": {
      return {
        attrs: {
          ...baseAttrs,
          x: centerX - 100,
          y: centerY - 20,
          width: 200,
          height: 40,
          fontSize: 24,
          fontFamily: "Arial",
          fontStyle: "bold",
          fill: "#22c55e",
          align: "center",
        },
        className: "currentDaysWithoutAccidentWithoutStop",
      };
    }

    case "recordDaysWithoutAccident": {
      return {
        attrs: {
          ...baseAttrs,
          x: centerX - 100,
          y: centerY - 20,
          width: 200,
          height: 40,
          fontSize: 24,
          fontFamily: "Arial",
          fontStyle: "bold",
          fill: "#f59e0b",
          align: "center",
        },
        className: "recordDaysWithoutAccident",
      };
    }

    // Données de sécurité - Compteurs d'accidents
    case "yearlyAccidentsCount": {
      return {
        attrs: {
          ...baseAttrs,
          x: centerX - 75,
          y: centerY - 20,
          width: 150,
          height: 40,
          fontSize: 24,
          fontFamily: "Arial",
          fontStyle: "bold",
          fill: "#ef4444",
          align: "center",
        },
        className: "yearlyAccidentsCount",
      };
    }

    case "yearlyAccidentsWithStopCount": {
      return {
        attrs: {
          ...baseAttrs,
          x: centerX - 75,
          y: centerY - 20,
          width: 150,
          height: 40,
          fontSize: 24,
          fontFamily: "Arial",
          fontStyle: "bold",
          fill: "#ef4444",
          align: "center",
        },
        className: "yearlyAccidentsWithStopCount",
      };
    }

    case "yearlyAccidentsWithoutStopCount": {
      return {
        attrs: {
          ...baseAttrs,
          x: centerX - 75,
          y: centerY - 20,
          width: 150,
          height: 40,
          fontSize: 24,
          fontFamily: "Arial",
          fontStyle: "bold",
          fill: "#f97316",
          align: "center",
        },
        className: "yearlyAccidentsWithoutStopCount",
      };
    }

    case "monthlyAccidentsCount": {
      return {
        attrs: {
          ...baseAttrs,
          x: centerX - 75,
          y: centerY - 20,
          width: 150,
          height: 40,
          fontSize: 24,
          fontFamily: "Arial",
          fontStyle: "bold",
          fill: "#ef4444",
          align: "center",
        },
        className: "monthlyAccidentsCount",
      };
    }

    // Données de sécurité - Dates
    case "lastAccidentDate": {
      return {
        attrs: {
          ...baseAttrs,
          x: centerX - 100,
          y: centerY - 15,
          width: 200,
          height: 30,
          fontSize: 16,
          fontFamily: "Arial",
          fontStyle: "normal",
          fill: "#6b7280",
          align: "center",
        },
        className: "lastAccidentDate",
      };
    }

    case "monitoringStartDate": {
      return {
        attrs: {
          ...baseAttrs,
          x: centerX - 100,
          y: centerY - 15,
          width: 200,
          height: 30,
          fontSize: 16,
          fontFamily: "Arial",
          fontStyle: "normal",
          fill: "#6b7280",
          align: "center",
        },
        className: "monitoringStartDate",
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
        shape.attrs.src === mediaUrl
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
        shape.attrs.src
      ) {
        mediaUrls.push(shape.attrs.src as string);
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

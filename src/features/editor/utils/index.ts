import { KonvaStage, KonvaShape, ShapeType } from "../types";
import { DEFAULT_SHAPE_STYLES, DEFAULT_STAGE_DIMENSIONS } from "../constants";

// ===== UTILITAIRES KONVA =====

/**
 * Génère un ID unique pour une forme
 */
export const generateShapeId = (prefix: string = "shape"): string => {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
};

/**
 * Crée un stage Konva par défaut
 */
export const createDefaultKonvaStage = (
  width?: number,
  height?: number
): KonvaStage => {
  const stageWidth = width || DEFAULT_STAGE_DIMENSIONS.width;
  const stageHeight = height || DEFAULT_STAGE_DIMENSIONS.height;

  return {
    width: stageWidth,
    height: stageHeight,
    attrs: {
      width: stageWidth,
      height: stageHeight,
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

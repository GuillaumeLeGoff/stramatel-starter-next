// ===== CONSTANTES DE L'ÉDITEUR =====

// Dimensions par défaut
export const DEFAULT_SLIDE_DIMENSIONS = {
  width: 1920,
  height: 1080,
} as const;

export const DEFAULT_STAGE_DIMENSIONS = {
  width: 800,
  height: 600,
} as const;

// Zoom
export const ZOOM_CONFIG = {
  min: 0.1,
  max: 3,
  step: 0.1,
  default: 1,
} as const;

// Formes par défaut
export const DEFAULT_SHAPE_STYLES = {
  rectangle: {
    width: 200,
    height: 100,
    fill: "#3B82F6",
    stroke: "#2563EB",
    strokeWidth: 2,
  },
  circle: {
    radius: 50,
    fill: "#10B981",
    stroke: "#059669",
    strokeWidth: 2,
  },
  text: {
    width: 200,
    height: 50,
    text: "Nouveau texte",
    fontSize: 20,
    fontFamily: "Arial",
    fill: "#000000",
    align: "center",
    wrap: "word",
  },
  line: {
    stroke: "#000000",
    strokeWidth: 4,
  },
  arrow: {
    stroke: "#000000",
    strokeWidth: 4,
    pointerLength: 10,
    pointerWidth: 10,
  },
  image: {
    width: 200,
    height: 150,
  },
  video: {
    width: 200,
    height: 150,
  },
} as const;

// Types de formes disponibles
export const SHAPE_TYPES = [
  "rectangle",
  "circle",
  "text",
  "line",
  "arrow",
  "image",
  "video",
] as const;

// Configuration des panneaux redimensionnables
export const PANEL_CONFIG = {
  slidePanel: {
    defaultSize: 20,
    minSize: 15,
    maxSize: 30,
  },
  editorPanel: {
    defaultSize: 60,
  },
  toolsPanel: {
    defaultSize: 20,
    minSize: 15,
  },
  headerPanel: {
    defaultSize: 5,
  },
  footerPanel: {
    defaultSize: 5,
  },
} as const;

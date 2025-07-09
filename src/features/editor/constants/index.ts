// ===== CONSTANTES DE L'ÉDITEUR =====



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
  triangle: {
    width: 120,
    height: 120,
    fill: "#F59E0B",
    stroke: "#D97706",
    strokeWidth: 2,
  },
  text: {
    width: 200,
    height: 50,
    text: "Nouveau texte",
    fontSize: 20,
    fontFamily: "Arial",
    fill: "#ffffff",
    align: "center",
    wrap: "word",
  },
  line: {
    stroke: "#ffffff",
    strokeWidth: 4,
  },
  arrow: {
    stroke: "#ffffff",
    strokeWidth: 4,
    pointerLength: 10,
    pointerWidth: 10,
  },
  image: {
    width: 200,
    height: 150,
    // Ces valeurs seront remplacées dynamiquement par les appSettings
  },
  video: {
    width: 200,
    height: 150,
    // Ces valeurs seront remplacées dynamiquement par les appSettings
  },
} as const;

// Types de formes disponibles
export const SHAPE_TYPES = [
  "rectangle",
  "circle",
  "triangle",
  "text",
  "line",
  "arrow",
  "image",
  "video",
] as const;

// ===== TYPES DE FLÈCHES =====
export const ARROW_TYPES = {
  standard: {
    name: "Standard",
    icon: "→",
    pointerLength: 10,
    pointerWidth: 10,
  },
  large: {
    name: "Large",
    icon: "⟶",
    pointerLength: 15,
    pointerWidth: 12,
  },
  thin: {
    name: "Fine",
    icon: "⤷",
    pointerLength: 8,
    pointerWidth: 6,
  },
  wide: {
    name: "Épaisse",
    icon: "⟹",
    pointerLength: 12,
    pointerWidth: 16,
  },
  sharp: {
    name: "Pointue",
    icon: "⤴",
    pointerLength: 20,
    pointerWidth: 8,
  },
  block: {
    name: "Bloc",
    icon: "▶",
    pointerLength: 12,
    pointerWidth: 20,
  },
} as const;

export type ArrowType = keyof typeof ARROW_TYPES;

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

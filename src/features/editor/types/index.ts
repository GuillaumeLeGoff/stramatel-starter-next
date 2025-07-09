// ===== TYPES KONVA =====

export interface KonvaTextNodeAttrs {
  x: number;
  y: number;
  width?: number;
  height?: number;
  text: string;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  align?: string;
  id?: string;
  fontStyle?: string;
  draggable?: boolean;
  wrap?: string;
}

export interface KonvaLiveTextAttrs {
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  align?: string;
  id?: string;
  fontStyle?: string;
  draggable?: boolean;
  name?: string;
  rotation?: number;
}

export interface KonvaShapeAttrs {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  points?: number[];
  pointerLength?: number;
  pointerWidth?: number;
  src?: string; // Pour les images
  autoResize?: boolean; // Pour le redimensionnement automatique des images/vidéos
  fontSize?: number; // Pour les éléments live
  fontFamily?: string; // Pour les éléments live
  fontStyle?: string; // Pour les éléments live
  align?: string; // Pour les éléments live
  [key: string]: string | number | boolean | number[] | undefined;
}

export interface KonvaLayerAttrs {
  [key: string]: string | number | boolean | undefined;
}

export interface KonvaStageAttrs {
  width: number;
  height: number;
  backgroundColor?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface KonvaNode {
  attrs:
    | KonvaShapeAttrs
    | KonvaTextNodeAttrs
    | KonvaLiveTextAttrs
    | KonvaLayerAttrs
    | KonvaStageAttrs;
  className: string;
  children?: KonvaNode[];
}

export interface KonvaStage extends KonvaNode {
  attrs: KonvaStageAttrs;
  className: "Stage";
  children: KonvaLayer[];
}

export interface KonvaLayer extends KonvaNode {
  attrs: KonvaLayerAttrs;
  className: "Layer";
  children: KonvaShape[];
}

export interface KonvaShape extends KonvaNode {
  attrs: KonvaShapeAttrs | KonvaTextNodeAttrs | KonvaLiveTextAttrs;
  className: string;
  children?: KonvaShape[];
}

// ===== TYPES SLIDE =====

export interface Slide {
  id: number;
  konvaData?: unknown;
  width?: number;
  height?: number;
  slideshowId?: number;
  position?: number;
  duration?: number;
  mediaId?: number | null;
  media?: unknown | null;
}

export interface SlidePreviewProps {
  slide: Slide;
  index: number;
  isActive?: boolean;
  onClick?: () => void;
}

// ===== TYPES STORE =====



// ===== TYPES UTILITAIRES =====

export type ShapeType =
  | "rectangle"
  | "circle"
  | "triangle"
  | "text"
  | "arrow"
  | "image"
  | "video"
  | "liveDate"
  | "liveTime"
  | "liveDateTime"
  | "currentDaysWithoutAccident"
  | "currentDaysWithoutAccidentWithStop"
  | "currentDaysWithoutAccidentWithoutStop"
  | "recordDaysWithoutAccident"
  | "yearlyAccidentsCount"
  | "yearlyAccidentsWithStopCount"
  | "yearlyAccidentsWithoutStopCount"
  | "monthlyAccidentsCount"
  | "lastAccidentDate"
  | "monitoringStartDate";

export interface EditorState {
  zoom: number;
  selectedTool: ShapeType | null;
  isEditing: boolean;
}

export interface ZoomControls {
  scale: number;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
}

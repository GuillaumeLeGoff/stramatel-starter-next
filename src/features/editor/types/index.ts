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
  [key: string]: string | number | boolean | number[] | undefined;
}

export interface KonvaLayerAttrs {
  [key: string]: string | number | boolean | undefined;
}

export interface KonvaStageAttrs {
  width: number;
  height: number;
  [key: string]: string | number | boolean | undefined;
}

export interface KonvaNode {
  attrs:
    | KonvaShapeAttrs
    | KonvaTextNodeAttrs
    | KonvaLayerAttrs
    | KonvaStageAttrs;
  className: string;
  children?: KonvaNode[];
}

export interface KonvaStage extends KonvaNode {
  width: number;
  height: number;
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
  attrs: KonvaShapeAttrs | KonvaTextNodeAttrs;
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

export interface SlideStore {
  currentSlide: number;
  isLoading: boolean;
  error: string | null;
  selectedShapes: KonvaShape[];
  editingTextId: string | null;
  editingTextShape: KonvaShape | null;
}

// ===== TYPES UTILITAIRES =====

export type ShapeType =
  | "rectangle"
  | "circle"
  | "text"
  | "line"
  | "arrow"
  | "image";

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

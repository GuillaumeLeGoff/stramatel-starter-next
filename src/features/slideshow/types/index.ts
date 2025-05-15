// Types for slideshow feature

// Type pour les médias
export interface Media {
  id: number;
  originalFileName: string;
  fileName: string;
  path: string;
  format: string;
  type: string;
  size: number;
  thumbnailId?: number;
  thumbnail?: Media;
  thumbnails?: Media[];
}

// Type pour les données
export interface Data {
  id: number;
  name: string;
  type: string;
  value: string;
}

// Type pour les données Konva (canvas)
export interface KonvaData {
  objects?: any[];
  background?: string;
  width?: number;
  height?: number;
  [key: string]: any;
}

// Types alignés avec le schéma Prisma
export interface SlideshowSlide {
  id: number;
  slideshowId: number;
  position: number;
  duration: number;
  mediaId: number;
  x: number;
  y: number;
  width: number;
  height: number;
  konvaData?: KonvaData;
  media?: Media;
  data?: SlideData[];
}

export interface SlideData {
  id: number;
  slideId: number;
  dataId: number;
  data?: Data;
}

export interface SlideshowMode {
  id: number;
  name: string;
  slideshowId: number;
  settings: Record<string, unknown>;
}

export interface SlideshowConfig {
  id: number;
  name: string;
  description?: string;
  createdBy: number;
  slides: SlideshowSlide[];
  modes: SlideshowMode[];
  user?: {
    id: number;
    username: string;
  };
}

export interface SlideshowState {
  slideshows: SlideshowConfig[];
  currentSlideshow: SlideshowConfig | null;
  isLoading: boolean;
  error: string | null;
  isEditorOpen: boolean;
}

export interface SlideshowFormData {
  name: string;
  description?: string;
}

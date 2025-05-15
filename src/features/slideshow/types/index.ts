// Types for slideshow feature

// Type pour les données Konva
export interface KonvaData {
  attrs?: Record<string, unknown>;
  className?: string;
  children?: Array<{
    attrs?: Record<string, unknown>;
    className?: string;
    children?: Array<{
      attrs?: Record<string, unknown>;
      className?: string;
    }>;
  }>;
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
  media?: Media;
  data?: SlideData[];
  konvaData?: KonvaData;
}

export interface Media {
  id: number;
  originalFileName: string;
  fileName: string;
  path: string;
  format: string;
  type: string;
  size: number;
  uploadedAt: string;
  updatedAt: string;
}

export interface SlideData {
  id: number;
  slideId: number;
  dataId: number;
  data?: Data;
}

export interface Data {
  id: number;
  name: string;
  value: string;
  type: string;
  edit: boolean;
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
}

export interface SlideshowFormData {
  name: string;
  description?: string;
}

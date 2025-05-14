// Types for diaporama feature

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
export interface DiaporamaSlide {
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

export interface DiaporamaMode {
  id: number;
  name: string;
  slideshowId: number;
  settings: Record<string, unknown>;
}

export interface DiaporamaConfig {
  id: number;
  name: string;
  description?: string;
  createdBy: number;
  slides: DiaporamaSlide[];
  modes: DiaporamaMode[];
  user?: {
    id: number;
    username: string;
  };
}

export interface DiaporamaState {
  diaporamas: DiaporamaConfig[];
  currentDiaporama: DiaporamaConfig | null;
  isLoading: boolean;
  error: string | null;
}

export interface DiaporamaFormData {
  name: string;
  description?: string;
}

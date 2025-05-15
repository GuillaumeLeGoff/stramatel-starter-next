// Types nécessaires pour l'éditeur

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

// Interface pour représenter une Slide du slideshow
export interface EditorSlide {
  id: number;
  slideshowId: number;
  position: number;
  duration: number;
  width?: number;
  height?: number;
  konvaData?: KonvaData;
  [key: string]: any; // Pour les autres propriétés
} 
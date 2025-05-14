import { create } from "zustand";

interface Shape {
  id: string;
  name: string;
  icon: string;
}

interface EditorState {
  selectedSlideId: number | null;
  selectedElementId: string | null;
  isDragging: boolean;
  scale: number;
  shapes: Shape[];
}

interface EditorActions {
  selectSlide: (slideId: number | null) => void;
  selectElement: (elementId: string | null) => void;
  setDragging: (isDragging: boolean) => void;
  setScale: (scale: number) => void;
  resetState: () => void;
}

const initialState: EditorState = {
  selectedSlideId: null,
  selectedElementId: null,
  isDragging: false,
  scale: 1,
  shapes: [
    { id: "text", name: "Texte", icon: "type" },
    { id: "rect", name: "Rectangle", icon: "square" },
    { id: "circle", name: "Cercle", icon: "circle" },
    { id: "image", name: "Image", icon: "image" },
    { id: "video", name: "Vidéo", icon: "video" },
  ],
};

export const useEditorStore = create<EditorState & EditorActions>((set) => ({
  ...initialState,

  selectSlide: (slideId) => {
    console.log("🔍 Store: sélection slide", slideId);
    set({ selectedSlideId: slideId });
  },

  selectElement: (elementId) => {
    console.log("🔍 Store: sélection élément", elementId);
    set({ selectedElementId: elementId });
  },

  setDragging: (isDragging) => set({ isDragging }),

  setScale: (scale) => set({ scale }),

  resetState: () => set(initialState),
}));

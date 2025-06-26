import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface EditorState {
  // État de l'éditeur
  isLoading: boolean;
  error: string | null;
  selectedShapes: any[];
  editingTextId: string | null;
  
  // État du canvas
  stageScale: number;
  stagePosition: { x: number; y: number };
}

interface EditorActions {
  // Actions pour mettre à jour l'état
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedShapes: (shapes: any[]) => void;
  setEditingTextId: (id: string | null) => void;
  setStageScale: (scale: number) => void;
  setStagePosition: (position: { x: number; y: number }) => void;
}

type EditorStore = EditorState & EditorActions;

export const useEditorStore = create<EditorStore>()(
  devtools(
    (set) => ({
      // État initial (données uniquement)
      isLoading: false,
      error: null,
      selectedShapes: [],
      editingTextId: null,
      stageScale: 1,
      stagePosition: { x: 0, y: 0 },
      
      // Actions simples pour setter les données
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setSelectedShapes: (shapes) => set({ selectedShapes: shapes }),
      setEditingTextId: (id) => set({ editingTextId: id }),
      setStageScale: (scale) => set({ stageScale: scale }),
      setStagePosition: (position) => set({ stagePosition: position }),
    }),
    {
      name: 'editor-store',
    }
  )
);

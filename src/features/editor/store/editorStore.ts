import { create } from 'zustand';
import { KonvaShape, KonvaStage } from '../types';

// ===== INTERFACES POUR LE STORE =====

interface EditorState {
  // Navigation
  currentSlide: number;
  
  // Sélection et édition
  selectedShapes: KonvaShape[];
  editingTextId: string | null;
  editingTextShape: KonvaShape | null;
  
  // États UI
  isLoading: boolean;
  error: string | null;
  
  // Canvas
  stageScale: number;
  stagePosition: { x: number; y: number };
  
  // Cache des données Konva pour optimiser les performances
  konvaDataCache: Map<number, KonvaStage>;
  
  // Fonction de sauvegarde configurable
  saveFunction: ((updatedKonvaData: KonvaStage) => Promise<void>) | null;
  
  // Clipboard pour copier/coller
  clipboard: KonvaShape[];
}

interface EditorActions {
  // Navigation
  setCurrentSlide: (slideIndex: number) => void;
  changeSlide: (slideIndex: number) => void;
  
  // Sélection
  setSelectedShapes: (shapes: KonvaShape[]) => void;
  addSelectedShape: (shape: KonvaShape) => void;
  removeSelectedShape: (shapeId: string) => void;
  clearSelection: () => void;
  
  // Édition de texte
  setEditingTextId: (textId: string | null) => void;
  setEditingTextShape: (shape: KonvaShape | null) => void;
  
  // États UI
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Canvas
  setStageScale: (scale: number) => void;
  setStagePosition: (position: { x: number; y: number }) => void;
  resetCanvasTransform: () => void;
  
  // Cache
  cacheKonvaData: (slideIndex: number, data: KonvaStage) => void;
  getCachedKonvaData: (slideIndex: number) => KonvaStage | null;
  clearKonvaCache: () => void;
  
  // Utilitaires
  resetEditor: () => void;
  updateSelectedShape: (attrs: Record<string, unknown>) => void;
  
  // Nouvelle action pour sauvegarder les changements de style
  saveShapeChanges: (attrs: Record<string, unknown>) => Promise<void>;
  setSaveFunction: (saveFunction: ((updatedKonvaData: KonvaStage) => Promise<void>) | null) => void;
  
  // Action pour supprimer les shapes sélectionnées
  deleteSelectedShapes: () => Promise<void>;
  
  // Clipboard actions
  copySelectedShapes: () => void;
  pasteShapes: () => Promise<void>;
  
  // Layer management
  updateLayerOrder: (newOrder: string[]) => Promise<void>;
}

// Ajout des types pour l'historique
interface EditorHistoryState {
  past: EditorState[];
  present: EditorState;
  future: EditorState[];
}

interface EditorHistoryActions {
  undo: () => void;
  redo: () => void;
  setPresentState: (newState: Partial<EditorState>) => void;
}

type EditorStore = EditorState & EditorActions;

// ===== ÉTAT INITIAL =====

const initialState: EditorState = {
  currentSlide: 0,
  selectedShapes: [],
  editingTextId: null,
  editingTextShape: null,
  isLoading: false,
  error: null,
  stageScale: 1,
  stagePosition: { x: 0, y: 0 },
  konvaDataCache: new Map(),
  saveFunction: null,
  clipboard: [],
};

// ===== ÉTAT INITIAL HISTORIQUE =====
const initialHistoryState: EditorHistoryState = {
  past: [],
  present: initialState,
  future: [],
};

// ===== STORE PRINCIPAL =====

export const useEditorStore = create<EditorStore & EditorHistoryState & EditorHistoryActions>((set, get) => ({
  ...initialState,
  ...initialHistoryState,
  
  // Historique : setPresentState
  setPresentState: (newState) => {
    const { present, past } = get();
    const updatedPresent = { ...present, ...newState };
    set({
      past: [...past, present],
      present: updatedPresent,
      future: [],
      ...updatedPresent,
    });
  },
  // Historique : undo
  undo: () => {
    const { past, present, future } = get();
    if (past.length === 0) {
      return;
    }
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    set({
      past: newPast,
      present: previous,
      future: [present, ...future],
      ...previous,
    });
  },
  // Historique : redo
  redo: () => {
    const { past, present, future } = get();
    if (future.length === 0) {
      return;
    }
    const next = future[0];
    const newFuture = future.slice(1);
    set({
      past: [...past, present],
      present: next,
      future: newFuture,
      ...next,
    });
  },
  
  // Navigation
  setCurrentSlide: (slideIndex: number) => get().setPresentState({ currentSlide: slideIndex }),
  
  changeSlide: (slideIndex: number) => {
    const state = get();
    get().setPresentState({
      selectedShapes: state.editingTextId ? state.selectedShapes : [],
      currentSlide: slideIndex,
      error: null,
    });
  },
  
  // Sélection
  setSelectedShapes: (shapes: KonvaShape[]) => get().setPresentState({ selectedShapes: shapes }),
  
  addSelectedShape: (shape: KonvaShape) => {
    const state = get();
    const exists = state.selectedShapes.some((s: KonvaShape) => s.attrs?.id === shape.attrs?.id);
    if (!exists) {
      get().setPresentState({ selectedShapes: [...state.selectedShapes, shape] });
    }
  },
  
  removeSelectedShape: (shapeId: string) => {
    const state = get();
    get().setPresentState({
      selectedShapes: state.selectedShapes.filter((shape: KonvaShape) => shape.attrs?.id !== shapeId),
    });
  },
  
  clearSelection: () => get().setPresentState({ selectedShapes: [] }),
  
  // Édition de texte
  setEditingTextId: (textId: string | null) => get().setPresentState({ editingTextId: textId }),
  
  setEditingTextShape: (shape: KonvaShape | null) => get().setPresentState({ editingTextShape: shape }),
  
  // États UI
  setLoading: (loading: boolean) => get().setPresentState({ isLoading: loading }),
  
  setError: (error: string | null) => get().setPresentState({ error }),
  
  // Canvas
  setStageScale: (scale: number) => get().setPresentState({ stageScale: scale }),
  
  setStagePosition: (position: { x: number; y: number }) => get().setPresentState({ stagePosition: position }),
  
  resetCanvasTransform: () => get().setPresentState({ stageScale: 1, stagePosition: { x: 0, y: 0 } }),
  
  // Cache
  cacheKonvaData: (slideIndex: number, data: KonvaStage) => {
    const state = get();
    const newCache = new Map(state.konvaDataCache);
    newCache.set(slideIndex, data);
    get().setPresentState({ konvaDataCache: newCache });
  },
  
  getCachedKonvaData: (slideIndex: number) => {
    const state = get();
    return state.konvaDataCache.get(slideIndex) || null;
  },
  
  clearKonvaCache: () => get().setPresentState({ konvaDataCache: new Map() }),
  
  // Utilitaires
  resetEditor: () => get().setPresentState({ ...initialState, konvaDataCache: new Map() }),
  
  updateSelectedShape: (attrs: Record<string, unknown>) => {
    const state = get();
    get().setPresentState({
      selectedShapes: state.selectedShapes.map((shape: KonvaShape) => ({
        ...shape,
        attrs: { ...shape.attrs, ...attrs } as typeof shape.attrs
      })),
    });
  },
  
  // Nouvelle action pour sauvegarder les changements de style
  saveShapeChanges: async (attrs: Record<string, unknown>) => {
    const state = get();
    if (!state.saveFunction || state.selectedShapes.length === 0) return;
    const currentKonvaData = state.konvaDataCache.get(state.currentSlide);
    if (!currentKonvaData) return;
    const updatedKonvaData = JSON.parse(JSON.stringify(currentKonvaData)) as KonvaStage;
    const updateShapeInNodes = (nodes: any[]): any[] => {
      return nodes.map(node => {
        const isSelected = state.selectedShapes.some(shape => shape.attrs?.id === node.attrs?.id);
        if (isSelected) {
          return { ...node, attrs: { ...node.attrs, ...attrs } };
        }
        if (node.children && Array.isArray(node.children)) {
          return { ...node, children: updateShapeInNodes(node.children) };
        }
        return node;
      });
    };
    if (updatedKonvaData.children && Array.isArray(updatedKonvaData.children)) {
      updatedKonvaData.children = updateShapeInNodes(updatedKonvaData.children);
    }
    // Mettre à jour le cache AVANT la sauvegarde
    const newCache = new Map(state.konvaDataCache);
    newCache.set(state.currentSlide, updatedKonvaData);
    get().setPresentState({ konvaDataCache: newCache });
    await state.saveFunction(updatedKonvaData);
  },

  setSaveFunction: (saveFunction: ((updatedKonvaData: KonvaStage) => Promise<void>) | null) => get().setPresentState({ saveFunction }),

  deleteSelectedShapes: async () => {
    const state = get();
    if (!state.saveFunction || state.selectedShapes.length === 0) return;
    const currentKonvaData = state.konvaDataCache.get(state.currentSlide);
    if (!currentKonvaData) return;
    const updatedKonvaData = JSON.parse(JSON.stringify(currentKonvaData)) as KonvaStage;
    const shapeIdsToDelete = state.selectedShapes.map(shape => shape.attrs?.id).filter(Boolean) as string[];
    const removeShapesFromNodes = (nodes: any[]): any[] => {
      return nodes.filter(node => {
        const shouldDelete = shapeIdsToDelete.includes(node.attrs?.id);
        if (shouldDelete) return false;
        if (node.children && Array.isArray(node.children)) {
          node.children = removeShapesFromNodes(node.children);
        }
        return true;
      });
    };
    if (updatedKonvaData.children && Array.isArray(updatedKonvaData.children)) {
      updatedKonvaData.children = updatedKonvaData.children.map(layer => ({
        ...layer,
        children: removeShapesFromNodes(layer.children || [])
      }));
    }
    // Mettre à jour le cache et vider la sélection
    const newCache = new Map(state.konvaDataCache);
    newCache.set(state.currentSlide, updatedKonvaData);
    get().setPresentState({
      konvaDataCache: newCache,
      selectedShapes: [],
    });
    await state.saveFunction(updatedKonvaData);
  },

  copySelectedShapes: () => {
    const state = get();
    if (state.selectedShapes.length === 0) return;
    const copiedShapes = JSON.parse(JSON.stringify(state.selectedShapes)) as KonvaShape[];
    get().setPresentState({ clipboard: copiedShapes });
    console.log(`📋 Copié ${copiedShapes.length} shape(s)`);
  },

  pasteShapes: async () => {
    const state = get();
    if (state.clipboard.length === 0 || !state.saveFunction) return;
    const currentKonvaData = state.konvaDataCache.get(state.currentSlide);
    if (!currentKonvaData) return;
    const updatedKonvaData = JSON.parse(JSON.stringify(currentKonvaData)) as KonvaStage;
    const pastedShapes = state.clipboard.map((shape, index) => {
      const newId = `shape_${Date.now()}_${index}`;
      const offset = 20;
      return {
        ...shape,
        attrs: {
          ...shape.attrs,
          id: newId,
          x: (shape.attrs.x as number) + offset,
          y: (shape.attrs.y as number) + offset,
        }
      };
    });
    if (updatedKonvaData.children && updatedKonvaData.children.length > 0) {
      const mainLayer = updatedKonvaData.children[0];
      if (mainLayer.children) {
        mainLayer.children.push(...pastedShapes);
      } else {
        mainLayer.children = [...pastedShapes];
      }
    }
    // Mettre à jour le cache et sélectionner les nouvelles shapes
    const newCache = new Map(state.konvaDataCache);
    newCache.set(state.currentSlide, updatedKonvaData);
    get().setPresentState({
      konvaDataCache: newCache,
      selectedShapes: pastedShapes
    });
    await state.saveFunction(updatedKonvaData);
    console.log(`📌 Collé ${pastedShapes.length} shape(s)`);
  },

  updateLayerOrder: async (newOrder: string[]) => {
    const state = get();
    if (!state.saveFunction) return;
    const currentKonvaData = state.konvaDataCache.get(state.currentSlide);
    if (!currentKonvaData) return;
    const updatedKonvaData = JSON.parse(JSON.stringify(currentKonvaData)) as KonvaStage;
    const reorderShapes = (nodes: any[]): any[] => {
      return nodes.map(node => {
        if (node.children && Array.isArray(node.children)) {
          const shapesToReorder = node.children.filter((child: any) => child.attrs?.id && newOrder.includes(child.attrs.id));
          const otherShapes = node.children.filter((child: any) => !child.attrs?.id || !newOrder.includes(child.attrs.id));
          const reorderedShapes = newOrder.reverse().map(id => shapesToReorder.find((shape: any) => shape.attrs.id === id)).filter(Boolean);
          return {
            ...node,
            children: [...otherShapes, ...reorderedShapes]
          };
        }
        return node;
      });
    };
    if (updatedKonvaData.children && Array.isArray(updatedKonvaData.children)) {
      updatedKonvaData.children = reorderShapes(updatedKonvaData.children);
    }
    // Mettre à jour le cache
    const newCache = new Map(state.konvaDataCache);
    newCache.set(state.currentSlide, updatedKonvaData);
    get().setPresentState({ konvaDataCache: newCache });
    await state.saveFunction(updatedKonvaData);
  },
}));

// ===== SÉLECTEURS OPTIMISÉS =====

export const editorSelectors = {
  // Navigation
  currentSlide: (state: EditorStore) => state.currentSlide,
  
  // Sélection
  selectedShapes: (state: EditorStore) => state.selectedShapes,
  hasSelection: (state: EditorStore) => state.selectedShapes.length > 0,
  selectedShapeCount: (state: EditorStore) => state.selectedShapes.length,
  
  // Édition de texte
  isEditingText: (state: EditorStore) => state.editingTextId !== null,
  editingTextId: (state: EditorStore) => state.editingTextId,
  editingTextShape: (state: EditorStore) => state.editingTextShape,
  
  // États UI
  isLoading: (state: EditorStore) => state.isLoading,
  error: (state: EditorStore) => state.error,
  hasError: (state: EditorStore) => state.error !== null,
  
  // Canvas
  stageScale: (state: EditorStore) => state.stageScale,
  stagePosition: (state: EditorStore) => state.stagePosition,
  
  // Cache Konva - NOUVEAU pour la réactivité
  konvaDataCache: (state: EditorStore) => state.konvaDataCache,
  
  // Sélecteurs dérivés avec mémoisation
  selectedShapeIds: (state: EditorStore) => 
    state.selectedShapes.map(shape => shape.attrs?.id).filter(Boolean),
  
  selectedShapesByType: (state: EditorStore) => 
    state.selectedShapes.reduce((acc, shape) => {
      const type = shape.className || 'unknown';
      if (!acc[type]) acc[type] = [];
      acc[type].push(shape);
      return acc;
    }, {} as Record<string, KonvaShape[]>),
};

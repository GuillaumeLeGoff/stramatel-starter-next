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
};

// ===== STORE PRINCIPAL =====

export const useEditorStore = create<EditorStore>((set, get) => ({
  ...initialState,
  
  // Navigation
  setCurrentSlide: (slideIndex: number) => 
    set({ currentSlide: slideIndex }),
  
  changeSlide: (slideIndex: number) => 
    set((state) => ({
      // Réinitialiser la sélection sauf si on édite un texte
      selectedShapes: state.editingTextId ? state.selectedShapes : [],
      currentSlide: slideIndex,
      error: null,
    })),
  
  // Sélection
  setSelectedShapes: (shapes: KonvaShape[]) => 
    set({ selectedShapes: shapes }),
  
  addSelectedShape: (shape: KonvaShape) => 
    set((state) => {
      const exists = state.selectedShapes.some((s: KonvaShape) => s.attrs?.id === shape.attrs?.id);
      if (!exists) {
        return { selectedShapes: [...state.selectedShapes, shape] };
      }
      return state;
    }),
  
  removeSelectedShape: (shapeId: string) => 
    set((state) => ({
      selectedShapes: state.selectedShapes.filter(
        (shape: KonvaShape) => shape.attrs?.id !== shapeId
      ),
    })),
  
  clearSelection: () => 
    set({ selectedShapes: [] }),
  
  // Édition de texte
  setEditingTextId: (textId: string | null) => 
    set({ editingTextId: textId }),
  
  setEditingTextShape: (shape: KonvaShape | null) => 
    set({ editingTextShape: shape }),
  
  // États UI
  setLoading: (loading: boolean) => 
    set({ isLoading: loading }),
  
  setError: (error: string | null) => 
    set({ error }),
  
  // Canvas
  setStageScale: (scale: number) => 
    set({ stageScale: scale }),
  
  setStagePosition: (position: { x: number; y: number }) => 
    set({ stagePosition: position }),
  
  resetCanvasTransform: () => 
    set({ 
      stageScale: 1,
      stagePosition: { x: 0, y: 0 }
    }),
  
  // Cache
  cacheKonvaData: (slideIndex: number, data: KonvaStage) => 
    set((state) => {
      const newCache = new Map(state.konvaDataCache);
      newCache.set(slideIndex, data);
      return { konvaDataCache: newCache };
    }),
  
  getCachedKonvaData: (slideIndex: number) => {
    const state = get();
    return state.konvaDataCache.get(slideIndex) || null;
  },
  
  clearKonvaCache: () => 
    set({ konvaDataCache: new Map() }),
  
  // Utilitaires
  resetEditor: () => 
    set({
      ...initialState,
      konvaDataCache: new Map(),
    }),
  
  updateSelectedShape: (attrs: Record<string, unknown>) => 
    set((state) => ({
      selectedShapes: state.selectedShapes.map((shape: KonvaShape) => ({
        ...shape,
        attrs: { ...shape.attrs, ...attrs } as typeof shape.attrs
      })),
    })),
  
  // Nouvelle action pour sauvegarder les changements de style
  saveShapeChanges: async (attrs: Record<string, unknown>) => {
    const state = get();
    if (!state.saveFunction || state.selectedShapes.length === 0) return;
    
    const currentKonvaData = state.konvaDataCache.get(state.currentSlide);
    if (!currentKonvaData) return;
    
    // Créer une copie profonde des données Konva
    const updatedKonvaData = JSON.parse(JSON.stringify(currentKonvaData)) as KonvaStage;
    
    // Fonction récursive pour mettre à jour les shapes
    const updateShapeInNodes = (nodes: any[]): any[] => {
      return nodes.map(node => {
        // Si c'est une forme sélectionnée, mettre à jour ses attributs
        const isSelected = state.selectedShapes.some(shape => 
          shape.attrs?.id === node.attrs?.id
        );
        
        if (isSelected) {
          return {
            ...node,
            attrs: { ...node.attrs, ...attrs }
          };
        }
        
        // Récursivement mettre à jour les enfants si ils existent
        if (node.children && Array.isArray(node.children)) {
          return {
            ...node,
            children: updateShapeInNodes(node.children)
          };
        }
        
        return node;
      });
    };
    
    // Appliquer les mises à jour aux children du stage
    if (updatedKonvaData.children && Array.isArray(updatedKonvaData.children)) {
      updatedKonvaData.children = updateShapeInNodes(updatedKonvaData.children);
    }
    
    // Sauvegarder via la fonction configurée
    await state.saveFunction(updatedKonvaData);
  },
  
  setSaveFunction: (saveFunction: ((updatedKonvaData: KonvaStage) => Promise<void>) | null) => 
    set({ saveFunction }),
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
  
  // Sélecteurs composés
  canUndo: (state: EditorStore) => false, // À implémenter avec l'historique
  canRedo: (state: EditorStore) => false, // À implémenter avec l'historique
  
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

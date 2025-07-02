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
      
      return { 
        konvaDataCache: newCache,
      };
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
  
  // Action pour supprimer les shapes sélectionnées
  deleteSelectedShapes: async () => {
    const state = get();
    if (!state.saveFunction || state.selectedShapes.length === 0) return;
    
    const currentKonvaData = state.konvaDataCache.get(state.currentSlide);
    if (!currentKonvaData) return;
    
    // Créer une copie profonde des données Konva
    const updatedKonvaData = JSON.parse(JSON.stringify(currentKonvaData)) as KonvaStage;
    
    // IDs des shapes à supprimer
    const shapeIdsToDelete = state.selectedShapes
      .map(shape => shape.attrs?.id)
      .filter(Boolean) as string[];
    
    // Fonction récursive pour supprimer les shapes
    const removeShapesFromNodes = (nodes: any[]): any[] => {
      return nodes.filter(node => {
        // Si c'est une forme à supprimer, l'exclure
        const shouldDelete = shapeIdsToDelete.includes(node.attrs?.id);
        if (shouldDelete) {
          return false;
        }
        
        // Récursivement supprimer des enfants si ils existent
        if (node.children && Array.isArray(node.children)) {
          node.children = removeShapesFromNodes(node.children);
        }
        
        return true;
      });
    };
    
    // Appliquer les suppressions aux children du stage
    if (updatedKonvaData.children && Array.isArray(updatedKonvaData.children)) {
      updatedKonvaData.children = updatedKonvaData.children.map(layer => ({
        ...layer,
        children: removeShapesFromNodes(layer.children || [])
      }));
    }
    
    // Mettre à jour le cache
    set((prevState) => {
      const newCache = new Map(prevState.konvaDataCache);
      newCache.set(prevState.currentSlide, updatedKonvaData);
      return { 
        konvaDataCache: newCache,
        selectedShapes: [], // Vider la sélection après suppression
      };
    });
    
    // Sauvegarder via la fonction configurée
    await state.saveFunction(updatedKonvaData);
  },
  
  // Clipboard actions
  copySelectedShapes: () => {
    const state = get();
    if (state.selectedShapes.length === 0) return;
    
    // Copier les shapes sélectionnées dans le clipboard
    const copiedShapes = JSON.parse(JSON.stringify(state.selectedShapes)) as KonvaShape[];
    set({ clipboard: copiedShapes });
    console.log(`📋 Copié ${copiedShapes.length} shape(s)`);
  },
  
  pasteShapes: async () => {
    const state = get();
    if (state.clipboard.length === 0 || !state.saveFunction) return;
    
    const currentKonvaData = state.konvaDataCache.get(state.currentSlide);
    if (!currentKonvaData) return;
    
    // Créer une copie profonde des données Konva
    const updatedKonvaData = JSON.parse(JSON.stringify(currentKonvaData)) as KonvaStage;
    
    // Générer de nouveaux IDs et décaler les positions pour les shapes collées
    const pastedShapes = state.clipboard.map((shape, index) => {
      const newId = `shape_${Date.now()}_${index}`;
      const offset = 20; // Décalage pour éviter la superposition
      
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
    
    // Ajouter les nouvelles shapes au layer principal (premier layer)
    if (updatedKonvaData.children && updatedKonvaData.children.length > 0) {
      const mainLayer = updatedKonvaData.children[0];
      if (mainLayer.children) {
        mainLayer.children.push(...pastedShapes);
      } else {
        mainLayer.children = [...pastedShapes];
      }
    }
    
    // Mettre à jour le cache et sélectionner les nouvelles shapes
    set((prevState) => {
      const newCache = new Map(prevState.konvaDataCache);
      newCache.set(prevState.currentSlide, updatedKonvaData);
      return { 
        konvaDataCache: newCache,
        selectedShapes: pastedShapes // Sélectionner les shapes collées
      };
    });
    
    // Sauvegarder via la fonction configurée
    await state.saveFunction(updatedKonvaData);
    console.log(`📌 Collé ${pastedShapes.length} shape(s)`);
  },
  
  // Layer management
  updateLayerOrder: async (newOrder: string[]) => {
    const state = get();
    if (!state.saveFunction) return;
    
    const currentKonvaData = state.konvaDataCache.get(state.currentSlide);
    if (!currentKonvaData) return;
    
    // Créer une copie profonde des données Konva
    const updatedKonvaData = JSON.parse(JSON.stringify(currentKonvaData)) as KonvaStage;
    
    // Fonction pour réorganiser les shapes dans le layer principal
    const reorderShapes = (nodes: any[]): any[] => {
      return nodes.map(node => {
        if (node.children && Array.isArray(node.children)) {
          // Extraire les shapes qui sont dans le newOrder
          const shapesToReorder = node.children.filter((child: any) => 
            child.attrs?.id && newOrder.includes(child.attrs.id)
          );
          
          // Extraire les autres shapes (qui ne sont pas dans newOrder)
          const otherShapes = node.children.filter((child: any) => 
            !child.attrs?.id || !newOrder.includes(child.attrs.id)
          );
          
          // Créer un nouveau tableau ordonné
          const reorderedShapes = newOrder
            .reverse() // Inverser car le dernier dans la liste doit être au-dessus
            .map(id => shapesToReorder.find((shape: any) => shape.attrs.id === id))
            .filter(Boolean);
          
          return {
            ...node,
            children: [...otherShapes, ...reorderedShapes]
          };
        }
        
        return node;
      });
    };
    
    // Appliquer les mises à jour aux children du stage
    if (updatedKonvaData.children && Array.isArray(updatedKonvaData.children)) {
      updatedKonvaData.children = reorderShapes(updatedKonvaData.children);
    }
    
    // Mettre à jour le cache
    set((prevState) => {
      const newCache = new Map(prevState.konvaDataCache);
      newCache.set(prevState.currentSlide, updatedKonvaData);
      return { konvaDataCache: newCache };
    });
    
    // Sauvegarder via la fonction configurée
    await state.saveFunction(updatedKonvaData);
    console.log('🔄 Ordre des calques mis à jour');
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

import { useCallback, useMemo } from "react";
import { useEditorStore, editorSelectors } from "../../store/editorStore";
import { KonvaShape } from "../../types";

export function useShapeEditor() {
  // ===== SÉLECTEURS OPTIMISÉS =====
  
  const selectedShapes = useEditorStore(editorSelectors.selectedShapes);
  const hasSelection = useEditorStore(editorSelectors.hasSelection);
  const selectedShapeCount = useEditorStore(editorSelectors.selectedShapeCount);
  const editingTextId = useEditorStore(editorSelectors.editingTextId);
  const isEditingText = useEditorStore(editorSelectors.isEditingText);
  
  // ===== ACTIONS DU STORE =====
  
  const {
    setSelectedShapes,
    addSelectedShape,
    removeSelectedShape,
    clearSelection,
    setEditingTextId,
    setEditingTextShape,
    updateSelectedShape: storeUpdateSelectedShape,
  } = useEditorStore();

  // ===== LOGIQUE MÉTIER POUR LES FORMES =====

  // Vérifier si une forme peut avoir un remplissage
  const hasFill = useMemo(() => {
    if (!hasSelection) return false;
    
    return selectedShapes.some(shape => {
      const shapeType = shape.className?.toLowerCase();
      
      // ✅ Triangles : Line avec closed=true et 6 points
      if (shapeType === 'line' && 
          shape.attrs?.closed === true && 
          shape.attrs?.points && 
          (shape.attrs.points as number[]).length === 6) {
        return true;
      }
      
      return shapeType === 'rect' || 
             shapeType === 'circle' || 
             shapeType === 'ellipse' || 
             shapeType === 'polygon' ||
             shapeType === 'path';
    });
  }, [selectedShapes, hasSelection]);

  // Vérifier si une forme peut avoir un contour
  const hasStroke = useMemo(() => {
    if (!hasSelection) return false;
    
    return selectedShapes.some(shape => {
      const shapeType = shape.className?.toLowerCase();
      return shapeType === 'rect' || 
             shapeType === 'circle' || 
             shapeType === 'ellipse' || 
             shapeType === 'line' ||
             shapeType === 'polygon' ||
             shapeType === 'path';
    });
  }, [selectedShapes, hasSelection]);

  // Vérifier si les formes sélectionnées sont du texte
  const isTextSelection = useMemo(() => {
    if (!hasSelection) return false;
    
    return selectedShapes.every(shape => {
      const shapeType = shape.className?.toLowerCase();
      return shapeType === 'text' || shapeType === 'textnode';
    });
  }, [selectedShapes, hasSelection]);

  // Obtenir les propriétés communes des formes sélectionnées
  const commonProperties = useMemo(() => {
    if (!hasSelection) return {};
    
    const firstShape = selectedShapes[0];
    if (!firstShape?.attrs) return {};
    
    const common: Record<string, any> = {};
    
         // Pour chaque propriété de la première forme
     Object.keys(firstShape.attrs).forEach(key => {
       const value = (firstShape.attrs as any)[key];
       
       // Vérifier si toutes les autres formes ont la même valeur
       const isCommon = selectedShapes.every(shape => 
         shape.attrs && (shape.attrs as any)[key] === value
       );
       
       if (isCommon) {
         common[key] = value;
       }
     });
    
    return common;
  }, [selectedShapes, hasSelection]);

  // ===== ACTIONS OPTIMISÉES =====

  // Sélectionner une forme
  const selectShape = useCallback((shape: KonvaShape) => {
    setSelectedShapes([shape]);
  }, [setSelectedShapes]);

  // Sélectionner plusieurs formes
  const selectShapes = useCallback((shapes: KonvaShape[]) => {
    setSelectedShapes(shapes);
  }, [setSelectedShapes]);

  // Ajouter une forme à la sélection
  const addToSelection = useCallback((shape: KonvaShape) => {
    addSelectedShape(shape);
  }, [addSelectedShape]);

  // Retirer une forme de la sélection
  const removeFromSelection = useCallback((shapeId: string) => {
    removeSelectedShape(shapeId);
  }, [removeSelectedShape]);

  // Basculer la sélection d'une forme
  const toggleShapeSelection = useCallback((shape: KonvaShape) => {
    const shapeId = shape.attrs?.id;
    if (!shapeId) return;

         const isSelected = selectedShapes.some(s => s.attrs?.id === shapeId);
     
     if (isSelected) {
       removeFromSelection(shapeId as string);
     } else {
       addToSelection(shape);
     }
  }, [selectedShapes, addToSelection, removeFromSelection]);

  // Mettre à jour les propriétés des formes sélectionnées
  const updateProperties = useCallback((attrs: Record<string, unknown>) => {
    if (!hasSelection) return;
    storeUpdateSelectedShape(attrs);
  }, [hasSelection, storeUpdateSelectedShape]);

  // Changer la couleur de remplissage
  const setFillColor = useCallback((color: string) => {
    if (!hasFill) return;
    updateProperties({ fill: color });
  }, [hasFill, updateProperties]);

  // Changer la couleur de contour
  const setStrokeColor = useCallback((color: string) => {
    if (!hasStroke) return;
    updateProperties({ stroke: color });
  }, [hasStroke, updateProperties]);

  // Changer l'épaisseur du contour
  const setStrokeWidth = useCallback((width: number) => {
    if (!hasStroke) return;
    updateProperties({ strokeWidth: width });
  }, [hasStroke, updateProperties]);

  // Changer la taille de police (pour le texte)
  const setFontSize = useCallback((size: number) => {
    if (!isTextSelection) return;
    updateProperties({ fontSize: size });
  }, [isTextSelection, updateProperties]);

  // Changer la couleur du texte
  const setTextColor = useCallback((color: string) => {
    if (!isTextSelection) return;
    updateProperties({ fill: color });
  }, [isTextSelection, updateProperties]);

  // Mettre en gras
  const setBold = useCallback((bold: boolean) => {
    if (!isTextSelection) return;
    const fontStyle = bold ? 'bold' : 'normal';
    updateProperties({ fontStyle });
  }, [isTextSelection, updateProperties]);

  // Mettre en italique
  const setItalic = useCallback((italic: boolean) => {
    if (!isTextSelection) return;
    const fontStyle = italic ? 'italic' : 'normal';
    updateProperties({ fontStyle });
  }, [isTextSelection, updateProperties]);

  // Aligner le texte
  const setTextAlign = useCallback((align: 'left' | 'center' | 'right') => {
    if (!isTextSelection) return;
    updateProperties({ align });
  }, [isTextSelection, updateProperties]);

     // Commencer l'édition de texte
   const startTextEditing = useCallback((shape: KonvaShape) => {
     if (!shape.attrs?.id) return;
     
     setEditingTextId(String(shape.attrs.id));
     setEditingTextShape(shape);
     selectShape(shape);
   }, [setEditingTextId, setEditingTextShape, selectShape]);

  // Arrêter l'édition de texte
  const stopTextEditing = useCallback(() => {
    setEditingTextId(null);
    setEditingTextShape(null);
  }, [setEditingTextId, setEditingTextShape]);

  // ===== INFORMATIONS SUR LA SÉLECTION =====

  const selectionInfo = useMemo(() => ({
    count: selectedShapeCount,
    hasSelection,
    hasFill,
    hasStroke,
    isTextSelection,
    isEditingText,
    types: selectedShapes.reduce((acc, shape) => {
      const type = shape.className || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    commonProperties,
  }), [
    selectedShapeCount, 
    hasSelection, 
    hasFill, 
    hasStroke, 
    isTextSelection, 
    isEditingText, 
    selectedShapes, 
    commonProperties
  ]);

  return {
    // État de la sélection
    selectedShapes,
    hasSelection,
    selectedShapeCount,
    editingTextId,
    isEditingText,
    
    // Propriétés des formes
    hasFill,
    hasStroke,
    isTextSelection,
    commonProperties,
    selectionInfo,
    
    // Actions de sélection
    selectShape,
    selectShapes,
    addToSelection,
    removeFromSelection,
    toggleShapeSelection,
    clearSelection,
    
    // Actions de modification
    updateProperties,
    setFillColor,
    setStrokeColor,
    setStrokeWidth,
    setFontSize,
    setTextColor,
    setBold,
    setItalic,
    setTextAlign,
    
    // Actions d'édition de texte
    startTextEditing,
    stopTextEditing,
  };
} 
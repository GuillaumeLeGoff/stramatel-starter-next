import { useCallback, useMemo } from "react";
import { useEditorStore, editorSelectors } from "../../store/editorStore";
import { KonvaShape } from "../../types";

/**
 * Hook optimisé spécialement pour les composants Header
 * Utilise des sélecteurs granulaires pour minimiser les re-renders
 */
export function useHeaderShapeEditor() {
  // ===== SÉLECTEURS ULTRA-OPTIMISÉS =====
  
  // Sélecteurs spécialisés avec mémoisation fine
  const selectedShapes = useEditorStore(editorSelectors.selectedShapes);
  const hasSelection = useEditorStore(editorSelectors.hasSelection);
  const isEditingText = useEditorStore(editorSelectors.isEditingText);
  const editingTextId = useEditorStore(editorSelectors.editingTextId);
  const currentSlide = useEditorStore(editorSelectors.currentSlide);
  
  // Actions du store (stables)
  const updateSelectedShape = useEditorStore((state) => state.updateSelectedShape);
  const saveShapeChanges = useEditorStore((state) => state.saveShapeChanges);
  const cacheKonvaData = useEditorStore((state) => state.cacheKonvaData);
  const getCachedKonvaData = useEditorStore((state) => state.getCachedKonvaData);

  // ===== LOGIQUE MÉTIER ULTRA-OPTIMISÉE =====

  // Type de forme sélectionnée avec mémoisation profonde
  const shapeTypeInfo = useMemo(() => {
    if (!hasSelection || selectedShapes.length === 0) {
      return {
        isRectangle: false,
        isCircle: false,
        isText: false,
        isData: false,
        hasMultipleTypes: false,
        primaryType: null
      };
    }

    const types = new Set(selectedShapes.map(shape => shape.className?.toLowerCase()));
    const typeArray = Array.from(types);
    
    return {
      isRectangle: typeArray.includes('rect'),
      isCircle: typeArray.includes('circle'),
      isText: typeArray.includes('text') || typeArray.includes('textnode'),
      isData: typeArray.some(type => type?.startsWith('live') || type?.includes('data')),
      hasMultipleTypes: types.size > 1,
      primaryType: typeArray[0] || null
    };
  }, [hasSelection, selectedShapes]);

  // Propriétés communes avec cache optimisé
  const commonStyles = useMemo(() => {
    if (!hasSelection || selectedShapes.length === 0) {
      return {
        fill: '#000000',
        stroke: '#000000',
        strokeWidth: 1,
        fontSize: 16,
        fontFamily: 'Arial',
        fontStyle: 'normal',
        align: 'left'
      };
    }

    const firstShape = selectedShapes[0];
    if (!firstShape?.attrs) return {};

    const attrs = firstShape.attrs as any;
    
    return {
      fill: attrs.fill || '#000000',
      stroke: attrs.stroke || '#000000',
      strokeWidth: attrs.strokeWidth || 1,
      fontSize: attrs.fontSize || 16,
      fontFamily: attrs.fontFamily || 'Arial',
      fontStyle: attrs.fontStyle || 'normal',
      align: attrs.align || 'left'
    };
  }, [hasSelection, selectedShapes]);

  // États dérivés avec mémoisation ultra-fine
  const styleFlags = useMemo(() => ({
    hasFill: hasSelection && (shapeTypeInfo.isRectangle || shapeTypeInfo.isCircle),
    hasStroke: hasSelection && !shapeTypeInfo.isText,
    canEditText: hasSelection && (shapeTypeInfo.isText || shapeTypeInfo.isData),
    isBold: commonStyles.fontStyle?.includes('bold') || false,
    isItalic: commonStyles.fontStyle?.includes('italic') || false,
  }), [hasSelection, shapeTypeInfo, commonStyles.fontStyle]);

  // ===== ACTIONS ULTRA-OPTIMISÉES =====

  // Actions de style avec callbacks mémorisés et sauvegarde immédiate
  const updateStyle = useCallback(async (attrs: Record<string, unknown>) => {
    if (!hasSelection || selectedShapes.length === 0) return;
    
    // 1. Mettre à jour le store local pour un feedback immédiat
    updateSelectedShape(attrs);
    
    // 2. Mettre à jour immédiatement le cache Konva pour la synchronisation
    const currentKonvaData = getCachedKonvaData(currentSlide);
    if (currentKonvaData) {
      // Créer une copie profonde des données Konva
      const updatedKonvaData = JSON.parse(JSON.stringify(currentKonvaData));
      
      // Fonction récursive pour mettre à jour les shapes
      const updateShapeInNodes = (nodes: any[]): any[] => {
        return nodes.map(node => {
          // Si c'est une forme sélectionnée, mettre à jour ses attributs
          const isSelected = selectedShapes.some(shape => 
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
      
      // Mettre à jour le cache immédiatement
      cacheKonvaData(currentSlide, updatedKonvaData);
    }
    
    // 3. Sauvegarder les changements via l'API (en arrière-plan)
    try {
      await saveShapeChanges(attrs);
      console.log('Style sauvegardé avec succès:', attrs);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du style:', error);
    }
  }, [hasSelection, selectedShapes, updateSelectedShape, saveShapeChanges, getCachedKonvaData, cacheKonvaData, currentSlide]);

  const setFillColor = useCallback((color: string) => {
    if (!styleFlags.hasFill) return;
    updateStyle({ fill: color });
  }, [styleFlags.hasFill, updateStyle]);

  const setStrokeColor = useCallback((color: string) => {
    if (!styleFlags.hasStroke) return;
    updateStyle({ stroke: color });
  }, [styleFlags.hasStroke, updateStyle]);

  const setStrokeWidth = useCallback((width: number) => {
    if (!styleFlags.hasStroke) return;
    updateStyle({ strokeWidth: width });
  }, [styleFlags.hasStroke, updateStyle]);

  const setFontSize = useCallback((size: number) => {
    if (!styleFlags.canEditText) return;
    updateStyle({ fontSize: size });
  }, [styleFlags.canEditText, updateStyle]);

  const toggleBold = useCallback(() => {
    if (!styleFlags.canEditText) return;
    
    let newFontStyle = commonStyles.fontStyle || 'normal';
    if (styleFlags.isBold) {
      newFontStyle = newFontStyle.replace('bold', '').trim() || 'normal';
    } else {
      newFontStyle = `${newFontStyle} bold`.trim();
    }
    updateStyle({ fontStyle: newFontStyle });
  }, [styleFlags.canEditText, styleFlags.isBold, commonStyles.fontStyle, updateStyle]);

  const toggleItalic = useCallback(() => {
    if (!styleFlags.canEditText) return;
    
    let newFontStyle = commonStyles.fontStyle || 'normal';
    if (styleFlags.isItalic) {
      newFontStyle = newFontStyle.replace('italic', '').trim() || 'normal';
    } else {
      newFontStyle = `${newFontStyle} italic`.trim();
    }
    updateStyle({ fontStyle: newFontStyle });
  }, [styleFlags.canEditText, styleFlags.isItalic, commonStyles.fontStyle, updateStyle]);

  const setTextAlign = useCallback((align: 'left' | 'center' | 'right') => {
    if (!styleFlags.canEditText) return;
    updateStyle({ align });
  }, [styleFlags.canEditText, updateStyle]);

  const setTextColor = useCallback((color: string) => {
    if (!styleFlags.canEditText) return;
    updateStyle({ fill: color });
  }, [styleFlags.canEditText, updateStyle]);

  // ===== DONNÉES POUR LE HEADER =====

  // Objet optimisé pour le rendu du header
  const headerData = useMemo(() => ({
    // État de base
    hasSelection,
    isEditingText,
    
    // Types de forme
    ...shapeTypeInfo,
    
    // Flags de style
    ...styleFlags,
    
    // Styles actuels
    currentFillColor: commonStyles.fill,
    currentStrokeColor: commonStyles.stroke,
    currentStrokeWidth: commonStyles.strokeWidth,
    currentFontSize: commonStyles.fontSize,
    currentAlign: commonStyles.align,
    
    // Actions
    setFillColor,
    setStrokeColor,
    setStrokeWidth,
    setFontSize,
    setTextColor,
    toggleBold,
    toggleItalic,
    setTextAlign,
  }), [
    hasSelection,
    isEditingText,
    shapeTypeInfo,
    styleFlags,
    commonStyles,
    setFillColor,
    setStrokeColor,
    setStrokeWidth,
    setFontSize,
    setTextColor,
    toggleBold,
    toggleItalic,
    setTextAlign,
  ]);

  return headerData;
} 
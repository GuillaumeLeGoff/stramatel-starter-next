import { useEffect, useCallback } from "react";
import { useEditorStore, editorSelectors } from "../../store/editorStore";

/**
 * Hook pour gérer les raccourcis clavier de l'éditeur
 */
export function useEditorKeyboardShortcuts() {
  // Sélecteurs optimisés
  const hasSelection = useEditorStore(editorSelectors.hasSelection);
  const isEditingText = useEditorStore(editorSelectors.isEditingText);
  const clipboardLength = useEditorStore((state) => state.clipboard.length);
  
  // Actions du store - Ces fonctions sont stables dans Zustand
  const deleteSelectedShapes = useEditorStore((state) => state.deleteSelectedShapes);
  const clearSelection = useEditorStore((state) => state.clearSelection);
  const copySelectedShapes = useEditorStore((state) => state.copySelectedShapes);
  const pasteShapes = useEditorStore((state) => state.pasteShapes);

  // ✅ SOLUTION: Memoiser la fonction pour éviter les re-créations
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignorer si on édite du texte
    if (isEditingText) return;
    
    // Ignorer si on tape dans un input/textarea
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      return;
    }

    switch (e.key) {
      case 'Delete':
      case 'Backspace':
        if (hasSelection) {
          e.preventDefault();
          deleteSelectedShapes();
        }
        break;
        
      case 'Escape':
        if (hasSelection) {
          e.preventDefault();
          clearSelection();
        }
        break;
        
      case 'c':
        if ((e.ctrlKey || e.metaKey) && hasSelection) {
          e.preventDefault();
          copySelectedShapes();
        }
        break;
        
      case 'v':
        if ((e.ctrlKey || e.metaKey) && clipboardLength > 0) {
          e.preventDefault();
          pasteShapes();
        }
        break;
        
      default:
        break;
    }
  }, [
    // ✅ Dépendances stables: ces valeurs sont primitives ou fonctions stables de Zustand
    isEditingText,
    hasSelection,
    clipboardLength,
    deleteSelectedShapes,
    clearSelection,
    copySelectedShapes,
    pasteShapes
  ]);

  // ✅ useEffect optimisé avec fonction memoized
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]); // ✅ Dépendance stable grâce à useCallback

  // Retourner les infos utiles pour debug si nécessaire
  return {
    hasSelection,
    isEditingText,
    clipboardLength,
  };
} 
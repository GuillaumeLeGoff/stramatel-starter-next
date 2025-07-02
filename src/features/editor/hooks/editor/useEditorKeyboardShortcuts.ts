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
  
  // Actions du store
  const deleteSelectedShapes = useEditorStore((state) => state.deleteSelectedShapes);
  const clearSelection = useEditorStore((state) => state.clearSelection);
  const copySelectedShapes = useEditorStore((state) => state.copySelectedShapes);
  const pasteShapes = useEditorStore((state) => state.pasteShapes);

  // Gestionnaire des raccourcis clavier
  const handleKeyDown = useCallback(async (event: KeyboardEvent) => {
    // Ne pas déclencher de raccourcis si on édite du texte
    if (isEditingText) return;
    
    // Ne pas déclencher si on est dans un input/textarea
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      return;
    }

    // Vérifier si Ctrl ou Cmd (Mac) est pressé
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;

    switch (event.key) {
      case 'Delete':
      case 'Backspace':
        if (hasSelection) {
          event.preventDefault();
          try {
            await deleteSelectedShapes();
            console.log('🗑️ Shapes supprimées avec la touche:', event.key);
          } catch (error) {
            console.error('Erreur lors de la suppression avec la touche:', error);
          }
        }
        break;
      
      case 'c':
      case 'C':
        if (isCtrlOrCmd && hasSelection) {
          event.preventDefault();
          copySelectedShapes();
          console.log('📋 Copier: Ctrl+C');
        }
        break;
      
      case 'v':
      case 'V':
        if (isCtrlOrCmd && clipboardLength > 0) {
          event.preventDefault();
          try {
            await pasteShapes();
            console.log('📌 Coller: Ctrl+V');
          } catch (error) {
            console.error('Erreur lors du collage:', error);
          }
        }
        break;
      
      case 'Escape':
        // Désélectionner toutes les shapes
        event.preventDefault();
        clearSelection();
        console.log('❌ Désélection: Escape');
        break;
    }
  }, [
    hasSelection, 
    isEditingText, 
    clipboardLength,
    deleteSelectedShapes, 
    clearSelection,
    copySelectedShapes,
    pasteShapes,
  ]);

  // Écouter les événements clavier
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Retourner les infos utiles pour debug si nécessaire
  return {
    hasSelection,
    isEditingText,
    clipboardLength,
  };
} 
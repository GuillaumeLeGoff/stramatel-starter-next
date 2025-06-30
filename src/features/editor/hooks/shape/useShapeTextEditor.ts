import { useState, useCallback } from "react";
import { slideStore } from "../../store/slideStore";
import { KonvaShape } from "../../types";
import Konva from "konva";

interface UseTextEditorProps {
  shapeRefs: Record<string, Konva.Node>;
  getAllShapes: () => KonvaShape[];
  saveChanges: (data: {
    nodeId: string;
    attrs: Record<string, unknown>;
  }) => Promise<void>;
}

export function useShapeTextEditor({
  shapeRefs,
  getAllShapes,
  saveChanges,
}: UseTextEditorProps) {
  const [editingTextContent, setEditingTextContent] = useState<string>("");
  const {
    selectedShapes,
    editingTextId,
    editingTextShape,
    setEditingTextId,
    setEditingTextShape,
  } = slideStore();

  // Démarrer l'édition d'un texte
  const startTextEditing = useCallback(
    (shapeId: string) => {
      const node = shapeRefs[shapeId] as Konva.Text;
      if (node && node.text) {
        setEditingTextContent(node.text());
      }

      // Trouver la forme correspondante
      const shape = getAllShapes().find((s) => s.attrs.id === shapeId);

      setEditingTextId(shapeId);
      setEditingTextShape(shape || null);
    },
    [shapeRefs, getAllShapes, setEditingTextId, setEditingTextShape]
  );

  // Arrêter l'édition
  const stopTextEditing = useCallback(() => {
    setEditingTextId(null);
    setEditingTextShape(null);
  }, [setEditingTextId, setEditingTextShape]);

  // Gérer le clic sur le stage pour fermer l'édition
  const handleStageClickForTextEditor = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Si on est en train d'éditer et que le clic n'est pas sur un élément de texte
      if (editingTextId && e.target === e.target.getStage()) {
        stopTextEditing();
      }
    },
    [editingTextId, stopTextEditing]
  );

  // Gérer le double-clic sur un texte
  const handleTextDoubleClick = useCallback(
    (shapeId: string) => {
      // Chercher d'abord dans les formes sélectionnées
      let shape = selectedShapes.find((s) => s.attrs.id === shapeId);

      // Si pas trouvé dans la sélection, chercher dans toutes les formes
      if (!shape) {
        shape = getAllShapes().find((s) => s.attrs.id === shapeId);
      }

      if (shape && shape.className === "Text") {
        startTextEditing(shapeId);
      }
    },
    [selectedShapes, getAllShapes, startTextEditing]
  );

  // Mettre à jour le texte pendant l'édition (sans sauvegarder)
  const updateTextContentDuringEdit = useCallback(
    (newText: string) => {
      setEditingTextContent(newText);
      if (editingTextId) {
        const node = shapeRefs[editingTextId] as Konva.Text;
        if (node && node.text) {
          node.text(newText);
          node.getLayer()?.batchDraw();
        }
      }
    },
    [editingTextId, shapeRefs]
  );

  // Finaliser l'édition et sauvegarder
  const finalizeTextEdit = useCallback(
    async (newText: string) => {
      if (editingTextId) {
        const node = shapeRefs[editingTextId] as Konva.Text;
        if (node && node.text) {
          // Mettre à jour visuellement
          node.text(newText);
          node.getLayer()?.batchDraw();

          // Sauvegarder dans les données
          await saveChanges({
            nodeId: editingTextId,
            attrs: { text: newText },
          });
        }
      }
    },
    [editingTextId, shapeRefs, saveChanges]
  );

  // Obtenir le nœud de texte en cours d'édition
  const getEditingTextNode = useCallback(() => {
    if (!editingTextId) return null;
    return shapeRefs[editingTextId] || null;
  }, [editingTextId, shapeRefs]);

  return {
    editingTextId,
    editingTextContent,
    startTextEditing,
    stopTextEditing,
    handleTextDoubleClick,
    updateTextContentDuringEdit,
    finalizeTextEdit,
    getEditingTextNode,
    handleStageClickForTextEditor,
    isEditing: editingTextId !== null,
  };
}

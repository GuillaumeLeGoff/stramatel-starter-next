import { useCallback, useState, useEffect } from "react";
import { useEditorStore } from "../store/editorStore";
import { useDiaporama } from "./useDiaporama";
import { KonvaData, DiaporamaSlide } from "../types";

interface KonvaElement {
  id: string;
  type: string;
  attrs: Record<string, unknown>;
}

// Interface pour le retour du hook
interface KonvaEditorReturn {
  elements: KonvaElement[];
  selectedElementId: string | null;
  isSaving: boolean;
  addElement: (type: string, attrs: Record<string, unknown>) => string;
  updateElement: (id: string, attrs: Record<string, unknown>) => void;
  deleteElement: (id: string) => void;
  selectElement: (elementId: string | null) => void;
  saveChanges: () => Promise<DiaporamaSlide | null>;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function useKonvaEditor(slideId: number): KonvaEditorReturn {
  const { currentDiaporama, updateSlide } = useDiaporama();
  const { selectedElementId, selectElement } = useEditorStore();

  const [elements, setElements] = useState<KonvaElement[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isSaving, setIsSaving] = useState(false);

  // Flag pour savoir si l'ID de slide est valide
  const isValidSlideId = slideId > 0;

  // Trouver la slide sélectionnée
  const currentSlide = isValidSlideId
    ? currentDiaporama?.slides.find((slide) => slide.id === slideId)
    : undefined;

  // Charger les éléments de la slide actuelle
  useEffect(() => {
    if (!isValidSlideId || !currentSlide) {
      // Réinitialiser l'état si le slideId n'est pas valide ou si la slide n'existe pas
      setElements([]);
      setHistory(["[]"]);
      setHistoryIndex(0);
      return;
    }

    try {
      // Utiliser la propriété konvaData du schéma mis à jour
      const konvaData = currentSlide.konvaData;

      if (!konvaData) {
        // Initialiser avec un tableau vide si aucune donnée n'existe
        setElements([]);
        setHistory(["[]"]);
        setHistoryIndex(0);
        return;
      }

      // Extraire les éléments de la structure Konva
      const extractedElements: KonvaElement[] = [];

      if (konvaData.children && konvaData.children.length > 0) {
        const layer = konvaData.children[0]; // Prendre le premier layer

        if (layer.children && Array.isArray(layer.children)) {
          layer.children.forEach((child, index) => {
            extractedElements.push({
              id: (child.attrs?.id as string) || `element-${index}`,
              type: child.className || "Shape",
              attrs: child.attrs || {},
            });
          });
        }
      }

      setElements(extractedElements);

      // Initialiser l'historique
      setHistory([JSON.stringify(extractedElements)]);
      setHistoryIndex(0);
    } catch (error) {
      console.error("Erreur lors du chargement des éléments Konva:", error);
    }
  }, [currentSlide, isValidSlideId]);

  // Sauvegarder les modifications de la slide
  const saveChanges = useCallback(async () => {
    if (!isValidSlideId || !currentSlide || isSaving) {
      return null;
    }

    try {
      setIsSaving(true);

      // Construire la structure Konva complète
      const konvaData: KonvaData = {
        attrs: {
          width: currentSlide.width || 1920,
          height: currentSlide.height || 1080,
        },
        className: "Stage",
        children: [
          {
            attrs: {},
            className: "Layer",
            children: elements.map((element) => ({
              attrs: element.attrs,
              className: element.type,
            })),
          },
        ],
      };

      // Mettre à jour la slide
      const result = await updateSlide(currentSlide.id, {
        konvaData,
      });

      return result;
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des modifications:", error);
      throw error; // Propager l'erreur pour une meilleure gestion par l'appelant
    } finally {
      setIsSaving(false);
    }
  }, [currentSlide, elements, isSaving, updateSlide, isValidSlideId]);

  // Ajouter un élément
  const addElement = useCallback(
    (type: string, attrs: Record<string, unknown>) => {
      if (!isValidSlideId) {
        return "";
      }

      const elementId = `element-${Date.now()}`;

      const newElement: KonvaElement = {
        id: elementId,
        type,
        attrs: {
          ...attrs,
          id: elementId,
        },
      };

      const newElements = [...elements, newElement];
      setElements(newElements);

      // Mettre à jour l'historique
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(JSON.stringify(newElements));
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);

      // Sélectionner le nouvel élément
      selectElement(newElement.id);

      return newElement.id;
    },
    [elements, history, historyIndex, selectElement, isValidSlideId]
  );

  // Mettre à jour un élément
  const updateElement = useCallback(
    (id: string, attrs: Record<string, unknown>) => {
      if (!isValidSlideId) return;

      const elementIndex = elements.findIndex((el) => el.id === id);
      if (elementIndex === -1) return;

      const updatedElements = [...elements];
      updatedElements[elementIndex] = {
        ...updatedElements[elementIndex],
        attrs: {
          ...updatedElements[elementIndex].attrs,
          ...attrs,
        },
      };

      setElements(updatedElements);

      // Mettre à jour l'historique
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(JSON.stringify(updatedElements));
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    },
    [elements, history, historyIndex, isValidSlideId]
  );

  // Supprimer un élément
  const deleteElement = useCallback(
    (id: string) => {
      if (!isValidSlideId) return;

      const newElements = elements.filter((el) => el.id !== id);
      setElements(newElements);

      // Mettre à jour l'historique
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(JSON.stringify(newElements));
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);

      // Désélectionner l'élément
      if (selectedElementId === id) {
        selectElement(null);
      }
    },
    [
      elements,
      history,
      historyIndex,
      selectedElementId,
      selectElement,
      isValidSlideId,
    ]
  );

  // Annuler (undo)
  const undo = useCallback(() => {
    if (!isValidSlideId || historyIndex <= 0) return;

    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    setElements(JSON.parse(history[newIndex]));
  }, [history, historyIndex, isValidSlideId]);

  // Refaire (redo)
  const redo = useCallback(() => {
    if (!isValidSlideId || historyIndex >= history.length - 1) return;

    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    setElements(JSON.parse(history[newIndex]));
  }, [history, historyIndex, isValidSlideId]);

  return {
    elements,
    selectedElementId,
    isSaving,
    addElement,
    updateElement,
    deleteElement,
    selectElement,
    saveChanges,
    undo,
    redo,
    canUndo: isValidSlideId && historyIndex > 0,
    canRedo: isValidSlideId && historyIndex < history.length - 1,
  };
}

"use client";

import { useState, useCallback, useEffect } from "react";
import { EditorSlide } from "../types";
import { toast } from "sonner";

// Import depuis la feature slideshow pour accéder à l'API
import { useSlideshow } from "@/features/slideshow/hooks";

// Hook pour gérer l'état et les opérations de l'éditeur Konva
export function useKonvaEditor(slideId: number, slideshowId?: number) {
  // États locaux de l'éditeur
  const [elements, setElements] = useState<Array<{
    id: string;
    type: string;
    attrs: Record<string, unknown>;
  }>>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [history, setHistory] = useState<Array<Array<{
    id: string;
    type: string;
    attrs: Record<string, unknown>;
  }>>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Utiliser le hook de slideshow pour accéder aux API
  const { getSlideById, updateSlide } = useSlideshow();

  // Charger les données de la slide sélectionnée
  useEffect(() => {
    if (slideId <= 0) {
      setElements([]);
      setSelectedElementId(null);
      return;
    }

    const loadSlide = async () => {
      try {
        const slide = await getSlideById(slideId);
        
        if (slide && slide.konvaData && slide.konvaData.children) {
          // Transformer les données Konva en éléments pour l'éditeur
          const extractedElements = slide.konvaData.children.map((child) => ({
            id: (child.attrs?.id as string) || uuidv4(),
            type: child.className || "Unknown",
            attrs: child.attrs || {},
          }));
          
          setElements(extractedElements);
          setHistory([extractedElements]);
          setHistoryIndex(0);
        } else {
          // Si la slide n'a pas de données Konva, initialiser avec un tableau vide
          setElements([]);
          setHistory([[]]);
          setHistoryIndex(0);
        }
      } catch (error) {
        console.error("Erreur lors du chargement de la slide:", error);
        toast.error("Erreur lors du chargement de la slide");
      }
    };

    loadSlide();
  }, [slideId, getSlideById]);

  // Fonction pour ajouter un élément à l'historique
  const addToHistory = useCallback((newElements: typeof elements) => {
    setHistory((prev) => {
      // Supprimer les états futurs si on a fait des annulations
      const newHistory = prev.slice(0, historyIndex + 1);
      return [...newHistory, newElements];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  // Fonction pour ajouter un élément
  const addElement = useCallback((type: string, attrs: Record<string, unknown>) => {
    const newId = uuidv4();
    const newElement = {
      id: newId,
      type,
      attrs: { ...attrs, id: newId },
    };

    setElements((prev) => {
      const newElements = [...prev, newElement];
      addToHistory(newElements);
      return newElements;
    });

    return newId;
  }, [addToHistory]);

  // Fonction pour mettre à jour un élément
  const updateElement = useCallback((id: string, attrs: Record<string, unknown>) => {
    setElements((prev) => {
      const newElements = prev.map((element) =>
        element.id === id
          ? { ...element, attrs: { ...element.attrs, ...attrs } }
          : element
      );
      
      addToHistory(newElements);
      return newElements;
    });
  }, [addToHistory]);

  // Fonction pour supprimer un élément
  const deleteElement = useCallback((id: string) => {
    setElements((prev) => {
      const newElements = prev.filter((element) => element.id !== id);
      addToHistory(newElements);
      return newElements;
    });
    setSelectedElementId(null);
  }, [addToHistory]);

  // Fonction pour sélectionner un élément
  const selectElement = useCallback((elementId: string | null) => {
    setSelectedElementId(elementId);
  }, []);

  // Fonction pour sauvegarder les changements
  const saveChanges = useCallback(async () => {
    if (slideId <= 0) return null;
    
    setIsSaving(true);
    
    try {
      // Construire les données Konva à partir des éléments
      const konvaData = {
        attrs: {
          width: 800,
          height: 450,
        },
        className: "Stage",
        children: elements.map((element) => ({
          attrs: element.attrs,
          className: element.type,
        })),
      };
      
      // Appeler l'API pour mettre à jour la slide
      const updatedSlide = await updateSlide(slideId, {
        konvaData,
        slideshowId: slideshowId,
      });
      
      return updatedSlide;
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast.error("Erreur lors de la sauvegarde des modifications");
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [slideId, elements, updateSlide, slideshowId]);

  // Fonction pour annuler une action
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex((prev) => prev - 1);
      setElements(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  // Fonction pour rétablir une action
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((prev) => prev + 1);
      setElements(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  // Déterminer si on peut annuler ou rétablir
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Retourner l'état et les fonctions de l'éditeur
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
    canUndo,
    canRedo,
  };
} 
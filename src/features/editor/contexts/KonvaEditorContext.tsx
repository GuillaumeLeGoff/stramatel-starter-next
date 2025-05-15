"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useKonvaEditor } from "../hooks/useKonvaEditor";
import { useEditorStore } from "../store/editorStore";
import { EditorSlide } from "../types";

// Définir le type pour le contexte de l'éditeur Konva
interface KonvaEditorContextType {
  elements: {
    id: string;
    type: string;
    attrs: Record<string, unknown>;
  }[];
  selectedElementId: string | null;
  isSaving: boolean;
  addElement: (type: string, attrs: Record<string, unknown>) => string;
  updateElement: (id: string, attrs: Record<string, unknown>) => void;
  deleteElement: (id: string) => void;
  selectElement: (elementId: string | null) => void;
  saveChanges: () => Promise<EditorSlide | null>;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

// Créer le contexte avec une valeur par défaut
const KonvaEditorContext = createContext<KonvaEditorContextType | null>(null);

// Hook personnalisé pour utiliser le contexte de l'éditeur Konva
export function useKonvaEditorContext() {
  const context = useContext(KonvaEditorContext);
  if (!context) {
    throw new Error(
      "useKonvaEditorContext doit être utilisé à l'intérieur d'un KonvaEditorProvider"
    );
  }
  return context;
}

// Propriétés du provider
interface KonvaEditorProviderProps {
  children: ReactNode;
  slideId?: number;
  slideshowId?: number;
}

// Provider qui initialise et partage le hook useKonvaEditor
export function KonvaEditorProvider({ 
  children, 
  slideId,
  slideshowId
}: KonvaEditorProviderProps) {
  // Obtenir l'ID de la slide sélectionnée depuis le store global si non fourni en prop
  const { selectedSlideId } = useEditorStore();
  const actualSlideId = slideId !== undefined ? slideId : (selectedSlideId || -1);

  // Initialiser le hook useKonvaEditor avec l'ID de la slide
  const editor = useKonvaEditor(actualSlideId, slideshowId);

  // Fournir les valeurs du hook à travers le contexte
  return (
    <KonvaEditorContext.Provider value={editor}>
      {children}
    </KonvaEditorContext.Provider>
  );
} 
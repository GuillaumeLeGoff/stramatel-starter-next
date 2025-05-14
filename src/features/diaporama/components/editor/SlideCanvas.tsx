"use client";

import React, { useEffect, useState } from "react";
import { useEditorStore } from "../../store/editorStore";
import dynamic from "next/dynamic";
import { useKonvaEditorContext } from "../../contexts/KonvaEditorContext";

// Import Konva uniquement côté client avec un composant dynamique
const KonvaCanvas = dynamic(() => import("./KonvaCanvas"), {
  ssr: false,
  loading: () => (
    <div className="border rounded shadow-sm bg-white flex items-center justify-center h-[450px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-2"></div>
        <div>Chargement de l&apos;éditeur...</div>
      </div>
    </div>
  ),
});

interface SlideCanvasProps {
  onSaveSuccess?: () => void;
}

export function SlideCanvas({ onSaveSuccess }: SlideCanvasProps) {
  // Utiliser le contexte partagé
  const {
    elements,
    selectedElementId,
    updateElement,
    deleteElement,
    selectElement,
    saveChanges,
    undo,
    redo,
  } = useKonvaEditorContext();

  const { scale } = useEditorStore();
  const [mounted, setMounted] = useState(false);

  // Pour s'assurer que le code est exécuté uniquement côté client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Gestion des touches clavier (supprimer, enregistrer, annuler)
  useEffect(() => {
    if (!mounted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Supprimer avec Delete/Backspace
      if ((e.key === "Delete" || e.key === "Backspace") && selectedElementId) {
        deleteElement(selectedElementId);
      }

      // Enregistrer avec Ctrl+S
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveChanges().then(() => {
          if (onSaveSuccess) onSaveSuccess();
        });
      }

      // Annuler avec Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Refaire avec Ctrl+Y ou Ctrl+Shift+Z
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "y" || (e.shiftKey && e.key === "z"))
      ) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    deleteElement,
    saveChanges,
    selectedElementId,
    undo,
    redo,
    onSaveSuccess,
    mounted,
  ]);

  // Chargement ou état vide
  if (!mounted) {
    return (
      <div className="border rounded shadow-sm bg-white flex items-center justify-center h-[450px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-2"></div>
          <div>Initialisation de l&apos;éditeur...</div>
        </div>
      </div>
    );
  }

  return (
    <KonvaCanvas
      elements={elements}
      selectedElementId={selectedElementId}
      scale={scale}
      onSelectElement={selectElement}
      onUpdateElement={updateElement}
    />
  );
}

"use client";

import React, { useState } from "react";
import { useEditorStore } from "../../store/editorStore";
import { Card } from "@/shared/components/ui/card";
import { LucideIcon } from "lucide-react";
import { Type, Square, Circle, Image, Video, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useKonvaEditorContext } from "../../contexts/KonvaEditorContext";

interface ShapesPanelProps {
  onAddSuccess?: () => void;
}

const iconMap: Record<string, LucideIcon> = {
  type: Type,
  square: Square,
  circle: Circle,
  image: Image,
  video: Video,
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ShapesPanel({ onAddSuccess }: ShapesPanelProps) {
  const { shapes, selectedSlideId } = useEditorStore();
  const [isAdding, setIsAdding] = useState(false);
  const [processingType, setProcessingType] = useState<string | null>(null);

  // Utiliser le contexte partagé au lieu d'initialiser une nouvelle instance
  const editor = useKonvaEditorContext();
  const isEditorReady = selectedSlideId !== null && selectedSlideId > 0;

  const handleAddElement = async (type: string, event: React.MouseEvent) => {
    // Empêcher le comportement par défaut pour éviter le rechargement de la page
    event.preventDefault();
    event.stopPropagation();

    if (!isEditorReady) {
      toast.error("Veuillez d'abord sélectionner une slide");
      return;
    }

    if (isAdding) {
      toast.info("Ajout en cours, veuillez patienter");
      return;
    }

    try {
      setIsAdding(true);
      setProcessingType(type);

      switch (type) {
        case "text":
          editor.addElement("Text", {
            text: "Nouveau texte",
            fontSize: 20,
            fill: "#333333",
            x: 100,
            y: 100,
            width: 200,
            draggable: true,
          });
          break;

        case "rect":
          editor.addElement("Rect", {
            width: 100,
            height: 100,
            fill: "#3b82f6",
            stroke: "#1d4ed8",
            strokeWidth: 1,
            x: 150,
            y: 150,
            draggable: true,
          });
          break;

        case "circle":
          editor.addElement("Circle", {
            radius: 50,
            fill: "#22c55e",
            stroke: "#15803d",
            strokeWidth: 1,
            x: 200,
            y: 200,
            draggable: true,
          });
          break;

        case "image":
          // Simple placeholder pour démonstration
          toast.info("Fonctionnalité d'ajout d'image à implémenter");
          setIsAdding(false);
          setProcessingType(null);
          return;

        case "video":
          // Simple placeholder pour démonstration
          toast.info("Fonctionnalité d'ajout de vidéo à implémenter");
          setIsAdding(false);
          setProcessingType(null);
          return;
      }

      // Sauvegarde automatique
      /*  await editor.saveChanges();
      if (onAddSuccess) onAddSuccess();
      toast.success(`Élément ${type} ajouté avec succès`); */
    } catch (error) {
      toast.error(
        `Erreur lors de l'ajout de l'élément: ${
          error instanceof Error ? error.message : "Erreur inconnue"
        }`
      );
    } finally {
      setIsAdding(false);
      setProcessingType(null);
    }
  };

  if (!selectedSlideId) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Sélectionnez une slide pour ajouter des éléments
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="font-medium text-sm">Éléments disponibles</h3>

      <div className="grid grid-cols-2 gap-2">
        {shapes.map((shape) => {
          const Icon = iconMap[shape.icon] || Square;
          const isProcessing = isAdding && processingType === shape.id;

          return (
            <Card
              key={shape.id}
              className={`p-3 cursor-pointer hover:bg-muted transition-colors ${
                isProcessing ? "opacity-75 pointer-events-none" : ""
              }`}
              onClick={(e) => handleAddElement(shape.id, e)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleAddElement(shape.id, e as unknown as React.MouseEvent);
                }
              }}
            >
              <div className="flex flex-col items-center justify-center">
                {isProcessing ? (
                  <Loader2 className="w-8 h-8 mb-2 animate-spin" />
                ) : (
                  <Icon className="w-8 h-8 mb-2" />
                )}
                <span className="text-xs font-medium">{shape.name}</span>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="text-xs text-muted-foreground pt-4">
        Cliquez sur un élément pour l&apos;ajouter à la slide actuelle
      </div>
    </div>
  );
}

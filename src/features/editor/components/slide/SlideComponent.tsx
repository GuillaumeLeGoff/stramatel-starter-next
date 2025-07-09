import React, { useEffect, useRef, useState } from "react";
import { KonvaStageRenderer } from "../editor/KonvaStageRenderer";
import { KonvaStage, SlidePreviewProps } from "../../types";
import { Card, CardContent } from "@/shared/components/ui/card";
import { useSlideManager } from "@/features/editor/hooks";
import { Button } from "@/shared/components/ui/button";
import { Trash2, Clock } from "lucide-react";
import { useAppSettings } from "@/shared/hooks/useAppSettings";
import { createDefaultKonvaStage } from "../../utils";
import { useEditorStore, editorSelectors } from "../../store/editorStore";
import { useSlideshow } from "@/features/slideshow/hooks";

export function SlidePreview({
  slide,
  isActive = false,
  onClick,
}: SlidePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const { width, height } = useAppSettings();

  // Récupérer les données nécessaires pour le cache
  const { currentSlideshow } = useSlideshow();
  const getCachedKonvaData = useEditorStore((state) => state.getCachedKonvaData);
  const konvaDataCache = useEditorStore((state) => state.konvaDataCache); // Pour déclencher les re-renders
  
  // Trouver l'index de cette slide dans le slideshow
  const slideIndex = currentSlideshow?.slides?.findIndex(s => s.id === slide.id) ?? -1;
  
  // Convertir le konvaData du slide en KonvaStage
  let stageData: KonvaStage;

  // Si on a un index valide, essayer d'utiliser les données du cache en priorité
  if (slideIndex >= 0) {
    const cachedData = getCachedKonvaData(slideIndex);
    
    if (cachedData) {
      // Utiliser les données du cache (mises à jour en temps réel)
      stageData = cachedData;
    } else if (slide.konvaData) {
      // Fallback vers les données de la slide
      stageData = slide.konvaData as unknown as KonvaStage;
    } else {
      // Données par défaut
      stageData = createDefaultKonvaStage();
    }
  } else if (slide.konvaData) {
    // Si pas d'index trouvé, utiliser les données de la slide
    stageData = slide.konvaData as unknown as KonvaStage;
  } else {
    // Créer des données par défaut si aucune donnée Konva n'existe
    stageData = createDefaultKonvaStage();
  }

  const { previewScale, viewportStageData, deleteSlide } = useSlideManager({
    stageData,
    containerRef,
  });

  // Récupérer la couleur de background de la slide
  const slideBackgroundColor = stageData?.attrs?.backgroundColor || "#000000";

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Empêcher le déclenchement de onClick sur la Card
    if (slide && slide.id) {
      try {
        await deleteSlide(slide.id);
        // Si besoin d'afficher une notification de succès
        // toast.success("Slide supprimée avec succès");
      } catch (error) {
        console.error("Erreur lors de la suppression de la slide", error);
       
      }
    }
  };

  // Formatage de la durée (en secondes)
  const formatDuration = (duration?: number) => {
    if (!duration) return "0s";
    // Formater avec 1 décimale maximum, supprimer le .0 si pas nécessaire
    const formatted = duration % 1 === 0 ? duration.toString() : duration.toFixed(1);
    return `${formatted}s`;
  };

  return (
    <Card
      className={`cursor-pointer transition-all relative ${
        isActive ? "border-2 border-primary" : ""
      }`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Bouton de suppression */}
      {isHovered && (
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-1 right-1 h-7 w-7 z-10"
          onClick={handleDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}

      {/* Durée de la slide */}
      <div className="absolute z-10 bottom-1 right-1 flex items-center justify-center bg-black/70 px-2 py-1 rounded text-white text-xs font-medium">
        <Clock className="h-3 w-3 mr-1" />
        {formatDuration(slide.duration)}
      </div>

      <CardContent className="p-0">
        <div
          ref={containerRef}
          style={{
            width: "100%",
            height: "150px",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#00000069",
          }}
        >
          <div
            style={{
              transform: `scale(${previewScale})`,
              transformOrigin: "center",
              width: `${stageData.attrs.width}px`,
              height: `${stageData.attrs.height}px`,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: `${width}px`,
                height: `${height}px`,
                backgroundColor: slideBackgroundColor,
              }}
            >
              {viewportStageData && (
                <KonvaStageRenderer
                  stageData={viewportStageData}
                  isPreview={true}
                />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

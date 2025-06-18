"use client";

import { useCurrentSlide } from "@/features/panel/hooks/useCurrentSlide";
import { MediaData } from "@/lib/socket";
import { KonvaSlideViewer } from "./KonvaSlideViewer";
import { KonvaStage } from "@/features/editor/types";

// Données Konva d'exemple

export function LiveSlideViewer() {
  const { currentSlide, isLoading, remainingTime } = useCurrentSlide();

  if (isLoading) {
    return <div className="bg-black"></div>;
  }

  if (!currentSlide) {
    return null; // Ne rien afficher si pas de slide
  }

  // Utiliser les données Konva de la slide ou l'exemple par défaut
  let konvaData: KonvaStage | null = null;

  if (currentSlide.konvaData) {
    try {
      konvaData =
        typeof currentSlide.konvaData === "string"
          ? JSON.parse(currentSlide.konvaData)
          : (currentSlide.konvaData as KonvaStage);
    } catch (error) {
      console.error("Erreur lors du parsing des données Konva:", error);
      return null; // Ne rien afficher en cas d'erreur
    }
  } else {
    return null; // Ne rien afficher si pas de données
  }

  return (
   <div>
      {konvaData && (
        
          <KonvaSlideViewer konvaData={konvaData} />
      
      )}
    </div>
  );
}

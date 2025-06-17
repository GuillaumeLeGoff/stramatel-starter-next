"use client";

import { useCurrentSlide } from "@/features/panel/hooks/useCurrentSlide";
import { MediaData } from "@/lib/socket";
import { KonvaSlideViewer } from "./KonvaSlideViewer";
import { KonvaStage } from "@/features/editor/types";

// Données Konva d'exemple

export function LiveSlideViewer() {
  const { currentSlide, isLoading, remainingTime } = useCurrentSlide();

  if (isLoading) {
    return <div className="p-4">Connexion...</div>;
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
    <div className="p-6 border rounded-lg">
      {/* Nom du slideshow */}
      <h1 className="text-2xl font-bold mb-4">{currentSlide.slideshowName}</h1>

      {/* Slide actuelle */}
      <div className="mb-4">
        <p className="text-lg">
          Slide {currentSlide.slidePosition + 1} / {currentSlide.totalSlides}
        </p>
      </div>

      {/* Affichage Konva */}
      {konvaData && (
        <div className="mb-6">
          <KonvaSlideViewer konvaData={konvaData} />
        </div>
      )}
    </div>
  );
}

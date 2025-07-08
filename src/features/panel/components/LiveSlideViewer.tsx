"use client";

import { useCurrentSlide } from "@/features/panel/hooks/useCurrentSlide";
import { MediaData } from "@/lib/socket";
import { KonvaSlideViewer } from "./KonvaSlideViewer";
import { KonvaStage } from "@/features/editor/types";
import { useMemo, useEffect } from "react";
import { useAppSettingsStore } from "@/shared/store/appSettingsStore";

// Données Konva d'exemple

export function LiveSlideViewer() {
  const { currentSlide, isLoading, remainingTime } = useCurrentSlide();
  const { settings, fetchSettings } = useAppSettingsStore();
  
  // Charger les settings au montage si pas déjà chargées
  useEffect(() => {
    if (!settings) {
      fetchSettings();
    }
  }, [settings, fetchSettings]);
  
  // Récupérer les dimensions depuis appSettings avec des valeurs par défaut
  const dimensions = useMemo(() => ({
    width: settings?.width || 1920,
    height: settings?.height || 1080,
  }), [settings?.width, settings?.height]);

  // Traitement des données Konva et calcul de la couleur de fond avant les retours conditionnels
  const konvaData = useMemo(() => {
    if (!currentSlide?.konvaData) {
      return null;
    }

    try {
      return typeof currentSlide.konvaData === "string"
        ? JSON.parse(currentSlide.konvaData)
        : (currentSlide.konvaData as KonvaStage);
    } catch (error) {
      console.error("Erreur lors du parsing des données Konva:", error);
      return null;
    }
  }, [currentSlide?.konvaData]);

  // Récupérer la couleur de fond de konvaData
  const backgroundColor = useMemo(() => {
    return konvaData?.attrs?.backgroundColor || "#000000";
  }, [konvaData?.attrs?.backgroundColor]);

  if (isLoading) {
    return <div className="bg-black"></div>;
  }

  if (!currentSlide) {
    return null; // Ne rien afficher si pas de slide
  }

  if (!konvaData) {
    return null; // Ne rien afficher si pas de données
  }

  return (
   <div 
     style={{ 
       backgroundColor,
       width: `${dimensions.width}px`,
       height: `${dimensions.height}px`
     }}
   >
      {konvaData && (
        <KonvaSlideViewer konvaData={konvaData} />
      )}
    </div>
  );
}

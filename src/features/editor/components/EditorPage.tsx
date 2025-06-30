import React, { useEffect } from "react";
import { useEditor, useSlideManager, useZoom } from "@/features/editor/hooks";
import { useSlideshow } from "@/features/slideshow/hooks";
import { useAppSettingsStore } from "@/store/appSettingsStore";
import { ResizableHandle, ResizablePanelGroup } from "@/shared/components/ui/resizable";

// Nouveaux composants modulaires
import { SlideManager } from "./slide";
import { EditorCanvas } from "./editor";
import { ToolsPanel } from "./shape";

export function EditorPage() {
  const { currentSlideshow } = useSlideshow();
  const { currentSlide, getCurrentSlideKonvaData, changeSlide } = useEditor();
  const { settings, fetchSettings } = useAppSettingsStore();
  
  // Charger les settings au montage si pas déjà chargées
  useEffect(() => {
    if (!settings) {
      fetchSettings();
    }
  }, [settings, fetchSettings]);
  
  // Récupérer les dimensions depuis appSettings avec des valeurs par défaut
  const width = settings?.width || 1920;
  const height = settings?.height || 1080;

  const konvaData = getCurrentSlideKonvaData();
  const { scale, normalizedScale, zoomPercentage, zoomIn, zoomOut, fitToContainer, containerRef } = useZoom({
    stageWidth: width,
    stageHeight: height,
  });

  const { addSlide, addShape, updateSlideDuration, cleanMediaFromAllSlides } = useSlideManager({
    stageData: konvaData,
    containerRef,
    scale,
  });

  // Récupérer la slide actuelle
  const currentSlideData = currentSlideshow?.slides?.[currentSlide];

  // Fonction pour gérer l'ajout d'une slide
  const handleAddSlide = () => {
    if (!currentSlideshow) return;
    addSlide({
      slideshowId: currentSlideshow.id,
      position: currentSlideshow.slides?.length || 0,
      duration: 5,
      width,
      height,
    });
  };

  // Fonction pour gérer le changement de durée
  const handleDurationChange = async (duration: number) => {
    if (currentSlideData?.id) {
      await updateSlideDuration(currentSlideData.id, duration);
    }
  };

  // Si aucun slideshow n'est sélectionné
  if (!currentSlideshow) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Aucun slideshow sélectionné</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col h-full px-4 pb-4">
        <ResizablePanelGroup
          direction="horizontal"
          className="flex-1 h-[calc(100%-60px)] border rounded-lg"
        >
          {/* Gestionnaire de slides - Panneau de gauche */}
          <SlideManager
            currentSlide={currentSlide}
            onChangeSlide={changeSlide}
            onAddSlide={handleAddSlide}
            slides={currentSlideshow.slides}
          />

          <ResizableHandle />

          {/* Canvas de l'éditeur - Zone centrale */}
          <EditorCanvas
            konvaData={konvaData}
            scale={scale}
            normalizedScale={normalizedScale}
            zoomPercentage={zoomPercentage}
            containerRef={containerRef}
            width={width}
            height={height}
            zoomIn={zoomIn}
            zoomOut={zoomOut}
            fitToContainer={fitToContainer}
            currentSlideDuration={currentSlideData?.duration}
            onDurationChange={handleDurationChange}
          />

          <ResizableHandle />

          {/* Panneau d'outils - Panneau de droite */}
          <ToolsPanel
            addShape={addShape}
            onMediaDeleted={cleanMediaFromAllSlides}
            konvaData={konvaData}
          />
        </ResizablePanelGroup>
      </div>
    </div>
  );
}

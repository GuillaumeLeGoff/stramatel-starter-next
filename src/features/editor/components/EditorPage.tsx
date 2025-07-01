import React from "react";
import { useEditorPage } from "@/features/editor/hooks";
import { ResizableHandle, ResizablePanelGroup } from "@/shared/components/ui/resizable";

// Nouveaux composants modulaires
import { SlideManager } from "./slide";
import { EditorCanvas } from "./editor";
import { ToolsPanel } from "./shape";

export function EditorPage() {
  const {
    // Données
    currentSlideshow,
    currentSlide,
    currentSlideData,
    konvaData,
    dimensions,
    
    // Zoom et container
    scale,
    normalizedScale,
    zoomPercentage,
    containerRef,
    
    // Actions zoom
    zoomIn,
    zoomOut,
    fitToContainer,
    
    // Actions slides
    handleAddSlide,
    handleChangeSlide,
    
    // Actions shapes
    addShape,
    
    // Actions média
    handleCleanMediaFromAllSlides,
    
    // Actions durée
    updateSlideDuration,
  } = useEditorPage();

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
            onChangeSlide={handleChangeSlide}
            onAddSlide={handleAddSlide}
            slides={currentSlideshow?.slides}
          />

          <ResizableHandle />

          {/* Canvas de l'éditeur - Zone centrale */}
          <EditorCanvas
            konvaData={konvaData}
            scale={scale}
            normalizedScale={normalizedScale}
            zoomPercentage={zoomPercentage}
            containerRef={containerRef}
            width={dimensions.width}
            height={dimensions.height}
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
            onMediaDeleted={handleCleanMediaFromAllSlides}
            konvaData={konvaData}
          />
        </ResizablePanelGroup>
      </div>
    </div>
  );
}

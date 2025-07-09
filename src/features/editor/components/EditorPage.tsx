import React, { useEffect, useCallback } from "react";
import { useEditorPage } from "@/features/editor/hooks";
import { ResizableHandle, ResizablePanelGroup, ResizablePanel } from "@/shared/components/ui/resizable";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";

// Nouveaux composants modulaires
import { SlideManager } from "./slide";
import { EditorCanvas } from "./editor";
import { ToolsPanel } from "./shape";
import { LayersPanel } from "./layers";
import { useEditorStore } from '../store/editorStore';

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
    
    // Actions couleur de fond
    handleBackgroundColorChange,
  } = useEditorPage();

  // ✅ Récupérer les fonctions stables de Zustand
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);

  // ✅ SOLUTION: Stabiliser la fonction avec useCallback
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      console.log('CTRL+Z pressed (undo)');
      undo();
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
      e.preventDefault();
      console.log('CTRL+Y or CTRL+SHIFT+Z pressed (redo)');
      redo();
    }
  }, [undo, redo]); // ✅ Dépendances stables des fonctions Zustand

  // ✅ useEffect optimisé avec fonction memoized
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]); // ✅ Dépendance stable grâce à useCallback

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

  // Calculer le nombre de calques
  const getLayersCount = (): number => {
    if (!konvaData?.children?.[0]?.children) return 0;
    return konvaData.children[0].children.filter((shape: any) => shape.attrs?.id).length;
  };

  const layersCount = getLayersCount();

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
            zoomPercentage={zoomPercentage}
            containerRef={containerRef}
            width={dimensions.width}
            height={dimensions.height}
            zoomIn={zoomIn}
            zoomOut={zoomOut}
            fitToContainer={fitToContainer}
            currentSlideDuration={currentSlideData?.duration}
            onDurationChange={handleDurationChange}
            onBackgroundColorChange={handleBackgroundColorChange}
          />

          <ResizableHandle />

          {/* Panneau d'accordéons - Panneau de droite */}
          <ResizablePanel defaultSize={25} className="flex flex-col">
            <div className="p-4 h-full">
              <Accordion type="single" collapsible defaultValue="shapes" className="w-full">
                {/* Premier accordéon - Choix des shapes */}
                <AccordionItem value="shapes">
                  <AccordionTrigger>Formes et outils</AccordionTrigger>
                  <AccordionContent>
                    <ToolsPanel
                      addShape={addShape}
                      onMediaDeleted={handleCleanMediaFromAllSlides}
                      konvaData={konvaData}
                    />
                  </AccordionContent>
                </AccordionItem>
                
                {/* Deuxième accordéon - Calques */}
                <AccordionItem value="layers">
                  <AccordionTrigger>Calques ({layersCount})</AccordionTrigger>
                  <AccordionContent className="p-0">
                    <LayersPanel konvaData={konvaData} />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}

import { useEditor, useSlide, useZoom } from "@/features/editor/hooks";
import { useSlideshow } from "@/features/slideshow/hooks";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/shared/components/ui/resizable";
import { PlusIcon } from "lucide-react";
import { SortableSlideList } from "./slide/SortableSlideList";
import { FooterEditorComponents } from "./ui/FooterEditorComponents";
import { HeaderEditorComponents } from "./ui/HeaderEditorComponents";
import { KonvaShapeSelector } from "./konva/KonvaAddShapes";
import { KonvaStageRenderer } from "./konva/KonvaStageRenderer";

export function EditorPage() {
  const { currentSlideshow } = useSlideshow();
  const { currentSlide, getCurrentSlideKonvaData, changeSlide, containerRef } =
    useEditor();

  const konvaData = getCurrentSlideKonvaData();
  const { scale, zoomIn, zoomOut } = useZoom(konvaData);

  const { addSlide, addShape, updateSlideDuration } = useSlide({
    stageData: konvaData,
    containerRef,
  });

  // Récupérer la slide actuelle
  const currentSlideData = currentSlideshow?.slides?.[currentSlide];

  // Fonction pour gérer le changement de durée
  const handleDurationChange = async (duration: number) => {
    if (currentSlideData?.id) {
      await updateSlideDuration(currentSlideData.id, duration);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {!currentSlideshow && (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Aucun slideshow sélectionné</p>
        </div>
      )}

      {currentSlideshow && (
        <div className="flex flex-col h-full px-4 pb-4">
          <ResizablePanelGroup
            direction="horizontal"
            className="flex-1 h-[calc(100%-60px)] border rounded-lg"
          >
            {/* Sélecteur de slide */}
            <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
              <Card className="h-full rounded-none border-0 shadow-none">
                <CardContent className="p-4 h-full flex flex-col">
                  {/* Titre et bouton fixes en haut */}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium">Slides</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (!currentSlideshow) return;
                        addSlide({
                          slideshowId: currentSlideshow.id,
                          position: currentSlideshow.slides?.length || 0,
                          duration: 5,
                          width: 1920,
                          height: 1080,
                        });
                      }}
                    >
                      <PlusIcon className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Contenu scrollable */}
                  <div className={`flex-1 overflow-auto `}>
                    {currentSlideshow.slides &&
                    currentSlideshow.slides.length > 0 ? (
                      <SortableSlideList
                        slides={currentSlideshow.slides}
                        currentSlide={currentSlide}
                        onChangeSlide={changeSlide}
                      />
                    ) : (
                      <div className="text-center text-muted-foreground py-4">
                        Aucune slide disponible
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </ResizablePanel>

            <ResizableHandle />

            {/* Éditeur principal */}
            <ResizablePanel defaultSize={60}>
              <ResizablePanelGroup direction="vertical">
                <ResizablePanel
                  defaultSize={5}
                  className="flex justify-end items-center border-b border"
                >
                  <HeaderEditorComponents />
                </ResizablePanel>
                <ResizablePanel defaultSize={90}>
                  <div className="flex flex-col h-full">
                    {/* Zone d'édition principale */}
                    <div
                      className="flex-grow overflow-hidden relative"
                      ref={containerRef}
                    >
                      <div className="h-full flex flex-col rounded-none border-0 shadow-none">
                        {/* Contrôles de zoom */}

                        <div className="flex-1 flex justify-center items-center">
                          {konvaData && (
                            <div
                              className="absolute origin-center transform-gpu"
                              style={{
                                transform: `scale(${scale})`,
                                width: `${konvaData.attrs.width}px`,
                                height: `${konvaData.attrs.height}px`,
                              }}
                            >
                              <div
                                className="absolute bg-black/30"
                                style={{
                                  top: 0,
                                  left: 0,
                                  width: "100%",
                                  height: `calc(50% - ${
                                    konvaData.height / 2
                                  }px)`,
                                }}
                              />
                              <div
                                className="absolute bg-black/30"
                                style={{
                                  bottom: 0,
                                  left: 0,
                                  width: "100%",
                                  height: `calc(50% - ${
                                    konvaData.height / 2
                                  }px)`,
                                }}
                              />
                              <div
                                className="absolute bg-black/30"
                                style={{
                                  top: `calc(50% - ${konvaData.height / 2}px)`,
                                  left: 0,
                                  width: `calc(50% - ${konvaData.width / 2}px)`,
                                  height: `${konvaData.height}px`,
                                }}
                              />

                              {/* Zone semi-transparente droite */}
                              <div
                                className="absolute bg-black/30"
                                style={{
                                  top: `calc(50% - ${konvaData.height / 2}px)`,
                                  right: 0,
                                  width: `calc(50% - ${konvaData.width / 2}px)`,
                                  height: `${konvaData.height}px`,
                                }}
                              />

                              <KonvaStageRenderer stageData={konvaData} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </ResizablePanel>
                <ResizablePanel
                  defaultSize={5}
                  className="flex justify-end items-center border-t border"
                >
                  <FooterEditorComponents
                    scale={scale}
                    zoomIn={zoomIn}
                    zoomOut={zoomOut}
                    currentSlideDuration={currentSlideData?.duration}
                    onDurationChange={handleDurationChange}
                  />
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>

            <ResizableHandle />

            {/* Panneau des outils et des formes */}
            <ResizablePanel defaultSize={20} minSize={15}>
              <Card className="h-full rounded-none border-0 shadow-none">
                <CardContent className="p-4 h-full">
                  <KonvaShapeSelector addShape={addShape} />
                </CardContent>
              </Card>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      )}
    </div>
  );
}

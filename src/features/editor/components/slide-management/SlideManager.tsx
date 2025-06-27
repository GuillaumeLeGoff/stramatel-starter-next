import React from "react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { ResizablePanel } from "@/shared/components/ui/resizable";
import { PlusIcon } from "lucide-react";
import { SortableSlideList } from "./SortableSlideList";
import { useSlideshow } from "@/features/slideshow/hooks";
import { useEditor } from "@/features/editor/hooks";
import { SlideshowSlide } from "@/features/slideshow/types";

interface SlideManagerProps {
  currentSlide: number;
  onChangeSlide: (slideIndex: number) => void;
  onAddSlide: () => void;
  slides?: SlideshowSlide[];
}

export function SlideManager({ 
  currentSlide, 
  onChangeSlide, 
  onAddSlide,
  slides = []
}: SlideManagerProps) {
  return (
    <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
      <Card className="h-full rounded-none border-0 shadow-none">
        <CardContent className="p-4 h-full flex flex-col">
          {/* Titre et bouton fixes en haut */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">Slides</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={onAddSlide}
              title="Ajouter une slide"
            >
              <PlusIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Liste des slides - contenu scrollable */}
          <div className="flex-1 overflow-auto">
            {slides && slides.length > 0 ? (
              <SortableSlideList
                slides={slides}
                currentSlide={currentSlide}
                onChangeSlide={onChangeSlide}
              />
            ) : (
              <div className="text-center text-muted-foreground py-4">
                <p>Aucune slide disponible</p>
                <p className="text-xs mt-2">Cliquez sur + pour commencer</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </ResizablePanel>
  );
} 
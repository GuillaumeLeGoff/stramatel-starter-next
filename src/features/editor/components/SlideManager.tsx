import React, { useRef } from "react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Clock, PlusIcon, Trash2 } from "lucide-react";
import { SlideshowSlide } from "@/features/slideshow/types";
import { useSlide } from "../hooks/useSlide";
import { useEditor } from "../hooks/useEditor";
import { useSlideshow } from "@/features/slideshow/hooks";
import { SortableSlideList } from "./SortableSlideList";

// Style pour masquer les barres de défilement
const scrollbarHideStyle = {
  scrollbarWidth: "none" as const,
  msOverflowStyle: "none" as const,
  "&::-webkit-scrollbar": {
    display: "none",
  },
};

export function SlideManager() {
  const { currentSlideshow } = useSlideshow();
  const { currentSlide, getCurrentSlideKonvaData, changeSlide } = useEditor();

  const containerRef = useRef<HTMLDivElement>(null);
  const stageData = getCurrentSlideKonvaData();

  const { addSlide, updateSlidesOrder } = useSlide({
    stageData,
    containerRef,
  });

  const handleAddSlide = () => {
    if (!currentSlideshow) return;
    addSlide({
      slideshowId: currentSlideshow.id,
      position: currentSlideshow.slides?.length || 0,
      duration: 5,
      width: 1920,
      height: 1080,
    });
  };

  // Si aucun slideshow n'est sélectionné, afficher un message
  if (!currentSlideshow) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Aucun slideshow sélectionné</p>
      </div>
    );
  }

  return (
    <Card className="h-full border rounded-lg">
      <CardContent className="p-4 h-full flex flex-col">
        {/* Titre et bouton d'ajout */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">Slides</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleAddSlide}
            title="Ajouter une slide"
          >
            <PlusIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Contenu scrollable avec les slides */}
        <div
          className="flex-1 overflow-auto"
          style={scrollbarHideStyle}
          ref={containerRef}
        >
          {currentSlideshow.slides && currentSlideshow.slides.length > 0 ? (
            <SortableSlideList
              slides={currentSlideshow.slides}
              currentSlide={currentSlide}
              onChangeSlide={changeSlide}
              onOrderChange={updateSlidesOrder}
            />
          ) : (
            <div className="text-center text-muted-foreground py-4">
              Aucune slide disponible
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Composant pour afficher un aperçu simple sans les fonctionnalités de tri
export function SimpleSlideList() {
  const { currentSlideshow } = useSlideshow();
  const { currentSlide, changeSlide } = useEditor();

  if (
    !currentSlideshow ||
    !currentSlideshow.slides ||
    currentSlideshow.slides.length === 0
  ) {
    return (
      <div className="text-center text-muted-foreground py-4">
        Aucune slide disponible
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {currentSlideshow.slides.map((slide, index) => (
        <SimpleSlidePreview
          key={slide.id}
          slide={slide}
          index={index}
          isActive={index === currentSlide}
          onClick={() => changeSlide(index)}
        />
      ))}
    </div>
  );
}

interface SimpleSlidePreviewProps {
  slide: SlideshowSlide;
  index: number;
  isActive?: boolean;
  onClick: () => void;
}

function SimpleSlidePreview({
  slide,
  index,
  isActive = false,
  onClick,
}: SimpleSlidePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { deleteSlide } = useSlide({
    stageData: null,
    containerRef,
  });

  // Formatage de la durée (en secondes)
  const formatDuration = (duration?: number) => {
    if (!duration) return "0s";
    return `${duration}s`;
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (slide && slide.id) {
      try {
        await deleteSlide(slide.id);
      } catch (error) {
        console.error("Erreur lors de la suppression de la slide", error);
      }
    }
  };

  return (
    <Card
      className={`cursor-pointer transition-all relative group ${
        isActive ? "border-2 border-primary" : ""
      }`}
      onClick={onClick}
    >
      {/* Bouton de suppression */}
      <Button
        variant="destructive"
        size="icon"
        className="absolute top-1 right-1 h-7 w-7 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleDelete}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>

      {/* Durée de la slide */}
      <div className="absolute z-10 bottom-1 right-1 flex items-center justify-center bg-black/70 px-2 py-1 rounded text-white text-xs font-medium">
        <Clock className="h-3 w-3 mr-1" />
        {formatDuration(slide.duration)}
      </div>

      <CardContent className="p-3">
        <div className="text-sm font-medium text-center">Slide {index + 1}</div>
      </CardContent>
    </Card>
  );
}

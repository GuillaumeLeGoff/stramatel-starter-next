"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/shared/components/ui/card";

// Définir un type plus précis pour les slides
interface Slide {
  id: number;
  position: number;
  duration: number;
  [key: string]: any; // Pour les autres propriétés
}

interface SlidesListProps {
  slides: Slide[];
  selectedSlideId: number | null;
  onSelectSlide: (slideId: number) => void;
}

export function SlidesList({
  slides,
  selectedSlideId,
  onSelectSlide,
}: SlidesListProps) {
  return (
    <div className="p-4 space-y-4">
      {slides.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          Aucune slide disponible
        </div>
      ) : (
        <div className="space-y-3">
          {slides.map((slide, index) => (
            <Card
              key={slide.id}
              className={cn(
                "overflow-hidden cursor-pointer border-2 transition-all",
                selectedSlideId === slide.id
                  ? "border-primary"
                  : "border-border hover:border-primary/50"
              )}
              onClick={() => onSelectSlide(slide.id)}
            >
              <CardContent className="p-3">
                <div className="bg-muted aspect-video relative flex items-center justify-center mb-2 overflow-hidden">
                  <span className="absolute top-1 left-1 bg-background/80 text-xs px-2 py-0.5 rounded">
                    {index + 1}
                  </span>

                  {/* Prévisualisation de la slide */}
                  <div className="text-center text-xs text-muted-foreground">
                    Prévisualisation
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium truncate">
                    Slide {index + 1}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {slide.duration}s
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

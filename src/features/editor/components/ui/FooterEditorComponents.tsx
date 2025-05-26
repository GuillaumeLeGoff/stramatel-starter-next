import React, { useState, useEffect } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { ZoomIn, ZoomOut, Clock } from "lucide-react";

interface FooterEditorComponentsProps {
  scale: number;
  zoomIn: () => void;
  zoomOut: () => void;
  currentSlideDuration?: number;
  onDurationChange?: (duration: number) => void;
}

export function FooterEditorComponents({
  scale,
  zoomIn,
  zoomOut,
  currentSlideDuration = 5,
  onDurationChange,
}: FooterEditorComponentsProps) {
  const [durationValue, setDurationValue] = useState(
    currentSlideDuration.toString()
  );

  // Synchroniser la valeur locale avec la prop
  useEffect(() => {
    setDurationValue(currentSlideDuration.toString());
  }, [currentSlideDuration]);

  const handleDurationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const duration = parseFloat(durationValue);
    if (!isNaN(duration) && duration > 0 && onDurationChange) {
      onDurationChange(duration);
    }
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDurationValue(e.target.value);
  };

  const handleDurationBlur = () => {
    const duration = parseFloat(durationValue);
    if (!isNaN(duration) && duration > 0 && onDurationChange) {
      onDurationChange(duration);
    } else {
      // Remettre la valeur précédente si invalide
      setDurationValue(currentSlideDuration.toString());
    }
  };

  return (
    <div className="flex items-center space-x-4">
      {/* Contrôles de zoom */}
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" onClick={zoomOut} title="Dézoomer">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <div className="px-2 py-1 bg-muted text-xs font-medium rounded flex items-center">
          {Math.round(scale * 100)}%
        </div>
        <Button variant="ghost" size="icon" onClick={zoomIn} title="Zoomer">
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>

      {/* Contrôle de durée */}
      <div className="flex items-center space-x-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <form
          onSubmit={handleDurationSubmit}
          className="flex items-center space-x-1"
        >
          <Input
            type="number"
            min="0.1"
            step="0.1"
            value={durationValue}
            onChange={handleDurationChange}
            onBlur={handleDurationBlur}
            className="w-16 h-8 text-xs"
            title="Durée de la slide en secondes"
          />
          <span className="text-xs text-muted-foreground">s</span>
        </form>
      </div>
    </div>
  );
}

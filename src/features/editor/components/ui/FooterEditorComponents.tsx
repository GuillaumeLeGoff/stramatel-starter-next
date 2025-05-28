import React, { useState, useEffect } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Separator } from "@/shared/components/ui/separator";
import { ZoomIn, ZoomOut, Clock, Minus, Plus } from "lucide-react";

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

  const handleZoomDecrease = () => {
    const duration = Math.max(0.1, parseFloat(durationValue) - 0.5);
    setDurationValue(duration.toString());
    if (onDurationChange) {
      onDurationChange(duration);
    }
  };

  const handleZoomIncrease = () => {
    const duration = parseFloat(durationValue) + 0.5;
    setDurationValue(duration.toString());
    if (onDurationChange) {
      onDurationChange(duration);
    }
  };

  return (
    <div className="flex items-center justify-between w-full px-4">
      {/* Contrôles de zoom */}
      <Card className="border-0 shadow-none">
        <CardContent className="p-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={zoomOut}
              className="h-8 w-8 p-0"
              title="Dézoomer"
            >
              <ZoomOut className="h-3 w-3" />
            </Button>

            <Badge variant="secondary" className="px-3 py-1 font-mono">
              {Math.round(scale * 100)}%
            </Badge>

            <Button
              variant="outline"
              size="sm"
              onClick={zoomIn}
              className="h-8 w-8 p-0"
              title="Zoomer"
            >
              <ZoomIn className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator orientation="vertical" className="h-8" />

      {/* Contrôle de durée */}
      <Card className="border-0 shadow-none">
        <CardContent className="p-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Durée:</span>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomDecrease}
                className="h-8 w-8 p-0"
                title="Diminuer la durée"
              >
                <Minus className="h-3 w-3" />
              </Button>

              <form
                onSubmit={handleDurationSubmit}
                className="flex items-center"
              >
                <Input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={durationValue}
                  onChange={handleDurationChange}
                  onBlur={handleDurationBlur}
                  className="w-16 h-8 text-xs text-center font-mono"
                  title="Durée de la slide en secondes"
                />
              </form>

              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIncrease}
                className="h-8 w-8 p-0"
                title="Augmenter la durée"
              >
                <Plus className="h-3 w-3" />
              </Button>

              <span className="text-xs text-muted-foreground">s</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

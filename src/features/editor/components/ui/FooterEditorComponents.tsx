import React from "react";
import { Button } from "@/shared/components/ui/button";
import { ZoomIn, ZoomOut } from "lucide-react";

interface FooterEditorComponentsProps {
  scale: number;
  zoomIn: () => void;
  zoomOut: () => void;
}

export function FooterEditorComponents({ 
  scale,
  zoomIn,
  zoomOut
}: FooterEditorComponentsProps) {
  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={zoomOut}
        title="Dézoomer"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <div className="px-2 py-1 bg-muted text-xs font-medium rounded flex items-center">
        {Math.round(scale * 100)}%
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={zoomIn}
        title="Zoomer"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
    </div>
  );
}

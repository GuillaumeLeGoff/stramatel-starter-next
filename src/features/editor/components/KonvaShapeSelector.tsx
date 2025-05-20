import React from "react";
import { Button } from "@/shared/components/ui/button";
import {
  Square,
  Circle,
  Type,
  Image as ImageIcon,
  PenLine,
  Play,
  LineChart,
} from "lucide-react";

interface KonvaShape {
  id: string;
  name: string;
  icon: React.ReactNode;
  action: () => void;
}

interface KonvaShapeSelectorProps {
  onAddShape: (shapeType: string) => void;
}

export function KonvaShapeSelector({ onAddShape }: KonvaShapeSelectorProps) {
  const shapes: KonvaShape[] = [
    {
      id: "rectangle",
      name: "Rectangle",
      icon: <Square className="h-4 w-4" />,
      action: () => onAddShape("rectangle"),
    },
    {
      id: "circle",
      name: "Cercle",
      icon: <Circle className="h-4 w-4" />,
      action: () => onAddShape("circle"),
    },
    {
      id: "text",
      name: "Texte",
      icon: <Type className="h-4 w-4" />,
      action: () => onAddShape("text"),
    },
    {
      id: "image",
      name: "Image",
      icon: <ImageIcon className="h-4 w-4" />,
      action: () => onAddShape("image"),
    },
    {
      id: "line",
      name: "Ligne",
      icon: <PenLine className="h-4 w-4" />,
      action: () => onAddShape("line"),
    },
    {
      id: "arrow",
      name: "Flèche",
      icon: <Play className="h-4 w-4" />,
      action: () => onAddShape("arrow"),
    },
    {
      id: "chart",
      name: "Graphique",
      icon: <LineChart className="h-4 w-4" />,
      action: () => onAddShape("chart"),
    },
  ];

  return (
    <div className="space-y-4 h-full flex flex-col">
      <h3 className="text-sm font-medium">Ajouter un élément</h3>

      <hr className="my-2 border-t border-border" />

      <div className="grid grid-cols-2 gap-2">
        {shapes.map((shape) => (
          <Button
            key={shape.id}
            variant="outline"
            size="sm"
            className="h-10 w-full flex items-center justify-center gap-2"
            onClick={shape.action}
            title={`Ajouter un ${shape.name.toLowerCase()}`}
          >
            {shape.icon}
            <span className="text-xs">{shape.name}</span>
          </Button>
        ))}
      </div>

      <hr className="my-2 border-t border-border" />

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Propriétés</h3>
        <p className="text-xs text-muted-foreground">
          Sélectionnez un élément pour modifier ses propriétés.
        </p>
      </div>

      <div className="flex-grow"></div>

      <div className="text-xs text-muted-foreground">
        <p>
          Astuce: Utilisez la touche Shift pour maintenir le ratio d&apos;aspect
          lors du redimensionnement.
        </p>
      </div>
    </div>
  );
}

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
import { useEditor } from "@/features/editor/hooks";

interface KonvaShape {
  id: string;
  name: string;
  icon: React.ReactNode;
  action: () => void;
}

export function KonvaShapeSelector() {
  const { addShape } = useEditor();
  const shapes: KonvaShape[] = [
    {
      id: "rectangle",
      name: "Rectangle",
      icon: <Square className="h-4 w-4" />,
      action: () => addShape("rectangle"),
    },
    {
      id: "circle",
      name: "Cercle",
      icon: <Circle className="h-4 w-4" />,
      action: () => addShape("circle"),
    },
    {
      id: "text",
      name: "Texte",
      icon: <Type className="h-4 w-4" />,
      action: () => addShape("text"),
    },
    {
      id: "image",
      name: "Image",
      icon: <ImageIcon className="h-4 w-4" />,
      action: () => addShape("image"),
    },
    {
      id: "line",
      name: "Ligne",
      icon: <PenLine className="h-4 w-4" />,
      action: () => addShape("line"),
    },
    {
      id: "arrow",
      name: "Flèche",
      icon: <Play className="h-4 w-4" />,
      action: () => addShape("arrow"),
    },
    {
      id: "chart",
      name: "Graphique",
      icon: <LineChart className="h-4 w-4" />,
      action: () => addShape("chart"),
    },
  ];

  return (
    <div className="space-y-4 h-full flex flex-col">
      <h3 className="text-sm font-medium">Ajouter un élément</h3>

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
    </div>
  );
}

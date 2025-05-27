import React from "react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Square, Circle, Type, PenLine, Play } from "lucide-react";

interface KonvaShape {
  id: string;
  name: string;
  icon: React.ReactNode;
  action: () => void;
}

interface KonvaShapeSelectorProps {
  addShape: (
    shapeType: string,
    options?: { src?: string; name?: string }
  ) => Promise<void>;
}

export function KonvaShapeSelector({ addShape }: KonvaShapeSelectorProps) {
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
  ];

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="grid grid-cols-2 gap-3">
        {shapes.map((shape) => (
          <Card
            key={shape.id}
            className="cursor-pointer hover:bg-accent transition-colors border-dashed"
            onClick={shape.action}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 p-2 bg-primary/10 rounded-md">
                  {shape.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{shape.name}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

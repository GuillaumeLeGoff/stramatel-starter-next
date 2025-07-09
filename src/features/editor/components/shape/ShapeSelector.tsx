import React from "react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { 
  Square, 
  Circle, 
  Triangle,
  Type, 
  Minus, 
  ArrowRight
} from "lucide-react";

interface Shape {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  action: () => void;
}

interface ShapeSelectorProps {
  addShape: (
    shapeType: string,
    options?: { src?: string; name?: string }
  ) => Promise<void>;
}

/**
 * Sélecteur de formes géométriques et d'éléments de base
 * Permet d'ajouter rapidement des formes au canvas
 */
export function ShapeSelector({ addShape }: ShapeSelectorProps) {
  const shapes: Shape[] = [
    {
      id: "rectangle",
      name: "Rectangle",
      description: "Forme rectangulaire",
      icon: <Square className="h-4 w-4" />,
      action: () => addShape("rectangle"),
    },
    {
      id: "circle",
      name: "Cercle",
      description: "Forme circulaire",
      icon: <Circle className="h-4 w-4" />,
      action: () => addShape("circle"),
    },
    {
      id: "triangle",
      name: "Triangle",
      description: "Forme triangulaire",
      icon: <Triangle className="h-4 w-4" />,
      action: () => addShape("triangle"),
    },
    {
      id: "text",
      name: "Texte",
      description: "Zone de texte",
      icon: <Type className="h-4 w-4" />,
      action: () => addShape("text"),
    },
    {
      id: "arrow",
      name: "Flèche",
      description: "Flèche directionnelle",
      icon: <ArrowRight className="h-4 w-4" />,
      action: () => addShape("arrow"),
    },
  ];

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Section Formes de Base */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Formes de Base
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {shapes.map((shape) => (
            <Card
              key={shape.id}
              className="cursor-pointer hover:bg-accent transition-colors border-dashed"
              onClick={shape.action}
              title={shape.description}
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

      {/* Message d'aide */}
      <div className="text-xs text-muted-foreground text-center mt-auto">
        Cliquez sur une carte pour ajouter la forme au canvas
      </div>
    </div>
  );
}

import React from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { Shapes, Image as ImageIcon } from "lucide-react";
import { KonvaShapeSelector } from "./KonvaAddShapes";
import { MediaList } from "./MediaList";

interface TabsPanelProps {
  addShape: (
    shapeType: string,
    options?: { src?: string; name?: string }
  ) => Promise<void>;
}

export function TabsPanel({ addShape }: TabsPanelProps) {
  return (
    <Tabs defaultValue="shapes" className="h-full flex flex-col">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="shapes" className="flex items-center gap-2">
          <Shapes className="h-4 w-4" />
          Formes
        </TabsTrigger>
        <TabsTrigger value="medias" className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          Médias
        </TabsTrigger>
      </TabsList>

      <TabsContent value="shapes" className="flex-1 mt-4">
        <KonvaShapeSelector addShape={addShape} />
      </TabsContent>

      <TabsContent value="medias" className="flex-1 mt-4">
        <MediaList
          addShape={addShape}
          onMediaSelect={(media) => {
            console.log("Média sélectionné:", media);
          }}
        />
      </TabsContent>
    </Tabs>
  );
}

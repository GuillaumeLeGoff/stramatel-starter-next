import React from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { Shapes, Image as ImageIcon, Database } from "lucide-react";
import { KonvaShapeSelector } from "./KonvaAddShapes";
import { MediaList } from "./MediaList";
import { DataViewer } from "./DataViewer";

interface TabsPanelProps {
  addShape: (
    shapeType: string,
    options?: { src?: string; name?: string; mediaId?: string }
  ) => Promise<void>;
  onMediaDeleted?: (mediaUrl: string) => Promise<void>;
  konvaData?: any;
}

export function TabsPanel({ addShape, onMediaDeleted, konvaData }: TabsPanelProps) {
  return (
    <Tabs defaultValue="shapes" className="h-full flex flex-col">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="shapes" className="flex items-center gap-2">
          <Shapes className="h-4 w-4" />
          Formes
        </TabsTrigger>
        <TabsTrigger value="medias" className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          Médias
        </TabsTrigger>
        <TabsTrigger value="data" className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          Data
        </TabsTrigger>
      </TabsList>

      <TabsContent value="shapes" className="flex-1 mt-4">
        <KonvaShapeSelector addShape={addShape} />
      </TabsContent>

      <TabsContent value="medias" className="flex-1 mt-4">
        <MediaList
          addShape={addShape}
          onMediaDeleted={onMediaDeleted}
          onMediaSelect={(media) => {
            console.log("Média sélectionné:", media);
          }}
        />
      </TabsContent>

      <TabsContent value="data" className="flex-1 mt-4">
        <DataViewer konvaData={konvaData} addShape={addShape} />
      </TabsContent>
    </Tabs>
  );
}

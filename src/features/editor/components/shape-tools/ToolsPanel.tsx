import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { ResizablePanel } from "@/shared/components/ui/resizable";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { Shapes, Image as ImageIcon, Database } from "lucide-react";
import { ShapeSelector } from "./ShapeSelector";
import { MediaManager } from "./MediaManager";
import { DataSelector } from "./DataSelector";
import { KonvaStage } from "@/features/editor/types";

interface ToolsPanelProps {
  addShape: (
    shapeType: string,
    options?: { src?: string; name?: string; mediaId?: string }
  ) => Promise<void>;
  onMediaDeleted?: (mediaUrl: string) => Promise<void>;
  konvaData?: KonvaStage | null;
}

/**
 * Panneau principal des outils d'ajout de contenu
 * Contient les onglets pour les formes, médias et données
 */
export function ToolsPanel({ 
  addShape, 
  onMediaDeleted,
  konvaData 
}: ToolsPanelProps) {
  return (
    <ResizablePanel defaultSize={20} minSize={15} maxSize={35}>
      <Card className="h-full rounded-none border-0 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Outils</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 h-full flex flex-col">
          <Tabs defaultValue="shapes" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger 
                value="shapes" 
                className="flex items-center gap-2 text-xs"
                title="Formes géométriques et éléments de base"
              >
                <Shapes className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Formes</span>
              </TabsTrigger>
              <TabsTrigger 
                value="medias" 
                className="flex items-center gap-2 text-xs"
                title="Images et vidéos"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Médias</span>
              </TabsTrigger>
              <TabsTrigger 
                value="data" 
                className="flex items-center gap-2 text-xs"
                title="Données dynamiques et temps réel"
              >
                <Database className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Données</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="shapes" className="h-full mt-0">
                <ShapeSelector addShape={addShape} />
              </TabsContent>

              <TabsContent value="medias" className="h-full mt-0">
                <MediaManager
                  addShape={addShape}
                  onMediaDeleted={onMediaDeleted}
                  onMediaSelect={(media) => {
                    console.log("Média sélectionné:", media);
                  }}
                />
              </TabsContent>

              <TabsContent value="data" className="h-full mt-0">
                <DataSelector konvaData={konvaData || undefined} addShape={addShape} />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </ResizablePanel>
  );
} 
import React from "react";
import { ResizablePanel, ResizablePanelGroup } from "@/shared/components/ui/resizable";
import { KonvaStage } from "@/features/editor/types";
import { HeaderEditorComponents } from "./HeaderEditorComponents";
import { FooterEditorComponents } from "./FooterEditorComponents";
import { KonvaStageRenderer } from "./KonvaStageRenderer";

interface EditorCanvasProps {
  konvaData: KonvaStage | null;
  scale: number;
  normalizedScale: number;
  zoomPercentage: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  width: number;
  height: number;
  zoomIn: () => void;
  zoomOut: () => void;
  fitToContainer?: () => void;
  currentSlideDuration?: number;
  onDurationChange: (duration: number) => void;
}

export function EditorCanvas({
  konvaData,
  scale,
  normalizedScale,
  zoomPercentage,
  containerRef,
  width,
  height,
  zoomIn,
  zoomOut,
  fitToContainer,
  currentSlideDuration,
  onDurationChange,
}: EditorCanvasProps) {
  return (
    <ResizablePanel defaultSize={60}>
      <ResizablePanelGroup direction="vertical">
        {/* Header de l'éditeur */}
        <ResizablePanel
          defaultSize={5}
          className="flex justify-end items-center border-b border"
        >
          <HeaderEditorComponents />
        </ResizablePanel>

        {/* Zone de canvas principale */}
        <ResizablePanel defaultSize={90}>
          <div className="flex flex-col h-full">
            <div
              className="flex-grow overflow-hidden relative"
              ref={containerRef}
            >
              <div className="h-full flex flex-col rounded-none border-0 shadow-none">
                <div className="flex-1 flex justify-center items-center">
                  {konvaData && (
                    <div
                      className="absolute origin-center transform-gpu"
                      style={{
                        transform: `scale(${scale})`,
                        width: `${konvaData.attrs.width}px`,
                        height: `${konvaData.attrs.height}px`,
                      }}
                    >
                      {/* Zones semi-transparentes pour délimiter la zone de travail */}
                      {/* Zone semi-transparente haut */}
                      <div
                        className="absolute bg-black/30"
                        style={{
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: `calc(50% - ${height / 2}px)`,
                        }}
                      />
                      
                      {/* Zone semi-transparente bas */}
                      <div
                        className="absolute bg-black/30"
                        style={{
                          bottom: 0,
                          left: 0,
                          width: "100%",
                          height: `calc(50% - ${height / 2}px)`,
                        }}
                      />
                      
                      {/* Zone semi-transparente gauche */}
                      <div
                        className="absolute bg-black/30"
                        style={{
                          top: `calc(50% - ${height / 2}px)`,
                          left: 0,
                          width: `calc(50% - ${width / 2}px)`,
                          height: `${height}px`,
                        }}
                      />

                      {/* Zone semi-transparente droite */}
                      <div
                        className="absolute bg-black/30"
                        style={{
                          top: `calc(50% - ${height / 2}px)`,
                          right: 0,
                          width: `calc(50% - ${width / 2}px)`,
                          height: `${height}px`,
                        }}
                      />

                      {/* Rendu du canvas Konva */}
                      <KonvaStageRenderer stageData={konvaData} scale={scale} />
                    </div>
                  )}
                  
                  {/* Message si pas de données Konva */}
                  {!konvaData && (
                    <div className="text-center text-muted-foreground">
                      <p>Sélectionnez une slide pour commencer l'édition</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ResizablePanel>

        {/* Footer de l'éditeur */}
        <ResizablePanel
          defaultSize={5}
          className="flex justify-end items-center border-t border"
        >
          <FooterEditorComponents
            scale={zoomPercentage}
            zoomIn={zoomIn}
            zoomOut={zoomOut}
            fitToContainer={fitToContainer}
            currentSlideDuration={currentSlideDuration}
            onDurationChange={onDurationChange}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </ResizablePanel>
  );
} 
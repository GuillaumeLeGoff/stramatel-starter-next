import React, { useEffect, useRef } from "react";
import { KonvaStageRenderer } from "./KonvaStageRenderer";
import { KonvaStage, SlidePreviewProps } from "../types";
import { Card, CardContent } from "@/shared/components/ui/card";
import { useSlide } from "../hooks/useSlide";

export function SlidePreview({
  slide,
  index,
  isActive = false,
  onClick,
}: SlidePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Convertir le konvaData du slide en KonvaStage
  let stageData: KonvaStage | null = null;
  
  if (slide.konvaData) {
    stageData = slide.konvaData as unknown as KonvaStage;
  } else {
    stageData = {
      width: 800,
      height: 600,
      attrs: {
        width: slide.width || 1920,
        height: slide.height || 1080,
      },
      className: "Stage",
      children: [
        {
          attrs: {},
          className: "Layer",
          children: [
            {
              attrs: {
                x: 100,
                y: 100,
                width: 300,
                height: 50,
                fontSize: 32,
                fontFamily: "Arial",
                fill: "#333333",
                align: "center",
                text: `Slide ${index + 1}`,
              },
              className: "Text",
            },
          ],
        },
      ],
    };
  }
  
  const { previewScale, viewportStageData } = useSlide({
    stageData,
    containerRef
  });

  useEffect(() => {
    if (stageData) {
      console.log("stageData", stageData);
    }
  }, [stageData]);

  if (!stageData || !viewportStageData) return null;

  return (
    <Card
      className={`cursor-pointer transition-all ${
        isActive ? "border-2 border-primary" : ""
      }`}
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div
          ref={containerRef}
          style={{
            width: "100%",
            height: "150px",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#00000069",
          }}
        >
          <div
            style={{
              transform: `scale(${previewScale})`,
              transformOrigin: "center",
              width: `${stageData.attrs.width}px`,
              height: `${stageData.attrs.height}px`,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: `${stageData.width}px`,
                height: `${stageData.height}px`,
                backgroundColor: "white",
              }}
            >
              <KonvaStageRenderer stageData={viewportStageData} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 
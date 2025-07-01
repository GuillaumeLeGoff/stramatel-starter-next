"use client";

import React from "react";
import { Text } from "react-konva";
import { useLiveText } from "../hooks/useLiveText";

interface PanelLiveTextProps {
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  id: string;
  type: "date" | "time" | "datetime" | 
        "currentDaysWithoutAccident" | "currentDaysWithoutAccidentWithStop" | 
        "currentDaysWithoutAccidentWithoutStop" | "recordDaysWithoutAccident" |
        "yearlyAccidentsCount" | "yearlyAccidentsWithStopCount" | 
        "yearlyAccidentsWithoutStopCount" | "monthlyAccidentsCount" |
        "lastAccidentDate" | "monitoringStartDate";
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  fontStyle?: string;
  align?: string;
}

export const PanelLiveText: React.FC<PanelLiveTextProps> = ({
  x,
  y,
  width = 200,
  height = 30,
  rotation = 0,
  id,
  type,
  fontSize = 16,
  fontFamily = "Arial",
  fill = "black",
  fontStyle,
  align,
}) => {
  const { currentText } = useLiveText({ type });

  return (
    <Text
      text={currentText}
      x={x}
      y={y}
      width={width}
      height={height}
      rotation={rotation}
      fontSize={fontSize}
      fontFamily={fontFamily}
      fontStyle={fontStyle}
      fill={fill}
      align={align}
      id={id}
    />
  );
}; 
import { Text as KonvaText } from "react-konva";
import React from "react";
import { useLiveText } from "@/features/panel/hooks/useLiveText";
import Konva from "konva";

// Types supportés par l'éditeur (avec les anciens types pour compatibilité)
type EditorLiveTextType = "date" | "time" | "datetime" | 
  "liveDate" | "liveTime" | "liveDateTime" |
  "currentDaysWithoutAccident" | "currentDaysWithoutAccidentWithStop" | 
  "currentDaysWithoutAccidentWithoutStop" | "recordDaysWithoutAccident" |
  "yearlyAccidentsCount" | "yearlyAccidentsWithStopCount" | 
  "yearlyAccidentsWithoutStopCount" | "monthlyAccidentsCount" |
  "lastAccidentDate" | "monitoringStartDate";

// Types supportés par le panel
type PanelLiveTextType = "date" | "time" | "datetime" | 
  "currentDaysWithoutAccident" | "currentDaysWithoutAccidentWithStop" | 
  "currentDaysWithoutAccidentWithoutStop" | "recordDaysWithoutAccident" |
  "yearlyAccidentsCount" | "yearlyAccidentsWithStopCount" | 
  "yearlyAccidentsWithoutStopCount" | "monthlyAccidentsCount" |
  "lastAccidentDate" | "monitoringStartDate";

interface KonvaLiveTextProps {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  fontSize: number;
  fontFamily: string;
  fontStyle?: string;
  fill: string;
  align: string;
  draggable?: boolean;
  type: EditorLiveTextType;
  onTransform?: (e: any) => void;
  onTransformEnd?: (e: any) => void;
  onDragStart?: (e: any) => void;
  onDragEnd?: (e: any) => void;
  onClick?: (e: any) => void;
  ref?: (node: Konva.Text | null) => void;
}

// ✅ Mapping des anciens types vers les nouveaux types du panel
const mapEditorTypeToPanelType = (editorType: EditorLiveTextType): PanelLiveTextType => {
  switch (editorType) {
    case "liveDate":
      return "date";
    case "liveTime":
      return "time";
    case "liveDateTime":
      return "datetime";
    default:
      return editorType as PanelLiveTextType;
  }
};

export const KonvaLiveText: React.FC<KonvaLiveTextProps> = ({
  id,
  x,
  y,
  width,
  height,
  rotation = 0,
  fontSize,
  fontFamily,
  fontStyle,
  fill,
  align,
  draggable = true,
  type,
  onTransform,
  onTransformEnd,
  onDragStart,
  onDragEnd,
  onClick,
  ref,
}) => {
  // ✅ Mapper le type de l'éditeur vers le type du panel
  const panelType = mapEditorTypeToPanelType(type);
  
  // ✅ Utiliser le même hook que le panel pour garantir la cohérence
  const { currentText } = useLiveText({ type: panelType });

  return (
    <KonvaText
      ref={ref}
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
      draggable={draggable}
      onTransform={onTransform}
      onTransformEnd={onTransformEnd}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
    />
  );
}; 
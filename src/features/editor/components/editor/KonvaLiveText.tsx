import React, { useEffect, useState, useRef } from "react";
import { Text } from "react-konva";
import Konva from "konva";
import { DigitalDisplayData } from "@/features/security/types";
import { securityDataCache } from "../../utils/securityDataCache";

interface KonvaLiveTextProps {
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
  draggable?: boolean;
  onTransform?: (e: Konva.KonvaEventObject<Event>) => void;
  onTransformEnd?: (e: Konva.KonvaEventObject<Event>) => void;
  onDragStart?: (e: Konva.KonvaEventObject<Event>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<Event>) => void;
  onClick?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  ref?: (node: Konva.Text | null) => void;
}

export const KonvaLiveText: React.FC<KonvaLiveTextProps> = ({
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
  draggable = true,
  onTransform,
  onTransformEnd,
  onDragStart,
  onDragEnd,
  onClick,
  ref,
}) => {
  const [currentText, setCurrentText] = useState("");
  const [securityData, setSecurityData] = useState<DigitalDisplayData | null>(null);
  const textRef = useRef<Konva.Text | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Transmettre la référence au parent
  useEffect(() => {
    if (ref && textRef.current) {
      ref(textRef.current);
    }
    return () => {
      if (ref) {
        ref(null);
      }
    };
  }, [ref]);

  // Récupérer les données de sécurité depuis le cache
  const fetchSecurityData = async () => {
    try {
      const data = await securityDataCache.getData();
      setSecurityData(data);
    } catch (error) {
      console.error('Erreur lors de la récupération des données de sécurité:', error);
    }
  };

  // Fonction pour formater le texte selon le type
  const formatText = () => {
    const now = new Date();
    
    switch (type) {
      case "date":
        return now.toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      case "time":
        return now.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      case "datetime":
        return now.toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) + ' à ' + now.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit'
        });
      
      // Données de sécurité depuis l'API
      case "currentDaysWithoutAccident":
        return securityData ? `${securityData.daysWithoutAccident}` : "--";
      case "currentDaysWithoutAccidentWithStop":
        return securityData ? `${securityData.daysWithoutAccidentWithStop}` : "--";
      case "currentDaysWithoutAccidentWithoutStop":
        return securityData ? `${securityData.daysWithoutAccidentWithoutStop}` : "--";
      case "recordDaysWithoutAccident":
        return securityData ? `${securityData.recordDaysWithoutAccident}` : "--";
      case "yearlyAccidentsCount":
        return securityData ? `${securityData.currentYearAccidents}` : "--";
      case "yearlyAccidentsWithStopCount":
        return securityData ? `${securityData.currentYearAccidentsWithStop}` : "--";
      case "yearlyAccidentsWithoutStopCount":
        return securityData ? `${securityData.currentYearAccidentsWithoutStop}` : "--";
      case "monthlyAccidentsCount":
        return securityData ? `${securityData.currentMonthAccidents}` : "--";
      case "lastAccidentDate":
        return securityData?.lastAccidentDate || "Aucun";
      case "monitoringStartDate":
        return securityData?.currentDate || "--/--/----";
      
      default:
        return "";
    }
  };

  // Déterminer si le type nécessite des données de sécurité
  const isSecurityType = (type: string) => {
    return [
      "currentDaysWithoutAccident", 
      "currentDaysWithoutAccidentWithStop",
      "currentDaysWithoutAccidentWithoutStop", 
      "recordDaysWithoutAccident",
      "yearlyAccidentsCount", 
      "yearlyAccidentsWithStopCount",
      "yearlyAccidentsWithoutStopCount", 
      "monthlyAccidentsCount",
      "lastAccidentDate", 
      "monitoringStartDate"
    ].includes(type);
  };

  // Mettre à jour le texte
  useEffect(() => {
    const updateText = () => {
      const formattedText = formatText();
      setCurrentText(formattedText);
    };

    let unsubscribe: (() => void) | null = null;

    if (isSecurityType(type)) {
      // Pour les données de sécurité, s'abonner au cache partagé
      unsubscribe = securityDataCache.subscribe((data) => {
        setSecurityData(data);
      });

      // Récupération initiale des données
      fetchSecurityData();
    } else {
      // Pour date/time, mise à jour immédiate
      updateText();

      // Intervalle de mise à jour pour date/time
      const updateInterval = type === "time" ? 1000 : 60000;
      intervalRef.current = setInterval(updateText, updateInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [type]);

  // UseEffect séparé pour mettre à jour le texte quand les données de sécurité changent
  useEffect(() => {
    if (isSecurityType(type)) {
      const formattedText = formatText();
      setCurrentText(formattedText);
    }
  }, [securityData]);

  return (
    <Text
      ref={textRef}
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
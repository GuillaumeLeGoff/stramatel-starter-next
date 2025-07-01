import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { DigitalDisplayData } from "@/features/security/types";
import { securityDataCache } from "../../editor/utils/securityDataCache";

type LiveTextType = "date" | "time" | "datetime" | 
  "currentDaysWithoutAccident" | "currentDaysWithoutAccidentWithStop" | 
  "currentDaysWithoutAccidentWithoutStop" | "recordDaysWithoutAccident" |
  "yearlyAccidentsCount" | "yearlyAccidentsWithStopCount" | 
  "yearlyAccidentsWithoutStopCount" | "monthlyAccidentsCount" |
  "lastAccidentDate" | "monitoringStartDate";

interface UseLiveTextProps {
  type: LiveTextType;
}

export function useLiveText({ type }: UseLiveTextProps) {
  const [currentText, setCurrentText] = useState("");
  const [securityData, setSecurityData] = useState<DigitalDisplayData | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Déterminer si le type nécessite des données de sécurité
  const isSecurityType = useMemo(() => {
    const securityTypes = [
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
    ];
    return securityTypes.includes(type);
  }, [type]);

  // Récupérer les données de sécurité depuis le cache
  const fetchSecurityData = useCallback(async () => {
    try {
      const data = await securityDataCache.getData();
      setSecurityData(data);
    } catch (error) {
      console.error('Erreur lors de la récupération des données de sécurité:', error);
    }
  }, []);

  // Fonction optimisée pour formater le texte selon le type
  const formatText = useCallback(() => {
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
      
      // Données de sécurité depuis l'API - nombres uniquement
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
  }, [type, securityData]);

  // Fonction optimisée pour mettre à jour le texte
  const updateText = useCallback(() => {
    const formattedText = formatText();
    setCurrentText(formattedText);
  }, [formatText]);

  // Calculer l'intervalle de mise à jour selon le type
  const updateInterval = useMemo(() => {
    return type === "time" ? 1000 : 60000;
  }, [type]);

  // Effet principal pour gérer les mises à jour
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    if (isSecurityType) {
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
      intervalRef.current = setInterval(updateText, updateInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [type, isSecurityType, fetchSecurityData, updateText, updateInterval]);

  // Effet séparé pour mettre à jour le texte quand les données de sécurité changent
  useEffect(() => {
    if (isSecurityType) {
      updateText();
    }
  }, [securityData, isSecurityType, updateText]);

  // Nettoyage à la destruction du composant
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    currentText,
    securityData,
    isSecurityType,
  };
} 
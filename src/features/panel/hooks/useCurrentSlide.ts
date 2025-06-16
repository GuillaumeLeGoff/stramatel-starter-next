"use client";

import { useEffect, useState } from "react";
import { socketClient, CurrentSlideData } from "@/lib/socket";

export function useCurrentSlide() {
  const [currentSlide, setCurrentSlide] = useState<CurrentSlideData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fonction de callback pour recevoir les données de slide
    const handleCurrentSlide = (data: CurrentSlideData | null) => {
      console.log("📡 WebSocket - Données reçues:", data );
      
      setCurrentSlide(data);
      setIsLoading(false);
    };

    // Fonction de callback pour la connexion
    const handleConnect = () => {
      setIsConnected(true);
      socketClient.requestCurrentSlide(); // Demander immédiatement la slide actuelle
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    // S'abonner aux événements
    socketClient.on("currentSlide", handleCurrentSlide);
    socketClient.on("connect", handleConnect);
    socketClient.on("disconnect", handleDisconnect);

    // Se connecter au WebSocket
    socketClient.connect();

    // Nettoyage
    return () => {
      socketClient.off("currentSlide", handleCurrentSlide);
      socketClient.off("connect", handleConnect);
      socketClient.off("disconnect", handleDisconnect);
    };
  }, []);

  const requestUpdate = () => {
    socketClient.requestCurrentSlide();
  };

  const slideProgress = currentSlide ? Math.min(100, Math.max(0, (currentSlide.elapsedInSlide / currentSlide.slideDuration) * 100)) : 0;
  const remainingTime = currentSlide ? Math.max(0, currentSlide.remainingInSlide) : 0;



  return {
    currentSlide,
    isConnected,
    isLoading,
    requestUpdate,
    // Utilitaires
    hasActiveSlide: currentSlide !== null,
    slideProgress,
    remainingTime,
    // Nouvelles infos d'enchaînement
    hasMultipleSlideshows: currentSlide ? currentSlide.totalSlideshows > 1 : false,
    currentSlideshowIndex: currentSlide ? currentSlide.currentSlideshowIndex : 0,
    totalSlideshows: currentSlide ? currentSlide.totalSlideshows : 0,
  };
} 
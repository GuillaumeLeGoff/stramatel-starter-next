"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { KonvaStage } from "@/features/editor/types";

interface KonvaSlideViewerProps {
  konvaData: KonvaStage;
  width?: number;
  height?: number;
}

// Hook pour détecter si nous sommes côté client
function useIsClient() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}

// Chargement dynamique du composant Konva côté client uniquement
const KonvaSlideViewerClient = dynamic(
  () => import("./KonvaSlideViewerClient"),
  {
    ssr: false,

  }
);

export function KonvaSlideViewer(props: KonvaSlideViewerProps) {
  const isClient = useIsClient();

  // Pendant l'hydratation, afficher un placeholder identique côté serveur et client

  // Une fois côté client, charger le vrai composant Konva
  return <KonvaSlideViewerClient {...props} />;
}

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
    loading: () => (
      <div className="w-full flex flex-col items-center">
        <div className="relative border-2 border-gray-300 rounded-lg overflow-auto bg-white shadow-lg">
          <div
            style={{ width: 1920, height: 1080 }}
            className="flex items-center justify-center"
          >
            <div className="text-gray-500">Chargement du contenu...</div>
          </div>
        </div>
      </div>
    ),
  }
);

export function KonvaSlideViewer(props: KonvaSlideViewerProps) {
  const isClient = useIsClient();

  // Pendant l'hydratation, afficher un placeholder identique côté serveur et client
  if (!isClient) {
    return (
      <div className="w-full flex flex-col items-center">
        <div className="relative border-2 border-gray-300 rounded-lg overflow-auto bg-white shadow-lg">
          <div
            style={{ width: 1920, height: 1080 }}
            className="flex items-center justify-center"
          >
            <div className="text-gray-500">Chargement du contenu...</div>
          </div>
        </div>
      </div>
    );
  }

  // Une fois côté client, charger le vrai composant Konva
  return <KonvaSlideViewerClient {...props} />;
}

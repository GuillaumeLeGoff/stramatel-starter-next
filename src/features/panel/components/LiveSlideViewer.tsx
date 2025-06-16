"use client";

import { useCurrentSlide } from "@/features/panel/hooks/useCurrentSlide";
import { MediaData } from "@/lib/socket";
import { KonvaSlideViewer } from "./KonvaSlideViewer";
import { KonvaStage } from "@/features/editor/types";

// Données Konva d'exemple
const EXAMPLE_KONVA_DATA: KonvaStage = {
  attrs: {
    width: 10000,
    height: 10000
  },
  className: "Stage",
  children: [
    {
      attrs: {},
      className: "Layer",
      children: [
        {
          attrs: {
            id: "rectangle_1749733444314_416",
            name: "Rectangle",
            draggable: true,
            x: 4900,
            y: 4950,
            width: 200,
            height: 100,
            fill: "#3B82F6",
            stroke: "#2563EB",
            strokeWidth: 2
          },
          className: "Rect"
        },
        {
          attrs: {
            id: "image_example_1",
            name: "Image Example",
            draggable: true,
            x: 4700,
            y: 4800,
            width: 300,
            height: 200,
            src: "https://picsum.photos/300/200?random=1"
          },
          className: "Image"
        },
        {
          attrs: {
            id: "text_example_1",
            name: "Text Example",
            draggable: true,
            x: 4850,
            y: 4750,
            width: 200,
            height: 40,
            text: "Exemple de texte",
            fontSize: 24,
            fontFamily: "Arial",
            fill: "#000000",
            align: "center"
          },
          className: "Text"
        }
      ]
    }
  ]
};

export function LiveSlideViewer() {
  const {
    currentSlide,
    isLoading,
    remainingTime
  } = useCurrentSlide();

  if (isLoading) {
    return <div className="p-4">Connexion...</div>;
  }

  if (!currentSlide) {
    return (
      <div >
       
          <KonvaSlideViewer 
            konvaData={EXAMPLE_KONVA_DATA}
          />
       </div>
    );
  }

  // Utiliser les données Konva de la slide ou l'exemple par défaut
  let konvaData: KonvaStage | null = null;
  
  if (currentSlide.konvaData) {
    try {
      konvaData = typeof currentSlide.konvaData === 'string' 
        ? JSON.parse(currentSlide.konvaData) 
        : currentSlide.konvaData as KonvaStage;
    } catch (error) {
      console.error('Erreur lors du parsing des données Konva:', error);
      konvaData = EXAMPLE_KONVA_DATA; // Utiliser l'exemple en cas d'erreur
    }
  } else {
    konvaData = EXAMPLE_KONVA_DATA; // Utiliser l'exemple si pas de données
  }

  return (
    <div className="p-6 border rounded-lg">
      {/* Nom du slideshow */}
      <h1 className="text-2xl font-bold mb-4">{currentSlide.slideshowName}</h1>
      
      {/* Slide actuelle */}
      <div className="mb-4">
        <p className="text-lg">
          Slide {currentSlide.slidePosition + 1} / {currentSlide.totalSlides}
        </p>
      </div>

      {/* Affichage Konva */}
      {konvaData && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Contenu Konva :</h3>
          <KonvaSlideViewer 
            konvaData={konvaData}
          />
        </div>
      )}

      {/* Médias de la slide */}
      {currentSlide.media && currentSlide.media.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Médias ({currentSlide.media.length}) :</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentSlide.media.map((media: MediaData) => (
              <div key={media.id} className="border rounded-lg overflow-hidden">
                {media.type === 'image' && (
                  <div>
                    <img 
                      src={`http://localhost:3000${media.path}`} 
                      alt={media.originalFileName}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-2">
                      <p className="text-sm font-medium">{media.originalFileName}</p>
                      <p className="text-xs text-gray-600">{media.format.toUpperCase()}</p>
                    </div>
                  </div>
                )}
                
                {media.type === 'video' && (
                  <div>
                    <video 
                      src={`http://localhost:3000${media.path}`}
                      controls
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-2">
                      <p className="text-sm font-medium">{media.originalFileName}</p>
                      <p className="text-xs text-gray-600">{media.format.toUpperCase()}</p>
                    </div>
                  </div>
                )}
                
                {media.type === 'audio' && (
                  <div className="p-4">
                    <audio 
                      src={`http://localhost:3000${media.path}`}
                      controls
                      className="w-full"
                    />
                    <div className="mt-2">
                      <p className="text-sm font-medium">{media.originalFileName}</p>
                      <p className="text-xs text-gray-600">{media.format.toUpperCase()}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Temps restant */}
      <div className="mb-4">
        <p className="text-xl font-mono">
          {Math.ceil(remainingTime)}s restantes
        </p>
      </div>

      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
          <p><strong>Debug:</strong></p>
          <p>Slide ID: {currentSlide.slideId}</p>
          <p>Médias: {currentSlide.media?.length || 0}</p>
          <p>KonvaData: {currentSlide.konvaData ? '✅' : '❌'}</p>
          {currentSlide.konvaData && (
            <div className="mt-2">
              <p><strong>Données Konva:</strong></p>
              <pre className="text-xs bg-gray-200 p-2 rounded mt-1 max-h-32 overflow-auto">
                {JSON.stringify(currentSlide.konvaData, null, 2)}
              </pre>
            </div>
          )}
          {currentSlide.media && currentSlide.media.length > 0 && (
            <div className="mt-2">
              <p><strong>Médias détails:</strong></p>
              {currentSlide.media.map((media, index) => (
                <p key={media.id}>
                  {index + 1}. {media.originalFileName} ({media.type}) - {media.path}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 
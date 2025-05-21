import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { slideStore } from "../store/slideStore";
import { useSlideshow } from "@/features/slideshow/hooks";
import { KonvaStage } from "../types";
import { updateSlide } from "../api/slideApi";

export function useEditor() {
  const {
    currentSlide,
    setCurrentSlide,
    isLoading,
    error,
    setLoading,
    setError,
  } = slideStore();
  const { currentSlideshow, updateCurrentSlideshow } = useSlideshow();
  const [scale, setScale] = useState(1);
  const [containerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Zoom minimum et maximum
  const ABSOLUTE_MIN_ZOOM = 0.3; // Fixé à 30%
  const MAX_ZOOM = 2;
  const ZOOM_STEP = 0.1;

  // Récupérer les données Konva du slide courant
  const getCurrentSlideKonvaData = useCallback((): KonvaStage | null => {
    if (
      !currentSlideshow ||
      !currentSlideshow.slides ||
      currentSlideshow.slides.length === 0
    ) {
      return null;
    }

    const slide = currentSlideshow.slides[currentSlide];
    if (!slide) return null;

    // Si le slide a des données Konva, les retourner
    if (slide.konvaData) {
      return slide.konvaData as unknown as KonvaStage;
    }

    // Sinon, créer un stage Konva par défaut
    return {
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
            
          ],
        },
      ],
    };
  }, [currentSlideshow, currentSlide]);

  // Obtenir le konvaData actuel (mémorisé)
  const currentKonvaData = useMemo(
    () => getCurrentSlideKonvaData(),
    [getCurrentSlideKonvaData]
  );

  // Calculer le zoom minimum en fonction des dimensions du conteneur et du canvas (mémorisé)
  const minZoom = useMemo(() => {
    if (!currentKonvaData || !containerSize.width || !containerSize.height)
      return ABSOLUTE_MIN_ZOOM;

    // Calculer le ratio pour que le canvas s'adapte à la largeur ou à la hauteur du conteneur
    const widthRatio = containerSize.width / currentKonvaData.attrs.width;
    const heightRatio = containerSize.height / currentKonvaData.attrs.height;

    // Utiliser le plus petit ratio pour que le canvas s'adapte entièrement,
    // mais ne jamais descendre en-dessous de la limite absolue (30%)
    return Math.max(Math.min(widthRatio, heightRatio), ABSOLUTE_MIN_ZOOM);
  }, [containerSize, currentKonvaData, ABSOLUTE_MIN_ZOOM]);

  // Changer de slide
  const changeSlide = useCallback(
    (slideIndex: number) => {
      if (!currentSlideshow || !currentSlideshow.slides) return;

      if (slideIndex >= 0 && slideIndex < currentSlideshow.slides.length) {
        setCurrentSlide(slideIndex);
      }
    },
    [currentSlideshow, setCurrentSlide]
  );

  // Ajuster le zoom si nécessaire lorsque le conteneur ou le slide change
  useEffect(() => {
    if (scale < minZoom) {
      setScale(minZoom);
    }
  }, [containerSize, currentSlide, minZoom, scale]);

  // Zoomer
  const zoomIn = useCallback(() => {
    setScale((prevScale) => Math.min(prevScale + ZOOM_STEP, MAX_ZOOM));
  }, [MAX_ZOOM, ZOOM_STEP]);

  // Dézoomer
  const zoomOut = useCallback(() => {
    setScale((prevScale) => Math.max(prevScale - ZOOM_STEP, minZoom));
  }, [minZoom, ZOOM_STEP]);

  // Réinitialiser le zoom au zoom minimum (fit)
  const resetZoom = useCallback(() => {
    setScale(minZoom);
  }, [minZoom]);

  // Adapter au conteneur (fit)
  const fitToContainer = useCallback(() => {
    setScale(minZoom);
  }, [minZoom]);

  // Définir un niveau de zoom spécifique
  const setZoom = useCallback(
    (newScale: number) => {
      setScale(Math.min(Math.max(newScale, minZoom), MAX_ZOOM));
    },
    [minZoom, MAX_ZOOM]
  );

  // Ajouter une forme au slide actuel
  const addShape = useCallback(
    async (shapeType: string) => {
      if (!currentSlideshow || !currentSlideshow.slides || !currentKonvaData)
        return;

      const currentSlideObj = currentSlideshow.slides[currentSlide];
      if (!currentSlideObj) return;

      // Créer un clone profond du konvaData actuel
      const updatedKonvaData = JSON.parse(JSON.stringify(currentKonvaData));

      // Générer un ID unique pour la forme
      const shapeId = `shape_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      // Déterminer les dimensions et la position de la nouvelle forme
      const centerX = updatedKonvaData.attrs.width / 2;
      const centerY = updatedKonvaData.attrs.height / 2;

      let newShape;

      switch (shapeType) {
        case "rectangle":
          newShape = {
            attrs: {
              x: centerX - 100,
              y: centerY - 50,
              width: 200,
              height: 100,
              fill: "#3B82F6",
              stroke: "#2563EB",
              strokeWidth: 2,
              id: shapeId,
              name: "Rectangle",
              draggable: true,
            },
            className: "Rect",
          };
          break;

        case "circle":
          newShape = {
            attrs: {
              x: centerX,
              y: centerY,
              radius: 50,
              fill: "#10B981",
              stroke: "#059669",
              strokeWidth: 2,
              id: shapeId,
              name: "Cercle",
              draggable: true,
            },
            className: "Circle",
          };
          break;

        case "text":
          newShape = {
            attrs: {
              x: centerX - 100,
              y: centerY - 25,
              width: 200,
              height: 50,
              text: "Nouveau texte",
              fontSize: 20,
              fontFamily: "Arial",
              fill: "#000000",
              align: "center",
              id: shapeId,
              name: "Texte",
              draggable: true,
            },
            className: "Text",
          };
          break;

        case "line":
          newShape = {
            attrs: {
              points: [centerX - 100, centerY, centerX + 100, centerY],
              stroke: "#000000",
              strokeWidth: 4,
              id: shapeId,
              name: "Ligne",
              draggable: true,
            },
            className: "Line",
          };
          break;

        case "arrow":
          newShape = {
            attrs: {
              points: [centerX - 100, centerY, centerX + 100, centerY],
              stroke: "#000000",
              strokeWidth: 4,
              pointerLength: 10,
              pointerWidth: 10,
              id: shapeId,
              name: "Flèche",
              draggable: true,
            },
            className: "Arrow",
          };
          break;

        case "image":
          newShape = {
            attrs: {
              x: centerX - 100,
              y: centerY - 75,
              width: 200,
              height: 150,
              id: shapeId,
              name: "Image",
              draggable: true,
            },
            className: "Image",
          };
          break;

        case "chart":
          // Pour un graphique, on peut créer un groupe avec plusieurs formes
          newShape = {
            attrs: {
              x: centerX - 150,
              y: centerY - 100,
              width: 300,
              height: 200,
              id: shapeId,
              name: "Graphique",
              draggable: true,
            },
            className: "Group",
            children: [
              {
                attrs: {
                  width: 300,
                  height: 200,
                  fill: "#F9FAFB",
                  stroke: "#E5E7EB",
                  strokeWidth: 1,
                },
                className: "Rect",
              },
              {
                attrs: {
                  points: [10, 190, 10, 10, 290, 10],
                  stroke: "#9CA3AF",
                  strokeWidth: 2,
                },
                className: "Line",
              },
              // Graphique exemple
              {
                attrs: {
                  points: [30, 150, 90, 100, 150, 130, 210, 50, 270, 90],
                  stroke: "#3B82F6",
                  strokeWidth: 3,
                  tension: 0.3,
                  lineCap: "round",
                  lineJoin: "round",
                },
                className: "Line",
              },
            ],
          };
          break;

        default:
          return; // Sortir si le type n'est pas géré
      }

      // Ajouter la nouvelle forme à la première couche
      if (updatedKonvaData.children && updatedKonvaData.children.length > 0) {
        updatedKonvaData.children[0].children.push(newShape);
      } else {
        // Si pour une raison quelconque il n'y a pas de couche, en créer une
        updatedKonvaData.children = [
          {
            attrs: {},
            className: "Layer",
            children: [newShape],
          },
        ];
      }

      // Mettre à jour le slideshow avec les nouvelles données Konva
      if (updateCurrentSlideshow) {
        updateCurrentSlideshow((prev) => {
          const updatedSlides = [...(prev.slides || [])];
          if (updatedSlides[currentSlide]) {
            updatedSlides[currentSlide].konvaData = updatedKonvaData;
          }
          return {
            ...prev,
            slides: updatedSlides,
          };
        });
      }

      console.log(`Forme ${shapeType} ajoutée avec l'ID ${shapeId}`);
      
      // Enregistrer dans l'API
      try {
        const slideId = currentSlideObj.id;
        if (slideId) {
          await updateSlide(slideId, { konvaData: updatedKonvaData });
          console.log("Données Konva après ajout de forme sauvegardées dans l'API");
        }
      } catch (error) {
        console.error("Erreur lors de la sauvegarde après ajout de forme:", error);
      }
    },
    [currentSlideshow, currentSlide, currentKonvaData, updateCurrentSlideshow]
  );

  // Sauvegarder les données Konva du slide courant
  const saveCurrentSlideKonvaData = useCallback(
    async (updatedKonvaData: KonvaStage) => {
      if (!currentSlideshow || !updateCurrentSlideshow) return;

      updateCurrentSlideshow((prev) => {
        const updatedSlides = [...(prev.slides || [])];
        if (updatedSlides[currentSlide]) {
          updatedSlides[currentSlide].konvaData = updatedKonvaData;
        }
        return {
          ...prev,
          slides: updatedSlides,
        };
      });

      // Enregistrer dans l'API après mise à jour du state local
      try {
        const slideId = currentSlideshow.slides?.[currentSlide]?.id;
        if (slideId) {
          await updateSlide(slideId, { konvaData: updatedKonvaData });
          console.log("Données Konva sauvegardées dans l'API");
        }
      } catch (error) {
        console.error("Erreur lors de la sauvegarde des données Konva:", error);
      }
    },
    [currentSlideshow, currentSlide, updateCurrentSlideshow]
  );

  return {
    currentSlide,
    isLoading,
    error,
    scale,
    containerRef,
    changeSlide,
    setLoading,
    setError,
    getCurrentSlideKonvaData,
    saveCurrentSlideKonvaData,
    zoomIn,
    zoomOut,
    resetZoom,
    setZoom,
    fitToContainer,
    minZoom,
    addShape,
  };
}

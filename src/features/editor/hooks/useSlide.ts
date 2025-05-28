import { useCallback, useEffect, useState } from "react";
import {
  createSlide,
  deleteSlide as deleteSlideAPI,
  updateSlide,
  associateMediaToSlide,
} from "../api/slideApi";
import { KonvaStage, Slide } from "../types";
import { slideStore } from "../store/slideStore";
import { useSlideshow } from "@/features/slideshow/hooks";
import { SlideshowSlide } from "@/features/slideshow/types";
import { arrayMove } from "@dnd-kit/sortable";
import { DragEndEvent } from "@dnd-kit/core";
import { cleanMediaFromKonvaData } from "../utils";

interface UseSlideProps {
  stageData: KonvaStage | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function useSlide({ stageData, containerRef }: UseSlideProps) {
  const [previewScale, setPreviewScale] = useState(0.2);
  const { setCurrentSlide, currentSlide } = slideStore();
  const { updateCurrentSlideshow, currentSlideshow } = useSlideshow();

  // ===== SAUVEGARDE KONVA =====

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
        }
      } catch (error) {
        console.error("Erreur lors de la sauvegarde des données Konva:", error);
      }
    },
    [currentSlideshow, currentSlide, updateCurrentSlideshow]
  );

  // ===== NETTOYAGE DES MÉDIAS =====

  // Nettoyer un média supprimé de toutes les slides du slideshow actuel
  const cleanMediaFromAllSlides = useCallback(
    async (mediaUrl: string) => {
      if (!currentSlideshow || !updateCurrentSlideshow) return;

      try {
        // Nettoyer toutes les slides du slideshow actuel
        const updatedSlides = currentSlideshow.slides?.map((slide) => {
          if (!slide.konvaData) return slide;

          // Nettoyer les données Konva de cette slide
          const cleanedKonvaData = cleanMediaFromKonvaData(slide.konvaData as any, mediaUrl);
          
          return {
            ...slide,
            konvaData: cleanedKonvaData,
          };
        }) || [];

        // Mettre à jour le slideshow avec toutes les slides nettoyées
        updateCurrentSlideshow((prev) => ({
          ...prev,
          slides: updatedSlides,
        }));

        // Sauvegarder chaque slide modifiée dans l'API
        const updatePromises = updatedSlides.map(async (slide) => {
          if (slide.konvaData) {
            try {
              await updateSlide(slide.id, { konvaData: slide.konvaData });
            } catch (error) {
              console.error(`Erreur lors de la sauvegarde de la slide ${slide.id}:`, error);
            }
          }
        });

        await Promise.all(updatePromises);
        
        console.log(`Média ${mediaUrl} nettoyé de toutes les slides du slideshow`);
      } catch (error) {
        console.error("Erreur lors du nettoyage du média de toutes les slides:", error);
      }
    },
    [currentSlideshow, updateCurrentSlideshow]
  );

  // ===== AJOUT DE FORMES =====

  // Ajouter une forme au slide actuel
  const addShape = useCallback(
    async (shapeType: string, options?: { src?: string; name?: string; mediaId?: string }) => {
      if (!currentSlideshow || !currentSlideshow.slides || !stageData) return;

      const currentSlideObj = currentSlideshow.slides[currentSlide];
      if (!currentSlideObj) return;

      // Créer un clone profond du konvaData actuel
      const updatedKonvaData = JSON.parse(JSON.stringify(stageData));

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
              wrap: "word",
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
              src: options?.src || "/placeholder-image.jpg",
              id: shapeId,
              name: options?.name || "Image",
              draggable: true,
            },
            className: "Image",
          };
          break;

        case "video":
          newShape = {
            attrs: {
              x: centerX - 100,
              y: centerY - 75,
              width: 200,
              height: 150,
              src: options?.src || "/placeholder-video.mp4",
              id: shapeId,
              name: options?.name || "Vidéo",
              draggable: true,
            },
            className: "Video",
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

      // Sauvegarder les modifications
      await saveCurrentSlideKonvaData(updatedKonvaData);

      // Si c'est un média (image ou vidéo), l'associer à la slide
      if ((shapeType === "image" || shapeType === "video") && options?.mediaId) {
        try {
          await associateMediaToSlide(currentSlideObj.id, parseInt(options.mediaId));
        } catch (error) {
          console.error("Erreur lors de l'association du média à la slide:", error);
        }
      }

      console.log(`Forme ${shapeType} ajoutée avec l'ID ${shapeId}`);
    },
    [currentSlideshow, currentSlide, stageData, saveCurrentSlideKonvaData]
  );

  // ===== PREVIEW ET ÉCHELLE =====

  // Calculer l'échelle appropriée en fonction des dimensions du conteneur
  const calculateScale = useCallback(() => {
    if (!containerRef.current || !stageData) return;

    const container = containerRef.current;

    // Obtenir les dimensions du conteneur
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Calculer le ratio pour adapter le canvas au conteneur
    const scaleX = containerWidth / stageData.width;
    const scaleY = containerHeight / stageData.height;

    // Utiliser le plus petit ratio pour s'assurer que tout est visible
    const newScale = Math.min(scaleX, scaleY) * 0.9; // 90% pour une petite marge

    setPreviewScale(newScale);
  }, [containerRef, stageData]);

  // Mettre à jour l'échelle lorsque les dimensions changent
  useEffect(() => {
    if (!stageData) return;

    // Calculer l'échelle initiale
    calculateScale();

    return () => {
      window.removeEventListener("resize", calculateScale);
    };
  }, [stageData, calculateScale]);

  // Créer une version modifiée du stageData pour n'afficher que la zone centrale
  const createViewportStageData = useCallback(() => {
    if (!stageData) return null;

    return {
      ...stageData,
      // Utiliser les dimensions du viewport (800x600)
      width: stageData.width,
      height: stageData.height,
      attrs: {
        // Pour le rendu, on maintient les dimensions du viewport
        width: stageData.width,
        height: stageData.height,
        x: 0,
        y: 0,
      },
      className: "Stage",
      // Ajuster les positions des enfants pour centrer la vue
      children: stageData.children.map((layer) => ({
        ...layer,
        attrs: { ...layer.attrs },
        children: layer.children.map((child) => {
          const centerOffsetX = (stageData.attrs.width - stageData.width) / 2;
          const centerOffsetY = (stageData.attrs.height - stageData.height) / 2;

          return {
            ...child,
            attrs: {
              ...child.attrs,
              // Ajuster la position pour que seule la partie centrale soit visible
              // (soustrait le décalage pour centrer la vue)
              x: child.attrs.x ? child.attrs.x - centerOffsetX : 0,
              y: child.attrs.y ? child.attrs.y - centerOffsetY : 0,
            },
          };
        }),
      })),
    } as KonvaStage;
  }, [stageData]);

  // ===== CRUD DES SLIDES =====

  /**
   * Crée une nouvelle slide via l'API et l'ajoute au slideshow actuel
   */
  const addSlide = async (slideData: Partial<Slide>) => {
    try {
      // 1. Créer la slide dans la base de données via l'API
      const newSlide = await createSlide(slideData);

      // 2. Mettre à jour le slideshow actuel avec la nouvelle slide
      if (currentSlideshow && updateCurrentSlideshow) {
        updateCurrentSlideshow((prev) => ({
          ...prev,
          slides: prev.slides ? [...prev.slides, newSlide] : [newSlide],
        }));
      }

      // 3. Mettre à jour la slide courante dans le store pour qu'elle soit active
      setCurrentSlide(currentSlideshow?.slides?.length || 0);

      return newSlide;
    } catch (error) {
      console.error("Erreur lors de la création de la slide", error);
      throw error;
    }
  };

  /**
   * Supprime une slide via l'API et la retire du slideshow actuel
   */
  const deleteSlide = async (slideId: number) => {
    if (!currentSlideshow || !updateCurrentSlideshow) return;

    try {
      // 1. Supprimer la slide dans la base de données via l'API
      await deleteSlideAPI(slideId);

      // 2. Mettre à jour le slideshow actuel en supprimant la slide
      updateCurrentSlideshow((prev) => ({
        ...prev,
        slides: prev.slides
          ? prev.slides.filter((slide) => slide.id !== slideId)
          : [],
      }));

      // 3. Si nous avons des slides restantes et que l'index actuel est hors limites, ajustez-le
      if (currentSlideshow.slides && currentSlideshow.slides.length > 0) {
        const currentIndex = slideStore.getState().currentSlide;
        const newLength = currentSlideshow.slides.length - 1;

        if (currentIndex >= newLength) {
          setCurrentSlide(Math.max(0, newLength - 1));
        }
      }

      return true;
    } catch (error) {
      console.error("Erreur lors de la suppression de la slide", error);
      return false;
    }
  };

  // ===== DRAG & DROP =====

  /**
   * Met à jour l'ordre des slides après un déplacement par drag and drop
   */
  const updateSlidesOrder = useCallback(
    async (slides: SlideshowSlide[]) => {
      if (!currentSlideshow || !updateCurrentSlideshow) return;

      try {
        // Mettre à jour le slideshow actuel avec les nouvelles positions
        updateCurrentSlideshow((prev) => ({
          ...prev,
          slides: slides,
        }));
        // Créer un tableau de promesses pour mettre à jour toutes les slides en parallèle
        const updatePromises = slides.map((slide, index) =>
          updateSlide(slide.id, { position: index })
        );

        // Attendre que toutes les mises à jour soient terminées
        await Promise.all(updatePromises);

        return true;
      } catch (error) {
        console.error(
          "Erreur lors de la mise à jour de l'ordre des slides",
          error
        );
        return false;
      }
    },
    [currentSlideshow, updateCurrentSlideshow]
  );

  /**
   * Gère la fin d'un drag-and-drop et réorganise les slides
   */
  const handleDragEnd = useCallback(
    (
      event: DragEndEvent,
      slides: SlideshowSlide[],
      onChangeSlide?: (index: number) => void
    ) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = slides.findIndex(
          (slide) => slide.id.toString() === active.id
        );
        const newIndex = slides.findIndex(
          (slide) => slide.id.toString() === over.id
        );

        // Réorganiser les slides
        const newSlides = arrayMove(slides, oldIndex, newIndex);

        // Mettre à jour les positions et sauvegarder
        updateSlidesOrder(newSlides);

        // Si la slide actuelle a été déplacée, mettre à jour l'index
        if (oldIndex === currentSlide && onChangeSlide) {
          onChangeSlide(newIndex);
        }
      }
    },
    [currentSlide, updateSlidesOrder]
  );

  // ===== MISE À JOUR DE LA DURÉE =====

  /**
   * Met à jour la durée d'une slide
   */
  const updateSlideDuration = async (slideId: number, duration: number) => {
    if (!currentSlideshow || !updateCurrentSlideshow) return;

    try {
      // 1. Mettre à jour la slide dans la base de données via l'API
      await updateSlide(slideId, { duration });

      // 2. Mettre à jour le slideshow actuel avec la nouvelle durée
      updateCurrentSlideshow((prev) => ({
        ...prev,
        slides: prev.slides
          ? prev.slides.map((slide) =>
              slide.id === slideId ? { ...slide, duration } : slide
            )
          : [],
      }));

      return true;
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la durée", error);
      return false;
    }
  };

  return {
    // Sauvegarde Konva
    saveCurrentSlideKonvaData,

    // Nettoyage des médias
    cleanMediaFromAllSlides,

    // Ajout de formes
    addShape,

    // Preview et échelle
    previewScale,
    viewportStageData: createViewportStageData(),

    // CRUD des slides
    addSlide,
    deleteSlide,

    // Mise à jour de la durée
    updateSlideDuration,

    // Drag & drop
    updateSlidesOrder,
    handleDragEnd,
  };
}

import { useSlideshow } from "@/features/slideshow/hooks";
import { useCallback, useMemo, useRef } from "react";
import { updateSlide } from "../api/slideApi";
import { slideStore } from "../store/slideStore";
import { KonvaStage } from "../types";

export function useEditor() {
  const {
    currentSlide,
    setCurrentSlide,
    isLoading,
    setLoading,
    error,
    setError,
    selectedShapes,
    setSelectedShapes,
  } = slideStore();

  const { currentSlideshow, updateCurrentSlideshow } = useSlideshow();

  const containerRef = useRef<HTMLDivElement>(null);



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

  // Changer de slide
  const changeSlide = useCallback(
    (slideIndex: number) => {
      if (!currentSlideshow || !currentSlideshow.slides) return;

      if (slideIndex >= 0 && slideIndex < currentSlideshow.slides.length) {
        // Réinitialiser les formes sélectionnées lors d'un changement de slide
        setSelectedShapes([]);
        setCurrentSlide(slideIndex);
      }
    },
    [currentSlideshow, setCurrentSlide, setSelectedShapes]
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
        }
      } catch (error) {
        console.error("Erreur lors de la sauvegarde des données Konva:", error);
      }
    },
    [currentSlideshow, currentSlide, updateCurrentSlideshow]
  );

  // Mettre à jour une forme sélectionnée
  const updateSelectedShape = useCallback(
    async (updatedAttrs: Record<string, unknown>) => {
      if (!selectedShapes || selectedShapes.length === 0 || !currentKonvaData) return;
      
      // Créer un clone profond du konvaData actuel
      const updatedKonvaData = JSON.parse(JSON.stringify(currentKonvaData));
      
      // Récupérer tous les IDs des formes sélectionnées
      const selectedIds = selectedShapes.map(shape => shape.attrs.id);
      
      // Fonction récursive pour trouver et mettre à jour les formes sélectionnées
      const updateShapes = (nodes: Array<Record<string, unknown>>): boolean => {
        let found = false;
        
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          
          // Vérifier si c'est une des formes que nous cherchons (par ID)
          if (node.attrs && selectedIds.includes((node.attrs as Record<string, unknown>).id)) {
            // Mettre à jour les attributs
            nodes[i].attrs = {
              ...node.attrs,
              ...updatedAttrs,
            };
            found = true;
          }
          
          // Vérifier les enfants si ce nœud en a
          if (node.children && Array.isArray(node.children) && node.children.length > 0) {
            const foundInChildren: boolean = updateShapes(node.children as Array<Record<string, unknown>>);
            found = found || foundInChildren;
          }
        }
        
        return found;
      };
      
      // Mettre à jour les formes dans l'arbre
      if (updatedKonvaData.children) {
        updateShapes(updatedKonvaData.children as Array<Record<string, unknown>>);
      }
      
      // Enregistrer les modifications
      await saveCurrentSlideKonvaData(updatedKonvaData);
      
      // Mettre à jour l'état local des formes sélectionnées
      const updatedSelectedShapes = selectedShapes.map(shape => ({
        ...shape,
        attrs: {
          ...shape.attrs,
          ...updatedAttrs,
        },
      }));
      
      setSelectedShapes(updatedSelectedShapes);
      
      console.log("Formes mises à jour avec les attributs:", updatedAttrs);
    },
    [selectedShapes, currentKonvaData, saveCurrentSlideKonvaData]
  );

  return {
    currentSlide,
    isLoading,
    error,
    containerRef,
    changeSlide,
    setLoading,
    setError,
    getCurrentSlideKonvaData,
    saveCurrentSlideKonvaData,
    addShape,
    selectedShapes,
    setSelectedShapes,
    updateSelectedShape,
  };
}

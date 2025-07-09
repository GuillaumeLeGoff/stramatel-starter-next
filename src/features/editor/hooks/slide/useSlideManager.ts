import { useCallback, useEffect, useState, useMemo } from "react";
import {
  createSlide,
  deleteSlide as deleteSlideAPI,
  updateSlide,
  associateMediaToSlide,
} from "../../api/slideApi";
import { KonvaStage, KonvaShape, Slide, ShapeType } from "../../types"; // ✅ Ajout de KonvaShape
import { useEditorStore, editorSelectors } from "../../store/editorStore";
import { useSlideshow } from "@/features/slideshow/hooks";
import { SlideshowSlide } from "@/features/slideshow/types";
import { arrayMove } from "@dnd-kit/sortable";
import { DragEndEvent } from "@dnd-kit/core";
import { cleanMediaFromKonvaData, createShape, getStageCenter, calculateImageDimensions, loadImageDimensions, createDefaultKonvaStage, generateShapeId } from "../../utils";
import { useAppSettingsStore } from "@/shared/store/appSettingsStore";

interface UseSlideProps {
  stageData: KonvaStage | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
  scale?: number;
}

interface AddSlideConfig {
  slideshowId: number;
  position: number;
  duration: number;
  width: number;
  height: number;
}

export function useSlideManager({ stageData, containerRef, scale }: UseSlideProps) {
  const [previewScale, setPreviewScale] = useState(0.2);
  const currentSlide = useEditorStore(editorSelectors.currentSlide);
  const setCurrentSlide = useEditorStore((state) => state.setCurrentSlide);
  const setSaveFunction = useEditorStore((state) => state.setSaveFunction);
  const { updateCurrentSlideshow, currentSlideshow } = useSlideshow();
  const { settings, fetchSettings } = useAppSettingsStore();
  
  // ✅ SOLUTION: Charger les settings avec dépendances optimisées
  useEffect(() => {
    // ✅ Vérifier directement si settings est null/undefined (valeur primitive)
    if (!settings) {
      fetchSettings();
    }
  }, [settings, fetchSettings]); // ✅ Ajouter fetchSettings dans les dépendances
  
  // ✅ Récupérer les dimensions avec useMemo optimisé
  const dimensions = useMemo(() => {
    // ✅ Créer l'objet directement dans useMemo avec des valeurs primitives
    return {
      width: settings?.width || 1920,
      height: settings?.height || 1080,
    };
  }, [settings?.width, settings?.height]); // ✅ Dépendances primitives stables

  // ===== SAUVEGARDE KONVA =====

  // Sauvegarder les données Konva du slide courant
  const saveCurrentSlideKonvaData = useCallback(
    async (updatedKonvaData: KonvaStage, options?: { skipHistory?: boolean }) => {
      if (!currentSlideshow || !updateCurrentSlideshow) return;

      // 1. Mettre à jour le cache Konva du store d'édition IMMÉDIATEMENT pour l'affichage
      if (options?.skipHistory) {
        // Pendant les transformations continues, mettre à jour directement le cache sans historique
        const cacheKonvaData = useEditorStore.getState().cacheKonvaData;
        cacheKonvaData(currentSlide, updatedKonvaData);
      } else {
        // Pour les modifications finales, utiliser l'historique
        const setPresentState = useEditorStore.getState().setPresentState;
        const currentCache = useEditorStore.getState().konvaDataCache;
        const newCache = new Map(currentCache);
        newCache.set(currentSlide, updatedKonvaData);
        setPresentState({ konvaDataCache: newCache });
      }

      // 2. Mettre à jour le slideshow local
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

      // 3. Enregistrer dans l'API après mise à jour du state local
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

  // ✅ Configurer la fonction de sauvegarde avec dépendances optimisées
  useEffect(() => {
    setSaveFunction(saveCurrentSlideKonvaData);
    
    // Nettoyer en cas de démontage
    return () => setSaveFunction(null);
  }, [saveCurrentSlideKonvaData, setSaveFunction]); // ✅ Ajouter toutes les dépendances

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

        // *** CORRECTION : Mettre à jour le cache Konva pour le slide courant ***
        const currentSlideData = updatedSlides[currentSlide];
        if (currentSlideData?.konvaData) {
          const cacheKonvaData = useEditorStore.getState().cacheKonvaData;
          cacheKonvaData(currentSlide, currentSlideData.konvaData as KonvaStage);
        }

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

        console.log(`✅ Média ${mediaUrl} nettoyé de toutes les slides`);
      } catch (error) {
        console.error("Erreur lors du nettoyage du média:", error);
        throw error;
      }
    },
    [currentSlideshow, updateCurrentSlideshow, currentSlide] // ✅ Ajouter currentSlideshow au lieu de ses propriétés
  );

  // ===== AJOUT DE FORMES =====

  // Ajouter une forme au canvas
  const addShape = useCallback(
    async (
      shapeType: string, // ✅ Accepter string comme l'interface l'attend
      options?: { x?: number; y?: number; mediaId?: string; src?: string; name?: string; autoResize?: boolean }
    ) => {
      if (!currentSlideshow || !stageData) return;

      const currentSlideObj = currentSlideshow.slides?.[currentSlide];
      if (!currentSlideObj) {
        console.error("Slide courante non trouvée");
        return;
      }

      // ✅ Calculer le centre du stage complet, pas seulement de la zone visible
      const stageCenterX = stageData.attrs.width / 2;
      const stageCenterY = stageData.attrs.height / 2;

      // ✅ Créer la nouvelle shape directement dans la fonction
      const newShape: KonvaShape = createShape(
        shapeType as ShapeType, // ✅ Cast en ShapeType pour createShape
        options?.x ?? stageCenterX,
        options?.y ?? stageCenterY,
        dimensions.width,
        dimensions.height
      );

      // ✅ Ajouter les propriétés supplémentaires pour les médias
      if ((shapeType === "image" || shapeType === "video") && options?.src) {
        console.log(`📹 Ajout de la propriété src à la shape ${shapeType}:`, {
          shapeType,
          src: options.src,
          shapeId: newShape.attrs.id,
          autoResize: options.autoResize,
        });
        newShape.attrs = {
          ...newShape.attrs,
          src: options.src,
          autoResize: options.autoResize || false,
          // Ajouter l'id généré si pas déjà présent
          id: newShape.attrs.id || generateShapeId(shapeType === "image" ? "img" : "vid"),
          draggable: true,
        };
        console.log(`✅ Shape ${shapeType} créée avec attrs:`, newShape.attrs);
      }

      // ✅ Créer le nouvel état directement dans la fonction
      const updatedStageData: KonvaStage = {
        ...stageData,
        children: stageData.children.map((layer, layerIndex) => {
          if (layerIndex === 0) {
            return {
              ...layer,
              children: [...(layer.children || []), newShape],
            };
          }
          return layer;
        }),
      };

      // Sauvegarder les nouvelles données
      await saveCurrentSlideKonvaData(updatedStageData);

      // Si c'est un média (image ou vidéo), l'associer à la slide
      if ((shapeType === "image" || shapeType === "video") && options?.mediaId) {
        try {
          await associateMediaToSlide(currentSlideObj.id, parseInt(options.mediaId));
        } catch (error) {
          console.error("Erreur lors de l'association du média à la slide:", error);
        }
      }

      // Sélectionner automatiquement la nouvelle shape créée
      const setSelectedShapes = useEditorStore.getState().setSelectedShapes;
      setSelectedShapes([newShape]);

    },
    [currentSlideshow, currentSlide, stageData, saveCurrentSlideKonvaData, dimensions] // ✅ Ajouter currentSlideshow et toutes les dépendances
  );

  // ===== CALCUL DE SCALE =====

  // Calculer l'échelle de prévisualisation
  const calculateScale = useCallback(
    () => {
      if (!containerRef.current || !stageData) return;

      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight - 64; // Réserver 64px pour les contrôles
      
      // Calculer l'échelle pour que la slide tienne dans le conteneur
      const scaleX = containerWidth / dimensions.width;
      const scaleY = containerHeight / dimensions.height;
      const scale = Math.min(scaleX, scaleY, 0.3); // Maximum 30% pour la prévisualisation
      
      setPreviewScale(scale);
    },
    [containerRef, stageData, dimensions] // ✅ Ajouter toutes les dépendances
  );

  // ✅ Mettre à jour l'échelle avec dépendances optimisées
  useEffect(() => {
    if (!stageData) return;

    // ✅ Créer la fonction resize directement dans useEffect
    const handleResize = () => {
      calculateScale();
    };

    // Calculer l'échelle initiale
    calculateScale();

    // Ajouter l'écouteur de resize
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [stageData, calculateScale]); // ✅ calculateScale est maintenant stable grâce à useCallback

  // Créer une version modifiée du stageData pour n'afficher que la zone centrale
  const createViewportStageData = useCallback(() => {
    if (!stageData) return null;

    return {
      ...stageData,
      width: stageData.attrs.width,
      height: stageData.attrs.height,
      attrs: {
        // Pour le rendu, on maintient les dimensions du viewport
        width: dimensions.width,
        height: dimensions.height,
        x: 0,
        y: 0,
      },
      className: "Stage",
      // Ajuster les positions des enfants pour centrer la vue
      children: stageData.children.map((layer) => ({
        ...layer,
        attrs: { ...layer.attrs },
        children: layer.children.map((child) => {
          const centerOffsetX = (stageData.attrs.width - dimensions.width) / 2;
          const centerOffsetY = (stageData.attrs.height - dimensions.height) / 2;

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
  }, [stageData, dimensions.width, dimensions.height]);

  // ===== CRUD DES SLIDES =====

  /**
   * Crée une nouvelle slide via l'API et l'ajoute au slideshow actuel
   */
  const addSlide = async (slideData: Partial<Slide>) => {
    try {
      // 1. Créer des données Konva par défaut si elles ne sont pas fournies
      const konvaData = slideData.konvaData || createDefaultKonvaStage();
      
      // 2. Créer la slide dans la base de données via l'API avec les données Konva
      const newSlide = await createSlide({
        ...slideData,
        konvaData
      });

      // 3. Mettre à jour le slideshow actuel avec la nouvelle slide
      if (currentSlideshow && updateCurrentSlideshow) {
        updateCurrentSlideshow((prev) => ({
          ...prev,
          slides: prev.slides ? [...prev.slides, newSlide] : [newSlide],
        }));
      }

      // 4. Mettre à jour la slide courante dans le store pour qu'elle soit active et vider la sélection
      const changeSlide = useEditorStore.getState().changeSlide;
      changeSlide(currentSlideshow?.slides?.length || 0);

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

      // 3. Si nous avons des slides restantes et que l'index actuel est hors limites, ajustez-le et videz la sélection
      if (currentSlideshow.slides && currentSlideshow.slides.length > 0) {
        const currentIndex = useEditorStore.getState().currentSlide;
        const newLength = currentSlideshow.slides.length - 1;

        if (currentIndex >= newLength) {
          const changeSlide = useEditorStore.getState().changeSlide;
          changeSlide(Math.max(0, newLength - 1));
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
      // 🔍 DEBUG: Log pour vérifier la durée reçue
      console.log("🔍 updateSlideDuration - Durée reçue:", { slideId, duration, typeDuration: typeof duration });
      
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
    // Dimensions
    dimensions,

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

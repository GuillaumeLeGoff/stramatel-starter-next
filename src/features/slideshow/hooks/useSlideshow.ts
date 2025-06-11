import { useCallback, useEffect, useRef, useState } from "react";
import { useSlideshowStore } from "@/features/slideshow/store/slideshowStore";
import {
  SlideshowConfig,
  SlideshowFormData,
  SlideshowSlide,
} from "@/features/slideshow/types";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useParams, useRouter } from "next/navigation";
import { slideStore } from "@/features/editor/store/slideStore";

export function useSlideshow() {
  // États du store avec actions API intégrées
  const {
    slideshows,
    currentSlideshow,
    isLoading,
    error,
    setCurrentSlideshow,
    isEditorOpen,
    setEditorOpen,
    fetchSlideshows,
    createSlideshow,
    deleteSlideshowById,
    fetchSlideshowById,
  } = useSlideshowStore();

  const { user } = useAuth();

  // États pour l'interface utilisateur
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [slideshowToDelete, setSlideshowToDelete] = useState<number | null>(
    null
  );
  const [formData, setFormData] = useState<SlideshowFormData>({
    name: "",
    description: "",
  });

  // Référence pour suivre si les données ont déjà été chargées
  const dataFetchedRef = useRef(false);

  // Navigation
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || "fr";

  // Charge les slideshows au chargement (une seule fois)
  useEffect(() => {
    if (!dataFetchedRef.current && !isLoading && slideshows.length === 0) {
      console.log("Chargement initial des slideshows");
      fetchSlideshows();
      dataFetchedRef.current = true;
    }
  }, [fetchSlideshows, isLoading, slideshows.length]);

  // Crée un nouveau slideshow (wrapper avec vérification user)
  const handleCreateSlideshow = useCallback(
    async (formData: SlideshowFormData) => {
      if (!user) {
        console.error("Vous devez être connecté pour créer un slideshow");
        return null;
      }

      return await createSlideshow(formData, user.id);
    },
    [user, createSlideshow]
  );

  // Naviguer vers l'éditeur de slideshow
  const navigateToEditor = useCallback(
    (slideshowId: number) => {
      router.push(`/${locale}/slideshow/${slideshowId}/editor`);
    },
    [router, locale]
  );

  // Fonction pour définir le slideshow courant et ouvrir l'éditeur
  const handleSetSlideshow = useCallback(
    (slideshow: SlideshowConfig) => {
      fetchSlideshowById(slideshow.id).then(() => {
        setEditorOpen(true);
      });
    },
    [fetchSlideshowById, setEditorOpen]
  );

  // Fonction pour fermer l'éditeur
  const handleCloseEditor = useCallback(() => {
    // Déselectionner toutes les formes avant de fermer l'éditeur
    slideStore.getState().setSelectedShapes([]);
    setEditorOpen(false);
  }, [setEditorOpen]);

  // Met à jour le slideshow courant
  const updateCurrentSlideshow = useCallback(
    (updater: (slideshow: SlideshowConfig) => SlideshowConfig) => {
      if (!currentSlideshow) return;

      const updatedSlideshow = updater(currentSlideshow);
      setCurrentSlideshow(updatedSlideshow);
    },
    [currentSlideshow, setCurrentSlideshow]
  );

  // FONCTIONS LIÉES À L'INTERFACE UTILISATEUR

  // Gestion du formulaire
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await handleCreateSlideshow(formData);
      if (result) {
        setFormData({
          name: "",
          description: "",
        });
        setCreateDialogOpen(false);
        return result;
      }
      return null;
    } catch (error) {
      console.error("Erreur lors de la création:", error);
      return null;
    }
  };

  // Gestion de la suppression
  const handleDelete = async () => {
    if (slideshowToDelete !== null) {
      await deleteSlideshowById(slideshowToDelete);
      setDeleteDialogOpen(false);
      setSlideshowToDelete(null);
    }
  };

  // Ouvrir le dialog de confirmation de suppression
  const openDeleteDialog = (id: number) => {
    setSlideshowToDelete(id);
    setDeleteDialogOpen(true);
  };

  // UTILITAIRES

  // Calculer la durée totale et le format du slideshow
  const formatSlideshowDuration = (slides: SlideshowSlide[]) => {
    const totalDuration = slides.reduce(
      (acc: number, slide: SlideshowSlide) => acc + slide.duration,
      0
    );
    const minutes = Math.floor(totalDuration / 60);
    const seconds = totalDuration % 60;

    return {
      totalDuration,
      formattedDuration:
        minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`,
    };
  };

  return {
    // États du store
    slideshows,
    currentSlideshow,
    isLoading: isLoading,
    error: error,
    isEditorOpen,
    setCurrentSlideshow,

    // États de l'interface
    createDialogOpen,
    setCreateDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    slideshowToDelete,
    formData,
    isLoadingSlideshows: isLoading,
    slideshowError: error,
    createError: error,
    isCreating: isLoading,

    // Fonctions du store (actions API)
    fetchSlideshows,
    createSlideshow: handleCreateSlideshow,
    deleteSlideshowById,

    // Fonctions de l'interface
    handleChange,
    handleSubmit,
    handleDelete,
    openDeleteDialog,
    handleSetSlideshow,
    handleCloseEditor,
    setEditorOpen,

    // Utilitaires
    formatSlideshowDuration,
    navigateToEditor,
    locale,

    // Nouvelle fonction
    updateCurrentSlideshow,
  };
}

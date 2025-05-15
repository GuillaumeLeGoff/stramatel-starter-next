import { useCallback, useEffect, useRef, useState } from "react";
import { useSlideshowStore } from "@/features/slideshow/store/slideshowStore";
import { SlideshowConfig, SlideshowFormData, SlideshowSlide } from "@/features/slideshow/types";
import { useAuth } from "@/features/auth/hooks/useAuth";
import * as slideshowApi from "@/features/slideshow/api/slideshowApi";
import { useParams, useRouter } from "next/navigation";

export function useSlideshow() {
  // États du store
  const {
    slideshows,
    currentSlideshow,
    isLoading,
    error,
    setSlideshows,
    addSlideshow,
    deleteSlideshow,
    setLoading,
    setError,
    setCurrentSlideshow,
    isEditorOpen,
    setEditorOpen,
  } = useSlideshowStore();

  const { user } = useAuth();

  // États pour l'interface utilisateur
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [slideshowToDelete, setSlideshowToDelete] = useState<number | null>(null);
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

  // Charge les slideshows au chargement
  useEffect(() => {
    if (!dataFetchedRef.current) {
      console.log("Chargement initial des slideshows");
      fetchSlideshows();
      dataFetchedRef.current = true;
    }
  }, []);

  // Charge tous les slideshows
  const fetchSlideshows = useCallback(async () => {
    try {
      // Éviter les appels multiples si déjà en cours de chargement
      if (isLoading) {
        console.log("Chargement déjà en cours, appel ignoré");
        return;
      }
      
      setLoading(true);
      setError(null);

      console.log("Récupération des slideshows...");
      const data = await slideshowApi.fetchAllSlideshows();
      
      // S'assurer que data est un tableau
      if (Array.isArray(data)) {
        console.log(`${data.length} slideshows récupérés`);
        setSlideshows(data);
      } else {
        console.error("Les données reçues ne sont pas un tableau:", data);
        setSlideshows([]);
      }
      return data;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      setError(errorMessage);
      console.error("Erreur lors de la récupération des slideshows:", error);
      // Initialiser avec un tableau vide en cas d'erreur
      setSlideshows([]);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setSlideshows, isLoading]);

  
  // Crée un nouveau slideshow
  const createSlideshow = useCallback(
    async (formData: SlideshowFormData) => {
      if (!user) {
        setError("Vous devez être connecté pour créer un slideshow");
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        const data = await slideshowApi.createSlideshow(formData, user.id);
        
        addSlideshow(data);
        return data;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";
        setError(errorMessage);
        console.error("Erreur lors de la création du slideshow:", error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user, setLoading, setError, addSlideshow]
  );

  // Naviguer vers l'éditeur de slideshow
  const navigateToEditor = useCallback((slideshowId: number) => {
    router.push(`/${locale}/slideshow/${slideshowId}/editor`);
  }, [router, locale]);
  
  // Fonction pour définir le slideshow courant et ouvrir l'éditeur
  const handleSetSlideshow = useCallback((slideshow: SlideshowConfig) => {
    setCurrentSlideshow(slideshow);
    setEditorOpen(true);
  }, [setCurrentSlideshow, setEditorOpen]);

  // Fonction pour fermer l'éditeur
  const handleCloseEditor = useCallback(() => {
    setEditorOpen(false);
  }, [setEditorOpen]);

  // Supprime un slideshow
  const deleteSlideshowById = useCallback(
    async (id: number) => {
      try {
        setLoading(true);
        setError(null);

        await slideshowApi.deleteSlideshow(id);
        
        deleteSlideshow(id);
        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";
        setError(errorMessage);
        console.error("Erreur lors de la suppression du slideshow:", error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, deleteSlideshow]
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
      const result = await createSlideshow(formData);
      if (result) {
        setFormData({
          name: "",
          description: "",
        });
        setOpen(false);
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
      formattedDuration: minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`
    };
  };

  return {
    // États du store
    slideshows,
    currentSlideshow,
    isLoading: isLoading,
    error: error,
    isEditorOpen,
    
    // États de l'interface
    open,
    setOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    slideshowToDelete,
    formData,
    isLoadingSlideshows: isLoading,
    slideshowError: error,
    createError: error,
    isCreating: isLoading,
    
    // Fonctions du store
    fetchSlideshows,
    createSlideshow,
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
    locale
  };
}

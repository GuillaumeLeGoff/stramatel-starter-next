import React, { useState, useCallback } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { useShapeMedia } from "./useShapeMedia";
import type { Media, SortOption } from "./useShapeMedia";

interface UseShapeMediaManagerProps {
  onMediaSelect?: (media: Media) => void;
  addShape?: (
    shapeType: string,
    options?: { src?: string; name?: string; mediaId?: string }
  ) => Promise<void>;
  onMediaDeleted?: (mediaUrl: string) => Promise<void>;
}

export function useShapeMediaManager({
  onMediaSelect,
  addShape,
  onMediaDeleted,
}: UseShapeMediaManagerProps) {
  const [mediaToDelete, setMediaToDelete] = useState<{ id: string; name: string } | null>(null);
  
  const {
    viewMode,
    sortBy,
    sortDirection,
    medias,
    loading,
    error,
    deletingMediaIds,
    setViewMode,
    setSortBy,
    selectMedia,
    getMediaTypeColor,
    uploadMedia,
    deleteMedia,
  } = useShapeMedia();

  // Gestionnaire optimisé pour la sélection de média
  const handleMediaSelect = useCallback(async (media: Media) => {
    selectMedia(media);
    onMediaSelect?.(media);

    console.log("🎬 Sélection de média:", {
      type: media.type,
      id: media.id,
      name: media.name,
      url: media.url,
      size: media.size
    });

    // Ajouter le média au canvas Konva
    if (addShape) {
      try {
        if (media.type === "image") {
          console.log("🖼️ Ajout d'image au canvas avec URL:", media.url);
          await addShape("image", {
            src: media.url,
            name: media.name,
            mediaId: media.id,
            autoResize: true, // Activer le redimensionnement automatique
          });
        } else if (media.type === "video") {
          console.log("🎥 Ajout de vidéo au canvas avec URL:", media.url);
          await addShape("video", {
            src: media.url,
            name: media.name,
            mediaId: media.id,
            autoResize: true, // Activer le redimensionnement automatique
          });
        }
        console.log("✅ Média ajouté avec succès au canvas");
      } catch (error) {
        console.error(`❌ Erreur lors de l'ajout du ${media.type} au canvas:`, error);
      }
    }
  }, [selectMedia, onMediaSelect, addShape]);

  // Gestionnaire optimisé pour la suppression de média
  const handleDeleteMedia = useCallback((mediaId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    const media = medias.find((m) => m.id === mediaId);
    if (media) {
      setMediaToDelete({ id: mediaId, name: media.name });
    }
  }, [medias]);

  // Confirmation de suppression
  const confirmDelete = useCallback(async () => {
    if (!mediaToDelete) return;

    try {
      const mediaToDeleteData = medias.find((media) => media.id === mediaToDelete.id);
      if (!mediaToDeleteData) {
        throw new Error("Média introuvable");
      }

      // Supprimer le média côté serveur
      await deleteMedia(mediaToDelete.id);
      
      // Nettoyer les données Konva localement
      if (onMediaDeleted) {
        await onMediaDeleted(mediaToDeleteData.url);
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    } finally {
      setMediaToDelete(null);
    }
  }, [mediaToDelete, medias, deleteMedia, onMediaDeleted]);

  // Annulation de suppression
  const cancelDelete = useCallback(() => {
    setMediaToDelete(null);
  }, []);

  // Gestionnaire optimisé pour l'upload
  const handleUpload = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = "image/*,video/*";

    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        try {
          await uploadMedia(files);
        } catch (error) {
          console.error("Erreur lors de l'upload:", error);
        }
      }
    };

    input.click();
  }, [uploadMedia]);

  // Fonctions utilitaires pour l'interface
  const getSortIcon = useCallback(() => {
    return sortDirection === "asc" ? 
      React.createElement(ArrowUp, { className: "h-3 w-3" }) : 
      React.createElement(ArrowDown, { className: "h-3 w-3" });
  }, [sortDirection]);

  const getSortLabel = useCallback((criteria: SortOption) => {
    const labels: Record<SortOption, string> = {
      date: "Date",
      name: "Nom", 
      size: "Taille",
      type: "Type"
    };
    return labels[criteria];
  }, []);

  return {
    // État
    mediaToDelete,
    
    // État du hook useShapeMedia
    viewMode,
    sortBy,
    sortDirection,
    medias,
    loading,
    error,
    deletingMediaIds,
    
    // Actions
    setViewMode,
    setSortBy,
    getMediaTypeColor,
    
    // Gestionnaires d'événements
    handleMediaSelect,
    handleDeleteMedia,
    handleUpload,
    confirmDelete,
    cancelDelete,
    
    // Fonctions utilitaires
    getSortIcon,
    getSortLabel,
  };
} 
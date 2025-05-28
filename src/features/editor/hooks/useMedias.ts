import { useState, useMemo, useEffect } from "react";
import {
  fetchMedias,
  uploadFiles,
  deleteMedia as deleteMediaApi,
} from "../api/mediaApi";
import { cleanSlidesFromMedia } from "../api/slideApi";

// Types pour les médias
export interface Media {
  id: string;
  name: string;
  type: "image" | "video";
  url: string;
  size: string;
  uploadedAt: string;
  thumbnail?: {
    id: string;
    url: string;
  } | null;
}

export type SortOption = "name" | "date" | "size" | "type";
export type ViewMode = "list" | "grid";
export type SortDirection = "asc" | "desc";

export function useMedias() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [medias, setMedias] = useState<Media[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fonction pour convertir la taille en bytes pour le tri
  const getSizeInBytes = (size: string): number => {
    const value = parseFloat(size);
    if (size.includes("KB")) return value * 1024;
    if (size.includes("MB")) return value * 1024 * 1024;
    if (size.includes("GB")) return value * 1024 * 1024 * 1024;
    return value;
  };

  // Charger les médias au montage du composant
  useEffect(() => {
    loadMedias();
  }, []);

  // Fonction pour charger les médias
  const loadMedias = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchMedias();
      setMedias(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des médias"
      );
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour changer le critère de tri avec gestion de la direction
  const handleSortChange = (newSortBy: SortOption) => {
    if (newSortBy === sortBy) {
      // Si on clique sur le même critère, inverser la direction
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Si on change de critère, utiliser la direction par défaut
      setSortBy(newSortBy);
      // Direction par défaut selon le critère
      switch (newSortBy) {
        case "date":
          setSortDirection("desc"); // Plus récent en premier
          break;
        case "size":
          setSortDirection("desc"); // Plus gros en premier
          break;
        case "name":
        case "type":
          setSortDirection("asc"); // Alphabétique A-Z
          break;
        default:
          setSortDirection("asc");
      }
    }
  };

  // Tri des médias avec direction
  const sortedMedias = useMemo(() => {
    const sorted = [...medias];

    switch (sortBy) {
      case "name":
        sorted.sort((a, b) => {
          const comparison = a.name.localeCompare(b.name);
          return sortDirection === "asc" ? comparison : -comparison;
        });
        break;
      case "date":
        sorted.sort((a, b) => {
          const comparison = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
          return sortDirection === "asc" ? comparison : -comparison;
        });
        break;
      case "size":
        sorted.sort((a, b) => {
          const comparison = getSizeInBytes(a.size) - getSizeInBytes(b.size);
          return sortDirection === "asc" ? comparison : -comparison;
        });
        break;
      case "type":
        sorted.sort((a, b) => {
          const comparison = a.type.localeCompare(b.type);
          return sortDirection === "asc" ? comparison : -comparison;
        });
        break;
      default:
        break;
    }

    return sorted;
  }, [medias, sortBy, sortDirection]);

  // Fonction pour obtenir l'icône du type de média
  const getMediaIcon = (type: Media["type"]) => {
    return type; // Retourne juste le type, l'icône sera gérée dans le composant
  };

  // Fonction pour obtenir la couleur du badge selon le type
  const getMediaTypeColor = (type: Media["type"]) => {
    switch (type) {
      case "image":
        return "bg-blue-100 text-blue-800";
      case "video":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  // Fonction pour sélectionner un média
  const selectMedia = (media: Media) => {
    console.log("Média sélectionné:", media);
    // TODO: Implémenter l'ajout du média à la slide
  };

  // Fonction pour uploader un média
  const uploadMedia = async (files: FileList | null) => {
    if (!files) return;

    try {
      setLoading(true);
      setError(null);
      const result = await uploadFiles(files);

      // Ajouter les nouveaux médias à la liste
      setMedias((prev) => [...result.media, ...prev]);

      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'upload");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour supprimer un média
  const deleteMedia = async (mediaId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Trouver le média pour récupérer son URL
      const mediaToDelete = medias.find((media) => media.id === mediaId);
      if (!mediaToDelete) {
        throw new Error("Média introuvable");
      }

      // Supprimer le média
      await deleteMediaApi(mediaId);
      
      // Nettoyer toutes les slides de tous les slideshows qui utilisent ce média
      await cleanSlidesFromMedia(mediaToDelete.url);

      // Retirer le média de la liste
      setMedias((prev) => prev.filter((media) => media.id !== mediaId));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la suppression"
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour filtrer les médias par type
  const filterMediasByType = (type?: Media["type"]) => {
    if (!type) return sortedMedias;
    return sortedMedias.filter((media) => media.type === type);
  };

  // Fonction pour rechercher dans les médias
  const searchMedias = (query: string) => {
    if (!query.trim()) return sortedMedias;
    return sortedMedias.filter((media) =>
      media.name.toLowerCase().includes(query.toLowerCase())
    );
  };

  return {
    // État
    viewMode,
    sortBy,
    sortDirection,
    medias: sortedMedias,
    loading,
    error,

    // Actions
    setViewMode,
    setSortBy: handleSortChange, // Utiliser la nouvelle fonction
    selectMedia,
    uploadMedia,
    deleteMedia,
    loadMedias,

    // Utilitaires
    getMediaIcon,
    getMediaTypeColor,
    filterMediasByType,
    searchMedias,
    getSizeInBytes,
  };
}

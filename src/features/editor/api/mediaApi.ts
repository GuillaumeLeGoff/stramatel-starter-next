import { Media } from "../hooks/useMedias";

export interface MediaResponse {
  id: number;
  originalFileName: string;
  fileName: string;
  path: string;
  format: string;
  type: string;
  size: number;
  uploadedAt: string;
  updatedAt: string;
  thumbnail?: {
    id: number;
    path: string;
  } | null;
}

export interface UploadResponse {
  message: string;
  media: Media[];
}

// Fonction pour récupérer tous les médias
export async function fetchMedias(): Promise<Media[]> {
  try {
    const response = await fetch("/api/media");
    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des médias");
    }

    const data: MediaResponse[] = await response.json();

    // Conversion du format API vers le format du hook
    return data.map((media) => ({
      id: media.id.toString(),
      name: media.originalFileName,
      type: media.type as "image" | "video",
      url: media.path,
      size: formatFileSize(media.size),
      uploadedAt: new Date(media.uploadedAt).toISOString().split("T")[0],
      thumbnail: media.thumbnail
        ? {
            id: media.thumbnail.id.toString(),
            url: media.thumbnail.path,
          }
        : null,
    }));
  } catch (error) {
    console.error("Erreur fetchMedias:", error);
    throw error;
  }
}

// Fonction pour uploader des fichiers
export async function uploadFiles(files: FileList): Promise<UploadResponse> {
  try {
    const formData = new FormData();

    // Ajouter tous les fichiers au FormData
    Array.from(files).forEach((file) => {
      formData.append("files", file);
    });

    const response = await fetch("/api/media/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Erreur lors de l'upload");
    }

    return await response.json();
  } catch (error) {
    console.error("Erreur uploadFiles:", error);
    throw error;
  }
}

// Fonction pour supprimer un média
export async function deleteMedia(mediaId: string): Promise<void> {
  try {
    const response = await fetch(`/api/media/${mediaId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la suppression du média");
    }
  } catch (error) {
    console.error("Erreur deleteMedia:", error);
    throw error;
  }
}

// Fonction utilitaire pour formater la taille des fichiers
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

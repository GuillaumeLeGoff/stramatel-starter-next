import { SlideshowFormData, KonvaData } from "@/features/slideshow/types";

/**
 * Récupère tous les slideshows
 */
export async function fetchAllSlideshows() {
  const response = await fetch("/api/slideshows");

  if (!response.ok) {
    throw new Error("Erreur lors de la récupération des slideshows");
  }

  return await response.json();
}

/**
 * Récupère un slideshow par son ID
 */
export async function fetchSlideshowById(id: number) {
  const response = await fetch(`/api/slideshows/${id}`);
  
  if (!response.ok) {
    throw new Error("Erreur lors de la récupération du slideshow");
  }
  
  return await response.json();
}

/**
 * Crée un nouveau slideshow
 */
export async function createSlideshow(formData: SlideshowFormData, userId: number) {
  const response = await fetch("/api/slideshows", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...formData,
      createdBy: userId,
    }),
  });
  
  if (!response.ok) {
    throw new Error("Erreur lors de la création du slideshow");
  }
  
  return await response.json();
}

/**
 * Met à jour un slideshow existant
 */
export async function updateSlideshow(id: number, formData: SlideshowFormData) {
  const response = await fetch(`/api/slideshows/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  });
  
  if (!response.ok) {
    throw new Error("Erreur lors de la mise à jour du slideshow");
  }
  
  return await response.json();
}

/**
 * Supprime un slideshow
 */
export async function deleteSlideshow(id: number) {
  const response = await fetch(`/api/slideshows/${id}`, {
    method: "DELETE",
  });
  
  if (!response.ok) {
    throw new Error("Erreur lors de la suppression du slideshow");
  }
  
  return true;
}

/**
 * Met à jour une slide existante
 */
export async function updateSlide(
  slideId: number,
  slideData: Partial<{
    duration?: number;
    position?: number;
    mediaId?: number | null;
    width?: number;
    height?: number;
    konvaData?: KonvaData;
  }>
) {
  // 🔍 DEBUG: Log pour vérifier les données envoyées
  console.log("🔍 Frontend updateSlide - Données envoyées:", { slideId, slideData });
  
  const response = await fetch(`/api/slides/${slideId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(slideData),
  });
  
  if (!response.ok) {
    throw new Error("Erreur lors de la mise à jour de la slide");
  }
  
  return await response.json();
}

/**
 * Crée une nouvelle slide
 */
export async function createSlide(
  slideshowId: number,
  slideData: {
    position: number;
    duration: number;
    mediaId?: number;
    width?: number;
    height?: number;
    konvaData?: KonvaData;
  }
) {
  const response = await fetch("/api/slides", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...slideData,
      slideshowId,
    }),
  });
  
  if (!response.ok) {
    throw new Error("Erreur lors de la création de la slide");
  }
  
  return await response.json();
}




import { Slide } from "../types";
import { fetchClient } from "@/shared/api/fetch-client";

// Récupérer toutes les slides
export const fetchSlides = async () => {
  const response = await fetchClient("/api/slides");
  if (!response.ok)
    throw new Error("Erreur lors de la récupération des slides");
  return await response.json();
};

// Créer une nouvelle slide
export const createSlide = async (slideData: Partial<Slide>) => {
  const response = await fetchClient("/api/slides", {
    method: "POST",
    body: JSON.stringify(slideData),
  });
  if (!response.ok) throw new Error("Erreur lors de la création de la slide");
  return await response.json();
};

// Récupérer une slide par ID
export const fetchSlideById = async (id: number) => {
  const response = await fetchClient(`/api/slides/${id}`);
  if (!response.ok)
    throw new Error("Erreur lors de la récupération de la slide");
  return await response.json();
};

// Mettre à jour une slide
export const updateSlide = async (id: number, updateData: Partial<Slide>) => {
  const response = await fetchClient(`/api/slides/${id}`, {
    method: "PUT",
    body: JSON.stringify(updateData),
  });
  if (!response.ok)
    throw new Error("Erreur lors de la mise à jour de la slide");
  return await response.json();
};

// Supprimer une slide
export const deleteSlide = async (id: number) => {
  const response = await fetchClient(`/api/slides/${id}`, { method: "DELETE" });
  if (!response.ok)
    throw new Error("Erreur lors de la suppression de la slide");
  return await response.json();
};

/**
 * Nettoie toutes les slides qui utilisent un média supprimé
 */
export async function cleanSlidesFromMedia(mediaUrl: string): Promise<void> {
  try {
    const response = await fetch("/api/slides/clean-media", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mediaUrl }),
    });

    if (!response.ok) {
      throw new Error("Erreur lors du nettoyage des slides");
    }
  } catch (error) {
    console.error("Erreur cleanSlidesFromMedia:", error);
    throw error;
  }
}

/**
 * Associe un média à une slide
 */
export async function associateMediaToSlide(slideId: number, mediaId: number): Promise<void> {
  try {
    const response = await fetch(`/api/slides/${slideId}/media`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mediaId }),
    });

    if (!response.ok) {
      throw new Error("Erreur lors de l'association du média à la slide");
    }
  } catch (error) {
    console.error("Erreur associateMediaToSlide:", error);
    throw error;
  }
}

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

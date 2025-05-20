import { Settings } from "../types";
import { fetchClient } from "@/shared/api/fetch-client";

// Récupérer les paramètres
export const fetchSettings = async () => {
  const response = await fetchClient("/api/settings");
  if (!response.ok)
    throw new Error("Erreur lors de la récupération des paramètres");
  return await response.json();
};

// Mettre à jour les paramètres
export const updateSettings = async (updateData: Partial<Settings>) => {
  // Convertir les valeurs de type string en nombre si nécessaire
  const processedData = {
    ...updateData,
    brightness:
      updateData.brightness !== undefined
        ? Number(updateData.brightness)
        : undefined,
    width:
      updateData.width !== undefined ? Number(updateData.width) : undefined,
    height:
      updateData.height !== undefined ? Number(updateData.height) : undefined,
  };

  const response = await fetchClient("/api/settings", {
    method: "PUT",
    body: JSON.stringify(processedData),
  });
  if (!response.ok)
    throw new Error("Erreur lors de la mise à jour des paramètres");
  return await response.json();
};

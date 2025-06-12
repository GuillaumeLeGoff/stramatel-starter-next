import { UserSettings } from "../types";
import { fetchClient } from "@/shared/api/fetch-client";

// Récupérer les paramètres utilisateur
export const fetchUserSettings = async (): Promise<UserSettings> => {
  const response = await fetchClient("/api/user/settings");
  if (!response.ok) {
    throw new Error("Erreur lors de la récupération des paramètres utilisateur");
  }
  return await response.json();
};

// Mettre à jour les paramètres utilisateur
export const updateUserSettings = async (
  updateData: Partial<Pick<UserSettings, "username" | "language" | "theme">>
): Promise<UserSettings> => {
  const response = await fetchClient("/api/user/settings", {
    method: "PUT",
    body: JSON.stringify(updateData),
  });
  if (!response.ok) {
    throw new Error("Erreur lors de la mise à jour des paramètres utilisateur");
  }
  return await response.json();
};

// Changer le mot de passe
export const changePassword = async (data: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ message: string }> => {
  const response = await fetchClient("/api/user/password", {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Erreur lors du changement de mot de passe");
  }
  return await response.json();
}; 
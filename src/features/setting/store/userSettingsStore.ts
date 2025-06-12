import { create } from "zustand";
import { fetchUserSettings, updateUserSettings, changePassword } from "../api/userSettingsApi";
import { UserSettings } from "../types";

export interface UserSettingsStore {
  userSettings: UserSettings | null;
  isLoading: boolean;
  error: string | null;
}

export const useUserSettingsStore = create<
  UserSettingsStore & {
    fetchUserSettings: () => Promise<void>;
    updateUserSettings: (data: Partial<Pick<UserSettings, "username" | "language" | "theme">>) => Promise<void>;
    changePassword: (data: { currentPassword: string; newPassword: string }) => Promise<void>;
    clearError: () => void;
  }
>((set) => ({
  userSettings: null,
  isLoading: false,
  error: null,

  fetchUserSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const userSettings = await fetchUserSettings();
      set({ userSettings, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Une erreur est survenue",
        isLoading: false,
      });
    }
  },

  updateUserSettings: async (data) => {
    set({ error: null });
    try {
      const updatedUserSettings = await updateUserSettings(data);
      set({ userSettings: updatedUserSettings });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Une erreur est survenue",
      });
    }
  },

  changePassword: async (data) => {
    set({ error: null });
    try {
      await changePassword(data);
      // Mot de passe changé avec succès, pas besoin de mettre à jour le state
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Une erreur est survenue",
      });
      throw error; // Re-throw pour permettre à l'UI de gérer l'erreur
    }
  },

  clearError: () => {
    set({ error: null });
  },
})); 
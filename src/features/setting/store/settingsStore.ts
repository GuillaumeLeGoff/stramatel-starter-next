import { create } from "zustand";
import { fetchSettings, updateSettings } from "../api/settingsApi";
import { Settings, SettingsStore } from "../types";

export const useSettingsStore = create<
  SettingsStore & {
    fetchSettings: () => Promise<void>;
    updateSettings: (data: Partial<Settings>) => Promise<void>;
  }
>((set) => ({
  settings: null,
  isLoading: false,
  error: null,

  fetchSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const settings = await fetchSettings();
      set({ settings, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Une erreur est survenue",
        isLoading: false,
      });
    }
  },

  updateSettings: async (data) => {
    set({ error: null });
    try {
      const updatedSettings = await updateSettings(data);
      set({ settings: updatedSettings });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Une erreur est survenue",
      });
    }
  },
}));

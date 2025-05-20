import { useEffect } from "react";
import { useSettingsStore } from "../store/settingsStore";

export const useSettings = () => {
  const { settings, isLoading, error, fetchSettings, updateSettings } =
    useSettingsStore();

  useEffect(() => {
    if (!settings) {
      fetchSettings();
    }
  }, [settings, fetchSettings]);

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    fetchSettings,
  };
};

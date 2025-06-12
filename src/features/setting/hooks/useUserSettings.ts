import { useEffect } from "react";
import { useUserSettingsStore } from "../store/userSettingsStore";

export const useUserSettings = () => {
  const { 
    userSettings, 
    isLoading, 
    error, 
    fetchUserSettings, 
    updateUserSettings, 
    changePassword,
    clearError
  } = useUserSettingsStore();

  useEffect(() => {
    if (!userSettings) {
      fetchUserSettings();
    }
  }, [userSettings, fetchUserSettings]);

  return {
    userSettings,
    isLoading,
    error,
    updateUserSettings,
    changePassword,
    fetchUserSettings,
    clearError,
  };
}; 
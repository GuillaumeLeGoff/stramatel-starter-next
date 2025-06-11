import { useEffect } from 'react';
import { useAppSettingsStore } from '@/store/appSettingsStore';

export function useAppSettings() {
  const { 
    settings, 
    isLoading, 
    error, 
    fetchSettings, 
    updateSettings,
    refreshSettings 
  } = useAppSettingsStore();

  // Charger les settings automatiquement si pas déjà fait
  useEffect(() => {
    if (!settings && !isLoading && !error) {
      fetchSettings();
    }
  }, [settings, isLoading, error, fetchSettings]);

  return {
    settings,
    isLoading,
    error,
    fetchSettings: refreshSettings,
    updateSettings,
    // Propriétés de convenance pour accéder aux dimensions
    width: settings?.width || 1920,
    height: settings?.height || 1080,
  };
} 
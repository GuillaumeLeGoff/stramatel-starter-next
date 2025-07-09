import { create } from "zustand";
import { socketClient } from "@/lib/socket";

interface AppSettings {
  id: number;
  standby: boolean;
  standbyStartTime: Date;
  standbyEndTime: Date;
  restartAt: Date;
  brightness: number;
  width: number;
  height: number;
  updatedAt: Date;
}

interface AppSettingsStore {
  settings: AppSettings | null;
  isLoading: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
  updateSettings: (updatedSettings: Partial<AppSettings>) => Promise<AppSettings>;
  refreshSettings: () => Promise<void>;
  initializeWebSocketListener: () => void;
}

export const useAppSettingsStore = create<AppSettingsStore>((set, get) => ({
  settings: null,
  isLoading: false,
  error: null,

  fetchSettings: async () => {
    const { isLoading } = get();
    if (isLoading) return; // Éviter les appels multiples simultanés

    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch('/api/settings');
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des paramètres');
      }
      
      const data = await response.json();
      set({ settings: data, isLoading: false });
    } catch (err) {
      set({ 
        error: err instanceof Error ? err.message : 'Une erreur est survenue',
        isLoading: false 
      });
    }
  },

  updateSettings: async (updatedSettings: Partial<AppSettings>) => {
    set({ error: null });
    
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedSettings),
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour des paramètres');
      }
      
      const data = await response.json();
      set({ settings: data });
      return data;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Une erreur est survenue';
      set({ error });
      throw err;
    }
  },

  refreshSettings: async () => {
    const { fetchSettings } = get();
    await fetchSettings();
  },

  initializeWebSocketListener: () => {
    // Écouter les mises à jour d'AppSettings via WebSocket
    const handleAppSettingsUpdate = async (data: {
      timestamp: Date;
      width: number;
      height: number;
      settings: AppSettings;
    }) => {
      console.log("📡 AppSettings - Mise à jour reçue via WebSocket:", data);
      
      // Rafraîchir les settings depuis l'API
      const { fetchSettings } = get();
      await fetchSettings();
    };

    // S'abonner aux événements WebSocket
    socketClient.on("appSettingsUpdated", handleAppSettingsUpdate);
    
    // Connecter le socket si pas déjà fait
    socketClient.connect();
  },
})); 
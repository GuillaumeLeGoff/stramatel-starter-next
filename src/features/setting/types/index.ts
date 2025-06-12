// Paramètres de l'application (globaux)
export interface AppSettings {
  id: number;
  restartAt: Date | string;
  brightness: number;
  width: number;
  height: number;
  updatedAt: Date | string;
}

// Paramètres utilisateur (spécifiques à l'utilisateur)
export interface UserSettings {
  id: number;
  username: string;
  language: string;
  theme: string;
  role: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

// Type combiné pour compatibilité
export interface Settings extends AppSettings {
  standby?: boolean;
  standbyStartTime?: Date | string;
  standbyEndTime?: Date | string;
}

export interface SettingsStore {
  settings: Settings | null;
  isLoading: boolean;
  error: string | null;
}

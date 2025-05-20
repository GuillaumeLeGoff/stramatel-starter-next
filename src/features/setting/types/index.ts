export interface Settings {
  id: number;
  standby: boolean;
  standbyStartTime: Date | string;
  standbyEndTime: Date | string;
  restartAt: Date | string;
  brightness: number;
  width: number;
  height: number;
  updatedAt: Date | string;
}

export interface SettingsStore {
  settings: Settings | null;
  isLoading: boolean;
  error: string | null;
}

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AuthState, User } from "../types/@auth";

interface AuthActions {
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  getToken: () => string | null;
  logout: () => void;
}

interface PersistState extends AuthState {
  token: string | null;
}

const initialState: PersistState = {
  user: null,
  isLoading: false,
  error: null,
  token: null,
};

export const useAuthStore = create<PersistState & AuthActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setLoading: (isLoading: boolean) => set({ isLoading }),
      setError: (error: string | null) => set({ error }),
      setUser: (user: User | null) => set({ user }),

      setToken: (token: string | null) => {
        set({ token });
        // Utilise uniquement localStorage via la persistance Zustand
      },

      getToken: () => get().token,

      logout: () => {
        set({
          user: null,
          token: null,
          error: null,
        });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
);

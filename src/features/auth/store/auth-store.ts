import { create } from 'zustand';
import { AuthState, User } from '../types/@auth';

interface AuthActions {
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setUser: (user: User | null) => void;
}

const initialState: AuthState = {
  user: null,
  isLoading: false,
  error: null,
};

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  ...initialState,

  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),
  setUser: (user: User | null) => set({ user }),
})); 
export interface User {
  id: number;
  username: string;
  language: string;
  theme: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export type UserRole = 'USER' | 'ADMIN';

export interface UserInfo {
  id: number;
  username: string;
  role: UserRole;
} 
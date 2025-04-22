import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/auth-store';
import { LoginCredentials, AuthResponse } from '../types/@auth';
import { log } from 'console';

export function useAuth() {
  const router = useRouter();
  const { user, setUser, setLoading, setError } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  // Fonction pour stocker le token dans le localStorage
  const setToken = useCallback((token: string | null) => {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }, []);

  // Fonction pour récupérer le token du localStorage
  const getToken = useCallback(() => {
    return localStorage.getItem('auth_token');
  }, []);

  // Fonction pour vérifier si l'utilisateur est connecté
  const checkAuth = useCallback(async () => {
    console.log('checkAuth');
    const token = getToken();
    console.log('token', token);
    
    if (!token) {
      setUser(null);
      setIsInitialized(true);
      router.push('/login');
      return;
    }else{
      console.log('token', token);
      router.push('/dashboard');
    }

    try {
      setLoading(true);
      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Session expirée');
      }

      const userData = await response.json();
      setUser(userData);
      
      // Si on est sur la page de login et que l'authentification est réussie,
      // rediriger vers le tableau de bord
      if (window.location.pathname.includes('/login')) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'authentification:', error);
      setUser(null);
      setToken(null);
      router.push('/login');
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  }, [getToken, setLoading, setToken, setUser, router]);

  // Fonction de connexion
  const login = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la connexion');
      }

      const data: AuthResponse = await response.json();
      setUser(data.user);
      setToken(data.token);
      router.push('/dashboard');
      
      return data.user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la connexion';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Fonction de déconnexion
  const logout = () => {
    setUser(null);
    setToken(null);
    router.push('/login');
  };

  return {
    user,
    isAuthenticated: !!user,
    isLoading: useAuthStore((state) => state.isLoading),
    error: useAuthStore((state) => state.error),
    isInitialized,
    login,
    logout,
    checkAuth,
  };
} 
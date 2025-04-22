import { LoginCredentials, User } from '../types/@auth';
import { fetchClient } from '@/shared/api/fetch-client';
import { AuthApiError } from '../types/@api';

export async function loginUser(credentials: LoginCredentials): Promise<User> {
  const response = await fetchClient('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  
  if (!response.ok) {
    const error = await response.json() as AuthApiError;
    throw new Error(error.message || 'Erreur lors de la connexion');
  }
  
  const data = await response.json();
  return data.user;
}

export async function logoutUser(): Promise<void> {
  const response = await fetchClient('/api/auth/logout', {
    method: 'POST',
  });
  
  if (!response.ok) {
    const error = await response.json() as AuthApiError;
    throw new Error(error.message || 'Erreur lors de la déconnexion');
  }
}

export async function checkUserAuth(): Promise<User | null> {
  try {
    const response = await fetchClient('/api/auth/me', {
      timeout: 15000,
    });
    
    if (response.status === 401) {
      return null;
    }
    
    if (!response.ok) {
      const error = await response.json() as AuthApiError;
      throw new Error(error.message || 'Erreur lors de la vérification de l\'authentification');
    }
    
    const data = await response.json();
    return data.user;
  } catch (error) {
    throw error;
  }
} 
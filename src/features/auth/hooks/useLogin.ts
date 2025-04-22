import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoginCredentials } from '../types/@auth';
import { useAuth } from './useAuth';

export function useLogin() {
  const router = useRouter();
  const { login, isLoading, error } = useAuth();
  
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(credentials);
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      // Erreur déjà gérée dans le hook useAuth
    }
  };

  return {
    credentials,
    isLoading,
    error,
    handleChange,
    handleSubmit,
  };
} 
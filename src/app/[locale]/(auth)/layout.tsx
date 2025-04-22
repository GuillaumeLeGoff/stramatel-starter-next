'use client';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Si l'authentification est initialisée et que l'utilisateur est connecté
    if (isInitialized && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isInitialized, isAuthenticated, router]);

  // Ne rien afficher tant que l'authentification n'est pas initialisée
  if (!isInitialized) {
    return null;
  }

  // Si l'utilisateur n'est pas connecté, afficher le contenu (page de login)
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
} 
'use client';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();

  /* useEffect(() => {
    // Si l'authentification est initialisée et que l'utilisateur n'est pas connecté
    if (isInitialized && !isAuthenticated) {
      router.push('/login');
    }
  }, [isInitialized, isAuthenticated, router]); */

  // Ne rien afficher tant que l'authentification n'est pas initialisée
  if (!isInitialized) {
    return null;
  }

  // Si l'utilisateur est connecté, afficher le contenu protégé
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-3">
            {/* Vous pouvez ajouter ici votre navigation */}
          </div>
        </nav>
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    );
  }

  // Ne rien afficher pendant la redirection
  return null;
} 
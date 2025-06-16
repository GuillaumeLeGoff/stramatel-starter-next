"use client";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { isInitialized, isAuthenticated } = useAuth();
  const router = useRouter();

    useEffect(() => {
    if (isInitialized) {
      if (isAuthenticated) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    }
  }, [isInitialized, isAuthenticated, router]);

  // Afficher un écran de chargement pendant l'initialisation
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return null;
}

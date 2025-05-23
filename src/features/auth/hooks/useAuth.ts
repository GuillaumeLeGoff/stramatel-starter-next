import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/authStore";
import { LoginCredentials, AuthResponse } from "../types/@auth";

export function useAuth() {
  const router = useRouter();
  const {
    user,
    isLoading,
    error,
    isInitialized,
    setUser,
    setLoading,
    setError,
    setToken,
    getToken,
    setInitialized,
    logout: storeLogout,
  } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) {
      console.log("checkAuth");
      checkAuth();
    }
  }, [isInitialized]);

  // Fonction pour vérifier si l'utilisateur est connecté
  const checkAuth = useCallback(async () => {
    const token = getToken();
    console.log("token", token);
    if (!token) {
      setUser(null);
      setInitialized(true);
      router.push("/login");
      return;
    }

    // Si l'utilisateur est déjà chargé, ne pas vérifier à nouveau
    if (user) {
      setInitialized(true);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("response", response);

      if (!response.ok) {
        throw new Error("Session expirée");
      }

      const userData = await response.json();
      setUser(userData);

      // Si on est sur la page de login et que l'authentification est réussie,
      // rediriger vers le tableau de bord
      if (window.location.pathname.includes("/login")) {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error(
        "Erreur lors de la vérification de l'authentification:",
        error
      );
      storeLogout();
      router.push("/login");
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [getToken, setLoading, setUser, storeLogout, router, user, setInitialized]);

  // Fonction de connexion
  const login = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la connexion");
      }

      const data: AuthResponse = await response.json();
      setUser(data.user);
      setToken(data.token);
      setInitialized(true);
      router.push("/dashboard");

      return data.user;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur lors de la connexion";
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Fonction de déconnexion
  const logout = () => {
    storeLogout();
    setInitialized(false);
    router.push("/login");
  };

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    isInitialized,
    login,
    logout,
    checkAuth,
  };
}

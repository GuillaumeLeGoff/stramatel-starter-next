import { SecurityApi } from "@/features/security/api/securityApi";
import { DigitalDisplayData } from "@/features/security/types";

class SecurityDataCache {
  private data: DigitalDisplayData | null = null;
  private lastFetch: number = 0;
  private isFetching: boolean = false;
  private fetchPromise: Promise<DigitalDisplayData> | null = null;
  private subscribers: Set<(data: DigitalDisplayData | null) => void> = new Set();
  private refreshInterval: NodeJS.Timeout | null = null;
  
  // Cache valide pendant 1 minute
  private readonly CACHE_DURATION = 60 * 1000; // 60 secondes

  /**
   * S'abonne aux mises à jour des données de sécurité
   */
  subscribe(callback: (data: DigitalDisplayData | null) => void): () => void {
    this.subscribers.add(callback);
    
    // Démarrer l'intervalle de rafraîchissement si c'est le premier abonné
    if (this.subscribers.size === 1 && !this.refreshInterval) {
      this.startRefreshInterval();
    }
    
    // Retourner une fonction de désabonnement
    return () => {
      this.subscribers.delete(callback);
      
      // Arrêter l'intervalle si plus d'abonnés
      if (this.subscribers.size === 0 && this.refreshInterval) {
        this.stopRefreshInterval();
      }
    };
  }

  /**
   * Notifie tous les abonnés des nouvelles données
   */
  private notifySubscribers(data: DigitalDisplayData | null) {
    this.subscribers.forEach(callback => callback(data));
  }

  /**
   * Vérifie si le cache est encore valide
   */
  private isCacheValid(): boolean {
    return this.data !== null && (Date.now() - this.lastFetch) < this.CACHE_DURATION;
  }

  /**
   * Récupère les données de sécurité (avec cache)
   */
  async getData(): Promise<DigitalDisplayData | null> {
    // Si le cache est valide, retourner les données en cache
    if (this.isCacheValid()) {
      return this.data;
    }

    // Si une requête est déjà en cours, attendre son résultat
    if (this.isFetching && this.fetchPromise) {
      try {
        return await this.fetchPromise;
      } catch (error) {
        console.error('Erreur lors de la récupération des données de sécurité:', error);
        return this.data; // Retourner les données en cache même si expirées
      }
    }

    // Démarrer une nouvelle requête
    this.isFetching = true;
    this.fetchPromise = this.fetchData();

    try {
      const data = await this.fetchPromise;
      this.data = data;
      this.lastFetch = Date.now();
      this.isFetching = false;
      this.fetchPromise = null;
      
      // Notifier tous les abonnés
      this.notifySubscribers(data);
      
      return data;
    } catch (error) {
      this.isFetching = false;
      this.fetchPromise = null;
      console.error('Erreur lors de la récupération des données de sécurité:', error);
      return this.data; // Retourner les données en cache même si expirées
    }
  }

  /**
   * Récupère les données depuis l'API
   */
  private async fetchData(): Promise<DigitalDisplayData> {
    return await SecurityApi.getDigitalIndicators();
  }

  /**
   * Force une mise à jour des données (ignore le cache)
   */
  async forceRefresh(): Promise<DigitalDisplayData | null> {
    this.data = null;
    this.lastFetch = 0;
    return await this.getData();
  }

  /**
   * Démarre l'intervalle de rafraîchissement automatique
   */
  private startRefreshInterval(): void {
    this.refreshInterval = setInterval(async () => {
      if (this.subscribers.size > 0) {
        await this.getData();
      }
    }, this.CACHE_DURATION);
  }

  /**
   * Arrête l'intervalle de rafraîchissement automatique
   */
  private stopRefreshInterval(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  /**
   * Nettoie le cache
   */
  clearCache(): void {
    this.data = null;
    this.lastFetch = 0;
    this.isFetching = false;
    this.fetchPromise = null;
    this.stopRefreshInterval();
  }
}

// Instance singleton
export const securityDataCache = new SecurityDataCache(); 
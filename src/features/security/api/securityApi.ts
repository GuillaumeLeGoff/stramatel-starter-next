import { 
  SecurityEvent, 
  SecurityEventFilters, 
  CreateSecurityEventRequest, 
  DigitalDisplayData,
  SecurityStatsResponse 
} from '../types';

const API_BASE = '/api/security';

// Fonction utilitaire pour convertir les dates dans les objets SecurityEvent
function convertDatesInSecurityEvent(event: any): SecurityEvent {
  return {
    ...event,
    date: new Date(event.date),
    createdAt: new Date(event.createdAt),
    updatedAt: new Date(event.updatedAt)
  };
}

// Fonction utilitaire pour convertir les dates dans les indicateurs
function convertDatesInIndicators(indicators: any): DigitalDisplayData {
  return {
    ...indicators,
    // Ne pas convertir currentDate et lastAccidentDate car ils sont destinés à l'affichage
    // et doivent rester des chaînes selon l'interface DigitalDisplayData
  };
}

export class SecurityApi {
  /**
   * Récupérer les indicateurs digitaux de sécurité
   */
  static async getDigitalIndicators(days?: number): Promise<DigitalDisplayData> {
    const url = days 
      ? `${API_BASE}/indicators?days=${days}`
      : `${API_BASE}/indicators`;
      
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Erreur lors de la récupération des indicateurs');
    }
    
    return convertDatesInIndicators(data.data);
  }

  /**
   * Forcer la mise à jour des indicateurs
   */
  static async updateIndicators(userId: number): Promise<void> {
    const response = await fetch(`${API_BASE}/indicators`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Erreur lors de la mise à jour des indicateurs');
    }
  }

  /**
   * Créer un nouvel événement de sécurité
   */
  static async createSecurityEvent(eventData: CreateSecurityEventRequest & { createdBy: number }): Promise<SecurityEvent> {
    const response = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData)
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Erreur lors de la création de l\'événement');
    }
    
    return convertDatesInSecurityEvent(data.data);
  }

  /**
   * Récupérer les événements de sécurité avec filtres
   */
  static async getSecurityEvents(filters?: SecurityEventFilters): Promise<SecurityEvent[]> {
    const searchParams = new URLSearchParams();
    
    if (filters?.startDate) searchParams.append('startDate', filters.startDate.toISOString());
    if (filters?.endDate) searchParams.append('endDate', filters.endDate.toISOString());
    if (filters?.location) searchParams.append('location', filters.location);
    if (filters?.severity) searchParams.append('severity', filters.severity);
    
    const url = `${API_BASE}/events${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Erreur lors de la récupération des événements');
    }
    
    return data.data.map(convertDatesInSecurityEvent);
  }

  /**
   * Récupérer un événement spécifique
   */
  static async getSecurityEvent(id: number): Promise<SecurityEvent> {
    const response = await fetch(`${API_BASE}/events/${id}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Erreur lors de la récupération de l\'événement');
    }
    
    return convertDatesInSecurityEvent(data.data);
  }

  /**
   * Mettre à jour un événement de sécurité
   */
  static async updateSecurityEvent(id: number, updates: Partial<CreateSecurityEventRequest>): Promise<SecurityEvent> {
    const response = await fetch(`${API_BASE}/events/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates)
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Erreur lors de la mise à jour de l\'événement');
    }
    
    return convertDatesInSecurityEvent(data.data);
  }

  /**
   * Supprimer un événement de sécurité
   */
  static async deleteSecurityEvent(id: number): Promise<void> {
    const response = await fetch(`${API_BASE}/events/${id}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Erreur lors de la suppression de l\'événement');
    }
  }

  /**
   * Récupérer les statistiques de sécurité
   */
  static async getSecurityStatistics(year?: number): Promise<SecurityStatsResponse> {
    const url = year 
      ? `${API_BASE}/statistics?year=${year}`
      : `${API_BASE}/statistics`;
      
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Erreur lors de la récupération des statistiques');
    }
    
    return data.data;
  }

  /**
   * Calculer les accidents sur une période personnalisée
   */
  static async getAccidentsForPeriod(startDate: Date, endDate: Date): Promise<number> {
    const events = await this.getSecurityEvents({
      startDate,
      endDate
    });
    
    return events.length;
  }

  /**
   * Obtenir un résumé rapide des indicateurs pour l'affichage
   */
  static async getQuickSummary(): Promise<{
    daysWithoutAccident: number;
    thisYearAccidents: number;
    thisMonthAccidents: number;
    lastAccidentDate: string | null;
  }> {
    const indicators = await this.getDigitalIndicators();
    
    return {
      daysWithoutAccident: indicators.daysWithoutAccident,
      thisYearAccidents: indicators.currentYearAccidents,
      thisMonthAccidents: indicators.currentMonthAccidents,
      lastAccidentDate: indicators.lastAccidentDate ?? null
    };
  }
} 
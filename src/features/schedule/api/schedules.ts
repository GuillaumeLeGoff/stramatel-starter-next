import { CreateScheduleData, UpdateScheduleData, Schedule, ScheduleFilters } from '../types';

const API_BASE = '/api/schedules';

export const scheduleApi = {
  // Récupérer toutes les planifications
  getAll: async (filters?: ScheduleFilters): Promise<Schedule[]> => {
    const params = new URLSearchParams();
    
    if (filters?.status?.length) {
      params.append('status', filters.status.join(','));
    }
    if (filters?.priority?.length) {
      params.append('priority', filters.priority.join(','));
    }
    if (filters?.slideshowId) {
      params.append('slideshowId', filters.slideshowId.toString());
    }
    if (filters?.startDate) {
      params.append('startDate', filters.startDate.toISOString());
    }
    if (filters?.endDate) {
      params.append('endDate', filters.endDate.toISOString());
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }

    const url = params.toString() ? `${API_BASE}?${params}` : API_BASE;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Erreur lors du chargement des planifications');
    }
    
    return response.json();
  },

  // Récupérer une planification par ID
  getById: async (id: number): Promise<Schedule> => {
    const response = await fetch(`${API_BASE}/${id}`);
    
    if (!response.ok) {
      throw new Error('Planification introuvable');
    }
    
    return response.json();
  },

  // Créer une nouvelle planification
  create: async (data: CreateScheduleData): Promise<Schedule> => {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la création');
    }
    
    return response.json();
  },

  // Mettre à jour une planification
  update: async (data: UpdateScheduleData): Promise<Schedule> => {
    const { id, ...updateData } = data;
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la mise à jour');
    }
    
    return response.json();
  },

  // Supprimer une planification
  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la suppression');
    }
  },

  // Dupliquer une planification
  duplicate: async (id: number): Promise<Schedule> => {
    const response = await fetch(`${API_BASE}/${id}/duplicate`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la duplication');
    }
    
    return response.json();
  },

  // Activer/désactiver une planification
  toggleStatus: async (id: number): Promise<Schedule> => {
    const response = await fetch(`${API_BASE}/${id}/toggle`, {
      method: 'PATCH',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors du changement de statut');
    }
    
    return response.json();
  },

  // Récupérer les planifications pour une date donnée
  getByDate: async (date: Date): Promise<Schedule[]> => {
    const dateStr = date.toISOString().split('T')[0];
    const response = await fetch(`${API_BASE}/date/${dateStr}`);
    
    if (!response.ok) {
      throw new Error('Erreur lors du chargement des planifications');
    }
    
    return response.json();
  },

  // Récupérer les planifications pour une période
  getByDateRange: async (startDate: Date, endDate: Date): Promise<Schedule[]> => {
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
    
    const response = await fetch(`${API_BASE}/range?${params}`);
    
    if (!response.ok) {
      throw new Error('Erreur lors du chargement des planifications');
    }
    
    return response.json();
  },
}; 
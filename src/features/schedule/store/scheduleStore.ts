import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Schedule, ScheduleFilters, CreateScheduleData, UpdateScheduleData, ScheduleCalendarEvent } from '../types';

interface ScheduleState {
  // État
  schedules: Schedule[];
  loading: boolean;
  error: string | null;
  selectedSchedule: Schedule | null;
  filters: ScheduleFilters;
  
  // Actions
  setSchedules: (schedules: Schedule[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedSchedule: (schedule: Schedule | null) => void;
  setFilters: (filters: ScheduleFilters) => void;
  
  // Actions API
  fetchSchedules: () => Promise<void>;
  createSchedule: (data: CreateScheduleData) => Promise<Schedule>;
  updateSchedule: (data: UpdateScheduleData) => Promise<Schedule>;
  deleteSchedule: (id: number) => Promise<void>;
  
  // Utilitaires
  getCalendarEvents: () => ScheduleCalendarEvent[];
  getSchedulesByDate: (date: Date) => Schedule[];
  clearError: () => void;
}

export const useScheduleStore = create<ScheduleState>()(
  devtools(
    (set, get) => ({
      // État initial
      schedules: [],
      loading: false,
      error: null,
      selectedSchedule: null,
      filters: {},
      
      // Actions de base
      setSchedules: (schedules) => set({ schedules }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setSelectedSchedule: (selectedSchedule) => set({ selectedSchedule }),
      setFilters: (filters) => set({ filters }),
      
      // Actions API
      fetchSchedules: async () => {
        set({ loading: true, error: null });
        try {
          const response = await fetch('/api/schedules');
          if (!response.ok) {
            throw new Error('Erreur lors du chargement des planifications');
          }
          const schedules = await response.json();
          set({ schedules, loading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erreur inconnue',
            loading: false 
          });
        }
      },
      
      createSchedule: async (data) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch('/api/schedules', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });
          
          if (!response.ok) {
            throw new Error('Erreur lors de la création de la planification');
          }
          
          const newSchedule = await response.json();
          const { schedules } = get();
          set({ 
            schedules: [...schedules, newSchedule],
            loading: false 
          });
          
          return newSchedule;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erreur inconnue',
            loading: false 
          });
          throw error;
        }
      },
      
      updateSchedule: async (data) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`/api/schedules/${data.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });
          
          if (!response.ok) {
            throw new Error('Erreur lors de la mise à jour de la planification');
          }
          
          const updatedSchedule = await response.json();
          const { schedules } = get();
          set({ 
            schedules: schedules.map(s => s.id === data.id ? updatedSchedule : s),
            loading: false 
          });
          
          return updatedSchedule;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erreur inconnue',
            loading: false 
          });
          throw error;
        }
      },
      
      deleteSchedule: async (id) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`/api/schedules/${id}`, {
            method: 'DELETE',
          });
          
          if (!response.ok) {
            throw new Error('Erreur lors de la suppression de la planification');
          }
          
          const { schedules } = get();
          set({ 
            schedules: schedules.filter(s => s.id !== id),
            loading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erreur inconnue',
            loading: false 
          });
          throw error;
        }
      },
      
      // Utilitaires
      getCalendarEvents: () => {
        const { schedules, filters } = get();
        
        // Appliquer les filtres
        let filteredSchedules = schedules;
        
        if (filters.status && filters.status.length > 0) {
          filteredSchedules = filteredSchedules.filter(s => 
            filters.status!.includes(s.status)
          );
        }
        
        if (filters.priority && filters.priority.length > 0) {
          filteredSchedules = filteredSchedules.filter(s => 
            filters.priority!.includes(s.priority)
          );
        }
        
        if (filters.slideshowId) {
          filteredSchedules = filteredSchedules.filter(s => 
            s.slideshowId === filters.slideshowId
          );
        }
        
        if (filters.search) {
          const search = filters.search.toLowerCase();
          filteredSchedules = filteredSchedules.filter(s => 
            s.title.toLowerCase().includes(search) ||
            s.description?.toLowerCase().includes(search) ||
            s.slideshow?.name.toLowerCase().includes(search)
          );
        }
        
        // Convertir en événements de calendrier
        return filteredSchedules.map(schedule => {
          const startDateTime = new Date(schedule.startDate);
          const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
          startDateTime.setHours(startHour, startMinute);
          
          let endDateTime = new Date(schedule.endDate || schedule.startDate);
          if (schedule.endTime) {
            const [endHour, endMinute] = schedule.endTime.split(':').map(Number);
            endDateTime.setHours(endHour, endMinute);
          } else {
            endDateTime.setHours(startHour + 1, startMinute);
          }
          
          // Couleur basée sur la priorité
          let color: 'default' | 'blue' | 'green' | 'pink' | 'purple' = 'default';
          if (schedule.color) {
            switch (schedule.color) {
              case 'blue': color = 'blue'; break;
              case 'green': color = 'green'; break;
              case 'pink': color = 'pink'; break;
              case 'purple': color = 'purple'; break;
            }
          } else {
            switch (schedule.priority) {
              case 'HIGH': color = 'pink'; break;
              case 'URGENT': color = 'purple'; break;
              case 'LOW': color = 'green'; break;
              default: color = 'blue'; break;
            }
          }
          
          return {
            id: schedule.id.toString(),
            title: schedule.title,
            start: startDateTime,
            end: endDateTime,
            color,
            schedule,
          };
        });
      },
      
      getSchedulesByDate: (date) => {
        const { schedules } = get();
        return schedules.filter(schedule => {
          const scheduleDate = new Date(schedule.startDate);
          return scheduleDate.toDateString() === date.toDateString();
        });
      },
      
      clearError: () => set({ error: null }),
    }),
    {
      name: 'schedule-store',
    }
  )
); 
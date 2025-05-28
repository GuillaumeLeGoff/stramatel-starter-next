"use client";

import React, { createContext, useContext, useReducer, useCallback } from "react";
import { 
  Schedule, 
  ScheduleFilters, 
  CreateScheduleData, 
  UpdateScheduleData 
} from "../types";
import { 
  fetchSchedules, 
  createSchedule, 
  updateSchedule, 
  deleteSchedule,
  fetchSlideshows 
} from "../api/scheduleApi";

// Types pour le state
interface ScheduleState {
  schedules: Schedule[];
  slideshows: Array<{ id: number; name: string; description?: string }>;
  selectedSchedule: Schedule | null;
  filters: ScheduleFilters;
  loading: boolean;
  error: string | null;
}

// Types pour les actions
type ScheduleAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SCHEDULES'; payload: Schedule[] }
  | { type: 'SET_SLIDESHOWS'; payload: Array<{ id: number; name: string; description?: string }> }
  | { type: 'SET_SELECTED_SCHEDULE'; payload: Schedule | null }
  | { type: 'SET_FILTERS'; payload: ScheduleFilters }
  | { type: 'ADD_SCHEDULE'; payload: Schedule }
  | { type: 'UPDATE_SCHEDULE'; payload: Schedule }
  | { type: 'REMOVE_SCHEDULE'; payload: number };

// State initial
const initialState: ScheduleState = {
  schedules: [],
  slideshows: [],
  selectedSchedule: null,
  filters: {},
  loading: false,
  error: null,
};

// Reducer
function scheduleReducer(state: ScheduleState, action: ScheduleAction): ScheduleState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_SCHEDULES':
      return { ...state, schedules: action.payload, loading: false };
    case 'SET_SLIDESHOWS':
      return { ...state, slideshows: action.payload };
    case 'SET_SELECTED_SCHEDULE':
      return { ...state, selectedSchedule: action.payload };
    case 'SET_FILTERS':
      return { ...state, filters: action.payload };
    case 'ADD_SCHEDULE':
      return { 
        ...state, 
        schedules: [...state.schedules, action.payload],
        loading: false 
      };
    case 'UPDATE_SCHEDULE':
      return {
        ...state,
        schedules: state.schedules.map(schedule =>
          schedule.id === action.payload.id ? action.payload : schedule
        ),
        selectedSchedule: state.selectedSchedule?.id === action.payload.id 
          ? action.payload 
          : state.selectedSchedule,
        loading: false
      };
    case 'REMOVE_SCHEDULE':
      return {
        ...state,
        schedules: state.schedules.filter(schedule => schedule.id !== action.payload),
        selectedSchedule: state.selectedSchedule?.id === action.payload 
          ? null 
          : state.selectedSchedule,
        loading: false
      };
    default:
      return state;
  }
}

// Context
interface ScheduleContextType {
  state: ScheduleState;
  actions: {
    loadSchedules: (filters?: ScheduleFilters) => Promise<void>;
    loadSlideshows: () => Promise<void>;
    createSchedule: (data: CreateScheduleData) => Promise<Schedule>;
    updateSchedule: (data: UpdateScheduleData) => Promise<Schedule>;
    deleteSchedule: (id: number) => Promise<void>;
    setSelectedSchedule: (schedule: Schedule | null) => void;
    setFilters: (filters: ScheduleFilters) => void;
  };
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

// Provider
export function ScheduleProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(scheduleReducer, initialState);

  // Actions
  const loadSchedules = useCallback(async (filters?: ScheduleFilters) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      const schedules = await fetchSchedules(filters);
      dispatch({ type: 'SET_SCHEDULES', payload: schedules });
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Erreur inconnue' 
      });
    }
  }, []);

  const loadSlideshows = useCallback(async () => {
    try {
      const slideshows = await fetchSlideshows();
      dispatch({ type: 'SET_SLIDESHOWS', payload: slideshows });
    } catch (error) {
      console.error('Erreur lors du chargement des slideshows:', error);
    }
  }, []);

  const createScheduleAction = useCallback(async (data: CreateScheduleData): Promise<Schedule> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      const newSchedule = await createSchedule(data);
      dispatch({ type: 'ADD_SCHEDULE', payload: newSchedule });
      return newSchedule;
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Erreur inconnue' 
      });
      throw error;
    }
  }, []);

  const updateScheduleAction = useCallback(async (data: UpdateScheduleData): Promise<Schedule> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      const updatedSchedule = await updateSchedule(data);
      dispatch({ type: 'UPDATE_SCHEDULE', payload: updatedSchedule });
      return updatedSchedule;
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Erreur inconnue' 
      });
      throw error;
    }
  }, []);

  const deleteScheduleAction = useCallback(async (id: number): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      await deleteSchedule(id);
      dispatch({ type: 'REMOVE_SCHEDULE', payload: id });
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Erreur inconnue' 
      });
      throw error;
    }
  }, []);

  const setSelectedSchedule = useCallback((schedule: Schedule | null) => {
    dispatch({ type: 'SET_SELECTED_SCHEDULE', payload: schedule });
  }, []);

  const setFilters = useCallback((filters: ScheduleFilters) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  }, []);

  const contextValue: ScheduleContextType = {
    state,
    actions: {
      loadSchedules,
      loadSlideshows,
      createSchedule: createScheduleAction,
      updateSchedule: updateScheduleAction,
      deleteSchedule: deleteScheduleAction,
      setSelectedSchedule,
      setFilters,
    },
  };

  return (
    <ScheduleContext.Provider value={contextValue}>
      {children}
    </ScheduleContext.Provider>
  );
}

// Hook pour utiliser le context
export function useSchedule() {
  const context = useContext(ScheduleContext);
  if (context === undefined) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
} 
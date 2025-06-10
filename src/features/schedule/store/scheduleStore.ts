import { create } from "zustand";
import { Schedule, CreateScheduleData } from "../types";
import * as scheduleApi from "../api/scheduleApi";

type ViewType = "month" | "week" | "day";

interface ScheduleState {
  // État
  schedules: Schedule[];
  currentDate: Date;
  viewType: ViewType;
  isDialogOpen: boolean;
  selectedEvent: Schedule | undefined;
  dialogInitialDate: Date | undefined;
  dialogInitialTime: string | undefined;
  selectedDate: Date | undefined;
  isLoading: boolean;
  error: string | null;

  // Actions
  setSchedules: (schedules: Schedule[]) => void;
  addSchedule: (schedule: Schedule) => void;
  updateSchedule: (id: number, data: Partial<Schedule>) => void;
  deleteSchedule: (id: number) => Promise<void>;
  setCurrentDate: (date: Date) => void;
  setViewType: (viewType: ViewType) => void;
  setIsDialogOpen: (isOpen: boolean) => void;
  setSelectedEvent: (event: Schedule | undefined) => void;
  setDialogInitialDate: (date: Date | undefined) => void;
  setDialogInitialTime: (time: string | undefined) => void;
  setSelectedDate: (date: Date | undefined) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Actions composées
  openEventDialog: (event?: Schedule, date?: Date, time?: string) => void;
  closeDialog: () => void;
  saveEvent: (eventData: CreateScheduleData) => Promise<void>;
  loadSchedules: () => Promise<void>;
  navigateToDay: (date: Date) => void;
}

// Calendrier vide au démarrage
const initialSchedules: Schedule[] = [];

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  // État initial
  schedules: initialSchedules,
  currentDate: new Date(),
  viewType: "month",
  isDialogOpen: false,
  selectedEvent: undefined,
  dialogInitialDate: undefined,
  dialogInitialTime: undefined,
  selectedDate: undefined,
  isLoading: false,
  error: null,

  // Actions simples
  setSchedules: (schedules) => set({ schedules }),
  addSchedule: (schedule) =>
    set((state) => ({
      schedules: [...state.schedules, schedule],
    })),
  updateSchedule: (id, data) =>
    set((state) => ({
      schedules: state.schedules.map((schedule) =>
        schedule.id === id
          ? { ...schedule, ...data, updatedAt: new Date() }
          : schedule
      ),
    })),
  deleteSchedule: async (id) => {
    try {
      set({ isLoading: true, error: null });
      await scheduleApi.deleteSchedule(id);
      set((state) => ({
        schedules: state.schedules.filter((schedule) => schedule.id !== id),
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erreur lors de la suppression";
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  setCurrentDate: (date) => set({ currentDate: date }),
  setViewType: (viewType) => set({ viewType }),
  setIsDialogOpen: (isDialogOpen) => set({ isDialogOpen }),
  setSelectedEvent: (selectedEvent) => set({ selectedEvent }),
  setDialogInitialDate: (dialogInitialDate) => set({ dialogInitialDate }),
  setDialogInitialTime: (dialogInitialTime) => set({ dialogInitialTime }),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  // Actions composées
  openEventDialog: (event, date, time) => {
    console.log("openEventDialog appelé avec:", { event, date, time });
    set({
      isDialogOpen: true,
      selectedEvent: event,
      dialogInitialDate: date,
      dialogInitialTime: time,
    });
  },

  closeDialog: () =>
    set({
      isDialogOpen: false,
      selectedEvent: undefined,
      dialogInitialDate: undefined,
      dialogInitialTime: undefined,
    }),

  saveEvent: async (eventData) => {
    const state = get();

    try {
      set({ isLoading: true, error: null });

      if (state.selectedEvent) {
        // Modifier un événement existant
        const updatedSchedule = await scheduleApi.updateSchedule(
          state.selectedEvent.id,
          eventData
        );
        state.updateSchedule(state.selectedEvent.id, updatedSchedule);
      } else {
        // Créer un nouvel événement
        const newSchedule = await scheduleApi.createSchedule(eventData);
        state.addSchedule(newSchedule);
      }

      state.closeDialog();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      set({ error: errorMessage });
      throw error; // Re-throw pour que l'EventDialog puisse gérer l'erreur
    } finally {
      set({ isLoading: false });
    }
  },

  loadSchedules: async () => {
    const state = get();

    try {
      set({ isLoading: true, error: null });
      const schedules = await scheduleApi.fetchAllSchedules();
      set({ schedules });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erreur lors du chargement des événements";
      set({ error: errorMessage });
    } finally {
      set({ isLoading: false });
    }
  },

  navigateToDay: (date) =>
    set({
      currentDate: date,
      viewType: "day",
    }),
}));

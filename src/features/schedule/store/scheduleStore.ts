import { create } from "zustand";
import { Schedule, CreateScheduleData } from "../types";

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

  // Actions
  setSchedules: (schedules: Schedule[]) => void;
  addSchedule: (schedule: Schedule) => void;
  updateSchedule: (id: number, data: Partial<Schedule>) => void;
  deleteSchedule: (id: number) => void;
  setCurrentDate: (date: Date) => void;
  setViewType: (viewType: ViewType) => void;
  setIsDialogOpen: (isOpen: boolean) => void;
  setSelectedEvent: (event: Schedule | undefined) => void;
  setDialogInitialDate: (date: Date | undefined) => void;
  setDialogInitialTime: (time: string | undefined) => void;
  setSelectedDate: (date: Date | undefined) => void;

  // Actions composées
  openEventDialog: (event?: Schedule, date?: Date, time?: string) => void;
  closeDialog: () => void;
  saveEvent: (eventData: CreateScheduleData) => void;
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
  deleteSchedule: (id) =>
    set((state) => ({
      schedules: state.schedules.filter((schedule) => schedule.id !== id),
    })),
  setCurrentDate: (date) => set({ currentDate: date }),
  setViewType: (viewType) => set({ viewType }),
  setIsDialogOpen: (isDialogOpen) => set({ isDialogOpen }),
  setSelectedEvent: (selectedEvent) => set({ selectedEvent }),
  setDialogInitialDate: (dialogInitialDate) => set({ dialogInitialDate }),
  setDialogInitialTime: (dialogInitialTime) => set({ dialogInitialTime }),
  setSelectedDate: (selectedDate) => set({ selectedDate }),

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

  saveEvent: (eventData) => {
    const state = get();
    if (state.selectedEvent) {
      // Modifier un événement existant
      state.updateSchedule(state.selectedEvent.id, {
        title: eventData.title,
        slideshowId: eventData.slideshowId,
        startDate: eventData.startDate,
        endDate: eventData.endDate,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        allDay: eventData.allDay,
        isRecurring: eventData.isRecurring,
        color: eventData.color,
      });
    } else {
      // Créer un nouvel événement
      const newEvent: Schedule = {
        id: Math.max(...state.schedules.map((s) => s.id), 0) + 1,
        title: eventData.title,
        slideshowId: eventData.slideshowId,
        createdBy: 1, // ID utilisateur par défaut
        startDate: eventData.startDate,
        endDate: eventData.endDate,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        allDay: eventData.allDay,
        isRecurring: eventData.isRecurring,
        color: eventData.color,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      state.addSchedule(newEvent);
    }
    state.closeDialog();
  },

  navigateToDay: (date) =>
    set({
      currentDate: date,
      viewType: "day",
    }),
}));

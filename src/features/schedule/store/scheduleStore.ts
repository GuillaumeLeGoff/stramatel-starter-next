import { create } from "zustand";
import {
  Schedule,
  CreateScheduleData,
  SchedulePriority,
  ScheduleStatus,
} from "../types";

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

// Données d'exemple
const initialSchedules: Schedule[] = [
  {
    id: 1,
    title: "Réunion équipe",
    description: "Réunion hebdomadaire de l'équipe",
    slideshowId: 1,
    createdBy: 1,
    startDate: new Date(),
    startTime: "09:00",
    endTime: "10:00",
    allDay: false,
    isRecurring: true,
    status: ScheduleStatus.ACTIVE,
    priority: SchedulePriority.HIGH,
    color: "#F59E0B",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    title: "Formation",
    description: "Formation sur les nouvelles technologies",
    slideshowId: 2,
    createdBy: 1,
    startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Demain
    startTime: "14:00",
    endTime: "17:00",
    allDay: false,
    isRecurring: false,
    status: ScheduleStatus.ACTIVE,
    priority: SchedulePriority.NORMAL,
    color: "#3B82F6",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 3,
    title: "Conférence",
    description: "Conférence annuelle de l'entreprise",
    slideshowId: 3,
    createdBy: 1,
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Dans une semaine
    allDay: true,
    startTime: "00:00",
    isRecurring: false,
    status: ScheduleStatus.ACTIVE,
    priority: SchedulePriority.URGENT,
    color: "#EF4444",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

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
        description: eventData.description,
        slideshowId: eventData.slideshowId,
        startDate: eventData.startDate,
        endDate: eventData.endDate,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        allDay: eventData.allDay,
        isRecurring: eventData.isRecurring,
        status: eventData.status,
        priority: eventData.priority,
        color: eventData.color,
      });
    } else {
      // Créer un nouvel événement
      const newEvent: Schedule = {
        id: Math.max(...state.schedules.map((s) => s.id), 0) + 1,
        title: eventData.title,
        description: eventData.description,
        slideshowId: eventData.slideshowId,
        createdBy: 1, // ID utilisateur par défaut
        startDate: eventData.startDate,
        endDate: eventData.endDate,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        allDay: eventData.allDay,
        isRecurring: eventData.isRecurring,
        status: eventData.status,
        priority: eventData.priority,
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

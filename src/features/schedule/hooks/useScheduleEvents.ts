import { isSameDay } from "date-fns";
import { useScheduleStore } from "../store/scheduleStore";
import { Schedule } from "../types";

export function useScheduleEvents() {
  const {
    schedules,
    openEventDialog,
    deleteSchedule,
    navigateToDay,
    setSelectedDate,
  } = useScheduleStore();

  // Obtenir les événements pour une date spécifique
  const getEventsForDate = (date: Date): Schedule[] => {
    return schedules.filter((schedule) => {
      const scheduleDate = new Date(schedule.startDate);
      return isSameDay(scheduleDate, date);
    });
  };

  // Gestionnaires d'événements
  const handleEventClick = (event: Schedule) => {
    openEventDialog(event);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    openEventDialog(undefined, date);
  };

  const handleCreateEvent = (date: Date, time?: string) => {
    console.log("handleCreateEvent appelé avec:", { date, time });
    openEventDialog(undefined, date, time);
  };

  const handleDeleteEvent = (eventId: number) => {
    deleteSchedule(eventId);
  };

  const handleNavigateToDay = (date: Date) => {
    navigateToDay(date);
  };

  return {
    schedules,
    getEventsForDate,
    handleEventClick,
    handleDateClick,
    handleCreateEvent,
    handleDeleteEvent,
    handleNavigateToDay,
  };
}

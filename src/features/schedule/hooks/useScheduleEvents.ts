import { isSameDay } from "date-fns";
import { useScheduleStore } from "../store/scheduleStore";
import { Schedule, SchedulePriority } from "../types";

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

  // Obtenir la couleur selon la priorité
  const getPriorityColor = (priority: SchedulePriority): string => {
    switch (priority) {
      case SchedulePriority.URGENT:
        return "bg-red-500";
      case SchedulePriority.HIGH:
        return "bg-orange-500";
      case SchedulePriority.NORMAL:
        return "bg-blue-500";
      case SchedulePriority.LOW:
        return "bg-gray-500";
      default:
        return "bg-blue-500";
    }
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
    getPriorityColor,
    handleEventClick,
    handleDateClick,
    handleCreateEvent,
    handleDeleteEvent,
    handleNavigateToDay,
  };
}

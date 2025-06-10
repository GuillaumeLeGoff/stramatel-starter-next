import {
  isSameDay,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  isAfter,
  isBefore,
  startOfDay,
} from "date-fns";
import { useScheduleStore } from "../store/scheduleStore";
import { Schedule, RecurrenceType } from "../types";

export function useScheduleEvents() {
  const {
    schedules,
    openEventDialog,
    deleteSchedule,
    navigateToDay,
    setSelectedDate,
    loadSchedules,
    isLoading,
    error,
  } = useScheduleStore();

  // Vérifier si une date correspond à une récurrence
  const isRecurrenceMatch = (schedule: Schedule, date: Date): boolean => {
    const startDate = startOfDay(new Date(schedule.startDate));
    const targetDate = startOfDay(date);

    // Si la date cible est avant la date de début, pas de correspondance
    if (isBefore(targetDate, startDate)) {
      return false;
    }

    // Si la récurrence a une date de fin et qu'on la dépasse
    if (
      schedule.recurrence?.endDate &&
      isAfter(targetDate, startOfDay(new Date(schedule.recurrence.endDate)))
    ) {
      return false;
    }

    const {
      type,
      interval = 1,
      daysOfWeek,
      occurrences,
    } = schedule.recurrence || {};

    switch (type) {
      case RecurrenceType.DAILY:
        const daysDiff = Math.floor(
          (targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const isValidOccurrence = daysDiff >= 0 && daysDiff % interval === 0;

        // Vérifier le nombre d'occurrences
        if (occurrences && isValidOccurrence) {
          const occurrenceNumber = Math.floor(daysDiff / interval) + 1;
          return occurrenceNumber <= occurrences;
        }

        return isValidOccurrence;

      case RecurrenceType.WEEKLY:
        const weeksDiff = Math.floor(
          (targetDate.getTime() - startDate.getTime()) /
            (1000 * 60 * 60 * 24 * 7)
        );
        const isValidWeek = weeksDiff >= 0 && weeksDiff % interval === 0;

        // Si des jours de la semaine sont spécifiés
        let parsedDaysOfWeek: number[] = [];
        if (daysOfWeek) {
          try {
            parsedDaysOfWeek =
              typeof daysOfWeek === "string"
                ? JSON.parse(daysOfWeek)
                : daysOfWeek;
          } catch {
            parsedDaysOfWeek = [];
          }
        }

        if (parsedDaysOfWeek && parsedDaysOfWeek.length > 0) {
          const targetDayOfWeek = targetDate.getDay();
          const isValidDay = parsedDaysOfWeek.includes(targetDayOfWeek);

          if (!isValidDay) return false;

          // Vérifier si cette semaine est dans l'intervalle
          const weeksFromStart = Math.floor(
            (targetDate.getTime() - startDate.getTime()) /
              (1000 * 60 * 60 * 24 * 7)
          );
          const isInInterval = weeksFromStart % interval === 0;

          if (occurrences && isInInterval) {
            // Compter les occurrences jusqu'à cette date
            let count = 0;
            let currentDate = new Date(startDate);

            while (currentDate <= targetDate) {
              const currentWeeksFromStart = Math.floor(
                (currentDate.getTime() - startDate.getTime()) /
                  (1000 * 60 * 60 * 24 * 7)
              );
              if (
                currentWeeksFromStart % interval === 0 &&
                parsedDaysOfWeek.includes(currentDate.getDay())
              ) {
                count++;
                if (isSameDay(currentDate, targetDate)) {
                  return count <= occurrences;
                }
              }
              currentDate = addDays(currentDate, 1);
            }
            return false;
          }

          return isInInterval;
        } else {
          // Récurrence hebdomadaire simple (même jour de la semaine)
          const targetDayOfWeek = targetDate.getDay();
          const startDayOfWeek = startDate.getDay();

          if (targetDayOfWeek !== startDayOfWeek) return false;

          if (occurrences && isValidWeek) {
            const occurrenceNumber = Math.floor(weeksDiff / interval) + 1;
            return occurrenceNumber <= occurrences;
          }

          return isValidWeek;
        }

      case RecurrenceType.MONTHLY:
        // Récurrence mensuelle simple (même jour du mois)
        const startDay = startDate.getDate();
        const targetDay = targetDate.getDate();

        if (startDay !== targetDay) return false;

        const monthsDiff =
          (targetDate.getFullYear() - startDate.getFullYear()) * 12 +
          (targetDate.getMonth() - startDate.getMonth());
        const isValidMonth = monthsDiff >= 0 && monthsDiff % interval === 0;

        if (occurrences && isValidMonth) {
          const occurrenceNumber = Math.floor(monthsDiff / interval) + 1;
          return occurrenceNumber <= occurrences;
        }

        return isValidMonth;

      case RecurrenceType.YEARLY:
        // Récurrence annuelle (même jour et mois)
        const startMonth = startDate.getMonth();
        const startDayOfMonth = startDate.getDate();
        const targetMonth = targetDate.getMonth();
        const targetDayOfMonth = targetDate.getDate();

        if (startMonth !== targetMonth || startDayOfMonth !== targetDayOfMonth)
          return false;

        const yearsDiff = targetDate.getFullYear() - startDate.getFullYear();
        const isValidYear = yearsDiff >= 0 && yearsDiff % interval === 0;

        if (occurrences && isValidYear) {
          const occurrenceNumber = Math.floor(yearsDiff / interval) + 1;
          return occurrenceNumber <= occurrences;
        }

        return isValidYear;

      default:
        return false;
    }
  };

  // Obtenir les événements pour une date spécifique
  const getEventsForDate = (date: Date): Schedule[] => {
    return schedules.filter((schedule) => {
      const scheduleStartDate = new Date(schedule.startDate);

      // Si l'événement n'est pas récurrent, vérifier juste la date de début
      if (!schedule.isRecurring) {
        return isSameDay(scheduleStartDate, date);
      }

      // Si l'événement est récurrent, vérifier si la date correspond à la récurrence
      return isRecurrenceMatch(schedule, date);
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

  const handleDeleteEvent = async (eventId: number) => {
    try {
      await deleteSchedule(eventId);
    } catch (error) {
      console.error("Erreur lors de la suppression de l'événement:", error);
    }
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
    loadSchedules,
    isLoading,
    error,
  };
}

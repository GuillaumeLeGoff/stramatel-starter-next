import {
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
} from "date-fns";
import { useScheduleStore } from "../store/scheduleStore";

export function useScheduleNavigation() {
  const { currentDate, viewType, setCurrentDate } = useScheduleStore();

  const navigatePrevious = () => {
    switch (viewType) {
      case "month":
        setCurrentDate(subMonths(currentDate, 1));
        break;
      case "week":
        setCurrentDate(subWeeks(currentDate, 1));
        break;
      case "day":
        setCurrentDate(subDays(currentDate, 1));
        break;
    }
  };

  const navigateNext = () => {
    switch (viewType) {
      case "month":
        setCurrentDate(addMonths(currentDate, 1));
        break;
      case "week":
        setCurrentDate(addWeeks(currentDate, 1));
        break;
      case "day":
        setCurrentDate(addDays(currentDate, 1));
        break;
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const navigateToDate = (date: Date) => {
    setCurrentDate(date);
  };

  return {
    currentDate,
    viewType,
    navigatePrevious,
    navigateNext,
    goToToday,
    navigateToDate,
  };
}

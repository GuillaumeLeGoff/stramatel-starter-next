"use client";

import React, { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  isToday,
} from "date-fns";
import { fr } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  Clock,
  Grid3X3,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { useScheduleEvents } from "../hooks/useScheduleEvents";

type ViewType = "month" | "week" | "day";

export function ScheduleCalendar() {
  const {
    getEventsForDate,
    getPriorityColor,
    handleEventClick,
    handleDateClick,
    handleCreateEvent,
  } = useScheduleEvents();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>("month");

  // Navigation functions
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

  // Month view component
  const MonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Header with day names */}
        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-medium text-gray-500"
          >
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {weeks.map((week, weekIndex) =>
          week.map((day, dayIndex) => {
            const dayEvents = getEventsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isCurrentDay = isToday(day);

            return (
              <Card
                key={`${weekIndex}-${dayIndex}`}
                className={`min-h-[140px] cursor-pointer transition-colors hover:bg-gray-50 ${
                  !isCurrentMonth ? "opacity-50" : ""
                } ${isCurrentDay ? "ring-2 ring-blue-500" : ""}`}
                onClick={() => handleDateClick?.(day)}
              >
                <CardContent className="p-3 h-full flex flex-col">
                  <div className="flex justify-between items-center mb-2">
                    <span
                      className={`text-sm font-medium ${
                        isCurrentDay ? "font-bold text-blue-600" : ""
                      }`}
                    >
                      {format(day, "d")}
                    </span>
                    {dayEvents.length > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateEvent?.(day);
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-1 flex-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className={`text-xs p-2 rounded cursor-pointer ${getPriorityColor(
                          event.priority
                        )} text-white min-h-[24px] flex items-center justify-between hover:opacity-90 transition-opacity`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick?.(event);
                        }}
                      >
                        <span className="truncate font-medium">
                          {event.allDay
                            ? event.title
                            : `${event.startTime} ${event.title}`}
                        </span>
                        {!event.allDay && (
                          <span className="text-xs opacity-75 ml-1 flex-shrink-0">
                            {event.endTime}
                          </span>
                        )}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-500 p-1 text-center bg-gray-100 rounded">
                        +{dayEvents.length - 3} autres
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    );
  };

  // Week view component
  const WeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({
      start: weekStart,
      end: addDays(weekStart, 6),
    });

    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="flex flex-col h-full">
        {/* Header with dates */}
        <div className="flex border-b">
          <div className="w-16 flex-shrink-0 p-2 border-r border-gray-200"></div>
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className="flex-1 p-2 text-center border-r border-gray-200 last:border-r-0"
            >
              <div
                className={`text-lg font-semibold ${
                  isToday(day) ? "text-blue-600" : ""
                }`}
              >
                {format(day, "EEE", { locale: fr })}
              </div>
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div className="flex flex-1">
          {/* Time column */}
          <div className="w-16 flex-shrink-0 border-r border-gray-200 relative">
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-12 border-b border-gray-100 relative"
              >
                <div className="absolute -bottom-2 right-2 text-xs text-gray-500">
                  {`${hour.toString().padStart(2, "0")}:00`}
                </div>
              </div>
            ))}
          </div>

          {/* Day columns with scroll */}
          <div className="flex flex-1 overflow-auto">
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className="flex-1 border-r border-gray-200 last:border-r-0 relative min-w-0"
              >
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="h-12 border-b border-gray-100 cursor-pointer hover:bg-gray-50 relative"
                    onClick={() =>
                      handleCreateEvent?.(
                        day,
                        `${hour.toString().padStart(2, "0")}:00`
                      )
                    }
                  >
                    {getEventsForDate(day)
                      .filter((event) => {
                        if (event.allDay) return hour === 0;
                        const eventHour = parseInt(
                          event.startTime.split(":")[0]
                        );
                        return eventHour === hour;
                      })
                      .map((event) => (
                        <div
                          key={event.id}
                          className={`absolute left-1 right-1 p-1 rounded text-xs cursor-pointer ${getPriorityColor(
                            event.priority
                          )} text-white z-10`}
                          style={{
                            top: event.allDay ? "2px" : "2px",
                            height: event.allDay ? "20px" : "44px",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick?.(event);
                          }}
                        >
                          <div className="truncate font-medium">
                            {event.title}
                          </div>
                          {!event.allDay && (
                            <div className="truncate opacity-90">
                              {event.startTime} - {event.endTime}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Day view component
  const DayView = () => {
    const dayEvents = getEventsForDate(currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="flex flex-col">
        {/* Time grid */}
        <div className="flex flex-1">
          {/* Time column */}
          <div className="w-16 flex-shrink-0 border-r border-gray-200 relative">
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-12 border-b border-gray-100 relative"
              >
                <div className="absolute -bottom-2 right-2 text-xs text-gray-500">
                  {`${hour.toString().padStart(2, "0")}:00`}
                </div>
              </div>
            ))}
          </div>

          {/* Day column */}
          <div className="flex-1 relative">
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-12 border-b border-gray-100 cursor-pointer hover:bg-gray-50 relative"
                onClick={() =>
                  handleCreateEvent?.(
                    currentDate,
                    `${hour.toString().padStart(2, "0")}:00`
                  )
                }
              >
                {dayEvents
                  .filter((event) => {
                    if (event.allDay) return hour === 0;
                    const eventHour = parseInt(event.startTime.split(":")[0]);
                    return eventHour === hour;
                  })
                  .map((event) => (
                    <div
                      key={event.id}
                      className={`absolute left-2 right-2 p-2 rounded cursor-pointer ${getPriorityColor(
                        event.priority
                      )} text-white z-10`}
                      style={{
                        top: event.allDay ? "2px" : "2px",
                        height: event.allDay ? "20px" : "44px",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEventClick?.(event);
                      }}
                    >
                      <div className="font-medium">{event.title}</div>
                      {!event.allDay && (
                        <div className="text-sm opacity-90">
                          {event.startTime} - {event.endTime}
                        </div>
                      )}
                      {event.description && (
                        <div className="text-xs opacity-75 mt-1">
                          {event.description}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const getViewTitle = () => {
    switch (viewType) {
      case "month":
        return format(currentDate, "MMMM yyyy", { locale: fr });
      case "week":
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekEnd = addDays(weekStart, 6);
        return `${format(weekStart, "d MMM", { locale: fr })} - ${format(
          weekEnd,
          "d MMM yyyy",
          { locale: fr }
        )}`;
      case "day":
        return format(currentDate, "EEEE d MMMM yyyy", { locale: fr });
      default:
        return "";
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-4">
          <Button onClick={goToToday} variant="outline">
            Aujourd&apos;hui
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button onClick={navigatePrevious} variant="outline" size="sm">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-[200px] text-center font-semibold">
            {getViewTitle()}
          </div>
          <Button onClick={navigateNext} variant="outline" size="sm">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Tabs
            value={viewType}
            onValueChange={(value) => setViewType(value as ViewType)}
          >
            <TabsList>
              <TabsTrigger value="month">
                <Calendar className="h-4 w-4 mr-1" />
                Mois
              </TabsTrigger>
              <TabsTrigger value="week">
                <Grid3X3 className="h-4 w-4 mr-1" />
                Semaine
              </TabsTrigger>
              <TabsTrigger value="day">
                <Clock className="h-4 w-4 mr-1" />
                Jour
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            onClick={() => {
              handleCreateEvent?.(new Date());
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Créer
          </Button>
        </div>
      </div>

      {/* Calendar content */}
      <div className="flex-1 p-4 overflow-auto">
        {viewType === "month" && <MonthView />}
        {viewType === "week" && <WeekView />}
        {viewType === "day" && <DayView />}
      </div>
    </div>
  );
}

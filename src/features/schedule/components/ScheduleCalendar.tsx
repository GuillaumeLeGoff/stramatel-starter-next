"use client";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks
} from "date-fns";
import { fr } from "date-fns/locale";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Grid3X3,
  Plus,
} from "lucide-react";
import {  useState } from "react";
import { useScheduleEvents } from "../hooks/useScheduleEvents";

type ViewType = "month" | "week" | "day";

export function ScheduleCalendar() {
  const {
    getEventsForDate,
    handleEventClick,
    handleCreateEvent,
  } = useScheduleEvents();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>("month");
  



  // Composant pour la ligne de temps actuelle
  const CurrentTimeLine = ({ day }: { day: Date }) => {
    if (!isToday(day)) return null;

    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    // Hauteur d'une heure = 48px
    const hourHeight = 48;


    // Position de départ en minutes depuis minuit
    const startTotalMinutes = hours * 60 + minutes;
    // Position de fin en minutes depuis minuit


    // Position en pixels depuis le début de la journée (corrige le décalage !)
    const topPosition = (startTotalMinutes / 60) * hourHeight;
    // Hauteur en pixels basée sur la durée

    
    // Position en pixels depuis le début de la journée


    return (
      <>
        {/* Ligne rouge */}
        <div
          className="absolute left-0 right-0 z-50 flex items-center"
          style={{ top: `${topPosition-2}px` }}
        >
          <div className="h-0.5 bg-red-500 flex-1"></div>
          <div className="bg-red-500 w-3 h-3 rounded-full -mr-1.5"></div>
        </div>
        {/* Heure actuelle dans la colonne de temps */}
        <div
          className="absolute  z-50 text-xs text-red-500 font-medium px-1 rounded"
          style={{ top: `${topPosition - 12}px` }}
        >
          {format(now, "HH:mm")}
        </div>
      </>
    );
  };

  // Fonction pour calculer la position et la taille des événements
  const getEventStyle = (event: any) => {
    if (event.allDay) {
      // Les événements "journée entière" couvrent toute la journée (24h * 48px = 1152px)
      return {
        top: "0px",
        height: "1152px", // 24 heures * 48px par heure
      };
    }

    const startHour = parseInt(event.startTime.split(":")[0]);
    const startMinute = parseInt(event.startTime.split(":")[1]);
    const endHour = parseInt(event.endTime?.split(":")[0] || startHour + 1);
    const endMinute = parseInt(event.endTime?.split(":")[1] || 0);

    // Hauteur d'une heure = 48px (h-12 = 3rem = 48px)
    const hourHeight = 48;

    // Position de départ en minutes depuis minuit
    const startTotalMinutes = startHour * 60 + startMinute;
    // Position de fin en minutes depuis minuit
    const endTotalMinutes = endHour * 60 + endMinute;

    // Durée en minutes
    const durationMinutes = endTotalMinutes - startTotalMinutes;

    // Position en pixels depuis le début de la journée (corrige le décalage !)
    const topPosition = (startTotalMinutes / 60) * hourHeight;
    // Hauteur en pixels basée sur la durée
    const height = (durationMinutes / 60) * hourHeight;

    return {
      top: `${topPosition}px`,
      height: `${height}px`,
    };
  };

  // Fonction pour détecter les conflits d'événements et calculer leur positionnement
  const getEventLayoutInfo = (events: any[]) => {
    // Trier les événements par heure de début
    const sortedEvents = [...events].sort((a, b) => {
      if (a.allDay && !b.allDay) return -1;
      if (!a.allDay && b.allDay) return 1;
      if (a.allDay && b.allDay) return 0;
      
      const aStart = a.startTime.split(':').map(Number);
      const bStart = b.startTime.split(':').map(Number);
      return (aStart[0] * 60 + aStart[1]) - (bStart[0] * 60 + bStart[1]);
    });

    const layoutInfo = [];
    
    // Fonction pour vérifier si deux événements se chevauchent
    const eventsOverlap = (event1: any, event2: any) => {
      if (event1.allDay || event2.allDay) return false;
      
      const event1Start = event1.startTime.split(':').map(Number);
      const event1End = event1.endTime ? event1.endTime.split(':').map(Number) : [event1Start[0] + 1, 0];
      const event1StartMinutes = event1Start[0] * 60 + event1Start[1];
      const event1EndMinutes = event1End[0] * 60 + event1End[1];

      const event2Start = event2.startTime.split(':').map(Number);
      const event2End = event2.endTime ? event2.endTime.split(':').map(Number) : [event2Start[0] + 1, 0];
      const event2StartMinutes = event2Start[0] * 60 + event2Start[1];
      const event2EndMinutes = event2End[0] * 60 + event2End[1];

      // Il y a chevauchement si les événements se croisent temporellement
      return !(event1EndMinutes <= event2StartMinutes || event1StartMinutes >= event2EndMinutes);
    };

    // Créer des groupes d'événements qui se chevauchent
    const conflictGroups: any[][] = [];
    const processedEvents = new Set();

    for (const event of sortedEvents) {
      if (processedEvents.has(event.id)) continue;

      if (event.allDay) {
        layoutInfo.push({
          event,
          column: 0,
          totalColumns: 1,
          hasConflict: false
        });
        processedEvents.add(event.id);
        continue;
      }

      // Trouver tous les événements qui se chevauchent avec celui-ci
      const conflictingEvents = [event];
      const toCheck = [event];
      processedEvents.add(event.id);

      while (toCheck.length > 0) {
        const currentEvent = toCheck.pop();
        
        for (const otherEvent of sortedEvents) {
          if (processedEvents.has(otherEvent.id) || otherEvent.allDay) continue;
          
          // Vérifier si cet événement chevauche avec n'importe quel événement du groupe
          const overlapsWithGroup = conflictingEvents.some(groupEvent => 
            eventsOverlap(groupEvent, otherEvent)
          );
          
          if (overlapsWithGroup) {
            conflictingEvents.push(otherEvent);
            toCheck.push(otherEvent);
            processedEvents.add(otherEvent.id);
          }
        }
      }

      // Si l'événement n'a aucun conflit, il garde sa largeur normale
      if (conflictingEvents.length === 1) {
        layoutInfo.push({
          event,
          column: 0,
          totalColumns: 1,
          hasConflict: false
        });
      } else {
        // Organiser les événements conflictuels en colonnes
        conflictGroups.push(conflictingEvents);
        const columns: any[][] = [];

        for (const conflictEvent of conflictingEvents) {
          const eventStart = conflictEvent.startTime.split(':').map(Number);
          const eventEnd = conflictEvent.endTime ? conflictEvent.endTime.split(':').map(Number) : [eventStart[0] + 1, 0];
          const eventStartMinutes = eventStart[0] * 60 + eventStart[1];
          const eventEndMinutes = eventEnd[0] * 60 + eventEnd[1];

          // Trouver une colonne libre pour cet événement
          let targetColumn = -1;
          for (let i = 0; i < columns.length; i++) {
            const canFit = columns[i].every(otherEvent => {
              const otherStart = otherEvent.startTime.split(':').map(Number);
              const otherEnd = otherEvent.endTime ? otherEvent.endTime.split(':').map(Number) : [otherStart[0] + 1, 0];
              const otherStartMinutes = otherStart[0] * 60 + otherStart[1];
              const otherEndMinutes = otherEnd[0] * 60 + otherEnd[1];

              // Pas de conflit si l'un se termine avant que l'autre commence
              return eventEndMinutes <= otherStartMinutes || eventStartMinutes >= otherEndMinutes;
            });

            if (canFit) {
              targetColumn = i;
              break;
            }
          }

          // Si aucune colonne libre trouvée, créer une nouvelle colonne
          if (targetColumn === -1) {
            targetColumn = columns.length;
            columns.push([]);
          }

          columns[targetColumn].push(conflictEvent);

          layoutInfo.push({
            event: conflictEvent,
            column: targetColumn,
            totalColumns: columns.length,
            hasConflict: true
          });
        }
      }
    }

    return layoutInfo;
  };

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

  // Fonction pour naviguer vers la vue jour d'une date spécifique
  const navigateToDay = (day: Date) => {
    setCurrentDate(day);
    setViewType("day");
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
                onClick={() => navigateToDay(day)}
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
                  </div>

                  <div className="space-y-1 flex-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className="text-xs p-2 rounded cursor-pointer text-white min-h-[24px] flex items-center justify-between hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: event.color || "#3B82F6" }}
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
              className={`flex-1 p-2 text-center  ${
                isToday(day) || isToday(subDays(day, -1))
                  ? "border-blue-500 border-r"
                  : "border-gray-100 border-r"
              } last:border-r-0`}
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
        <div className="flex flex-1 relative">
          {/* Time column */}
          <div className="w-16 flex-shrink-0 border-r border-gray-200 relative">
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-12 border-b border-gray-100 relative"
              >
                <div className="absolute -top-2 right-2 text-xs text-gray-500">
                  {`${hour.toString().padStart(2, "0")}:00`}
                </div>
              </div>
            ))}
          </div>

          {/* Day columns with scroll */}
          <div className="flex flex-1 overflow-auto relative">
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={`flex-1 border-r ${
                  isToday(day) || isToday(subDays(day, -1))
                    ? "border-blue-500"
                    : "border-gray-100"
                } last:border-r-0 relative min-w-0`}
              >
                {/* Grille des heures */}
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="h-12 border-b border-blue-100 cursor-pointer hover:bg-gray-50 relative"
                    onClick={() =>
                      handleCreateEvent?.(
                        day,
                        `${hour.toString().padStart(2, "0")}:00`
                      )
                    }
                  />
                ))}

                {/* Ligne de temps actuelle */}
                <CurrentTimeLine day={day} />

                {/* Événements pour ce jour */}
                {(() => {
                  const dayEvents = getEventsForDate(day);
                  const layoutInfo = getEventLayoutInfo(dayEvents);
                  
                  return layoutInfo.map((info) => {
                    const { event, column, totalColumns, hasConflict } = info;
                    const eventStyle = getEventStyle(event);
                    
                    // Calculer la largeur et la position horizontale pour les événements en conflit
                    const widthPercentage = event.allDay ? 100 : (95 );
                    const leftPercentage = event.allDay ? 0 : (2 + column * (30 / totalColumns));

                    return (
                      <div
                        key={event.id}
                        className={`absolute p-1 rounded text-xs cursor-pointer overflow-hidden transition-all duration-200 ${
                          event.allDay
                            ? "text-white border-2 border-white border-opacity-30"
                            : "text-white"
                        } ${
                          hasConflict && !event.allDay
                            ? "ring-2 ring-white ring-opacity-50 shadow-lg z-20"
                            : "z-10"
                        }`}
                        style={{
                          top: eventStyle.top,
                          height: eventStyle.height,
                          left: `${leftPercentage}%`,
                          width: `${widthPercentage - leftPercentage}%`,
                          backgroundColor: event.allDay
                            ? `${event.color || "#3B82F6"}40` // Transparence pour les événements journée entière
                            : event.color || "#3B82F6",
                          minHeight: "20px",
                          opacity: hasConflict && !event.allDay ? 0.95 : 1,
                         
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick?.(event);
                        }}
                      >
                        <div className="truncate font-medium text-xs">
                          {event.title}
                          {event.allDay && (
                            <span className="ml-1 opacity-75">
                              (Journée entière)
                            </span>
                          )}
                        </div>
                        {!event.allDay && (
                          <div className="truncate opacity-90 text-xs">
                            {event.startTime} - {event.endTime}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
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
                <div className="absolute -top-2  right-2 text-xs text-gray-500">
                  {`${hour.toString().padStart(2, "0")}:00`}
                </div>
              </div>
            ))}
          </div>

          {/* Day column */}
          <div className="flex-1 relative">
            {/* Heures */}
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
              />
            ))}

            {/* Ligne de temps actuelle */}
            <CurrentTimeLine day={currentDate} />

            {/* Événements positionnés absolument */}
            {(() => {
              const layoutInfo = getEventLayoutInfo(dayEvents);
              
              return layoutInfo.map((info) => {
                const { event, column, totalColumns, hasConflict } = info;
                const eventStyle = getEventStyle(event);
                
                // Calculer la largeur et la position horizontale pour les événements en conflit
                const leftOffset = event.allDay ? 20 : ((column + 10 * (totalColumns))); 
                const rightOffset = event.allDay ? 20 : (8 + ((totalColumns - column - 1) * (20 / totalColumns)));

                return (
                  <div
                    key={event.id}
                    className={`absolute p-2 rounded cursor-pointer overflow-hidden transition-all duration-200 ${
                      event.allDay
                        ? "text-white border-2 border-white border-opacity-30"
                        : "text-white"
                    } ${
                      hasConflict && !event.allDay
                        ? "ring-2 ring-white ring-opacity-50 shadow-lg z-20"
                        : "z-10"
                    }`}
                    style={{
                      top: eventStyle.top,
                      height: eventStyle.height,
                      left: event.allDay ? "8px" : `${leftOffset}%`,
                      right: event.allDay ? "8px" : `${rightOffset}%`,
                      backgroundColor: event.allDay
                        ? `${event.color || "#3B82F6"}40` // Transparence pour les événements journée entière
                        : event.color || "#3B82F6",
                      minHeight: "20px",
                      opacity: hasConflict && !event.allDay ? 0.95 : 1,
                     
                      
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEventClick?.(event);
                    }}
                  >
                    <div className="font-medium text-sm">
                      {event.title}
                      {event.allDay && (
                        <span className="ml-1 opacity-75">(Journée entière)</span>
                      )}
                    </div>
                    {!event.allDay && (
                      <div className="text-xs opacity-90">
                        {event.startTime} - {event.endTime}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
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

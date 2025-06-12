"use client";

import { Skeleton } from "@/shared/components/ui/skeleton";
import { useEffect } from "react";
import { useScheduleStore } from "../store/scheduleStore";
import { EventDialog } from "./EventDialog";
import { ScheduleCalendar } from "./ScheduleCalendar";

export function ScheduleManager() {
  const {
    isDialogOpen,
    closeDialog,
    saveEvent,
    deleteSchedule,
    selectedEvent,
    dialogInitialDate,
    dialogInitialTime,
    loadSchedules,
    isLoading,
  } = useScheduleStore();

  // Charger les planifications au montage du composant
  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  // Composant skeleton pour le calendrier
  const CalendarSkeleton = () => (
    <div className="p-4 space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>
      
      {/* Calendar grid skeleton */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-8 w-full" />
        ))}
        
        {/* Calendar days - 6 weeks */}
        {Array.from({ length: 42 }).map((_, i) => (
          <div key={`day-${i}`} className="aspect-square p-1">
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Skeleton de chargement */}
      {isLoading && (
        <div className="flex-1 overflow-hidden">
          <CalendarSkeleton />
        </div>
      )}
      {!isLoading && (
        <div className="flex-1 overflow-hidden">
          <ScheduleCalendar />
        </div>
      )}

      <EventDialog
        isOpen={isDialogOpen}
        onClose={closeDialog}
        onSave={saveEvent}
        onDelete={deleteSchedule}
        event={selectedEvent}
        initialDate={dialogInitialDate}
        initialTime={dialogInitialTime}
      />
    </div>
  );
}

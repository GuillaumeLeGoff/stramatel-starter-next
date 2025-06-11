"use client";

import React, { useEffect } from "react";
import { ScheduleCalendar } from "./ScheduleCalendar";
import { EventDialog } from "./EventDialog";
import { useScheduleStore } from "../store/scheduleStore";
import { Skeleton } from "@/shared/components/ui/skeleton";

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
    error,
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

      {/* Indicateur d'erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 m-4">
          <p className="text-red-800 text-sm font-medium">
            Erreur lors du chargement
          </p>
          <p className="text-red-700 text-sm mt-1">{error}</p>
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

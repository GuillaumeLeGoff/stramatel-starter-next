"use client";

import React, { useEffect } from "react";
import { ScheduleCalendar } from "./ScheduleCalendar";
import { EventDialog } from "./EventDialog";
import { useScheduleStore } from "../store/scheduleStore";

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

  return (
    <div className="h-full flex flex-col">
      {/* Indicateur de chargement */}
      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 m-4">
          <p className="text-blue-800 text-sm">
            Chargement des planifications...
          </p>
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

      <div className="flex-1 overflow-hidden">
        <ScheduleCalendar />
      </div>

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

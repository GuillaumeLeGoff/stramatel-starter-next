"use client";

import React from "react";
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
  } = useScheduleStore();

  return (
    <div className="h-full flex flex-col">
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

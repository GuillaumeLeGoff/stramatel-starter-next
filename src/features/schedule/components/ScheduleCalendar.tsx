"use client";

import React, { useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import {
  Calendar,
  CalendarCurrentDate,
  CalendarDayView,
  CalendarMonthView,
  CalendarWeekView,
  CalendarYearView,
  CalendarViewTrigger,
  type CalendarEvent,
} from '@/shared/components/ui/full-calendar';
import {
  Plus,
} from 'lucide-react';
import { useScheduleStore } from '../store/scheduleStore';
import { fr } from 'date-fns/locale';
import { ScrollArea } from '@/shared/components/ui/scroll-area';

interface ScheduleCalendarProps {
  onCreateSchedule?: () => void;
}

// Composant principal du calendrier
export function ScheduleCalendar({ onCreateSchedule }: ScheduleCalendarProps) {
  const { 
    error, 
    fetchSchedules, 
    getCalendarEvents,
    clearError 
  } = useScheduleStore();

  // Charger les schedules au montage
  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // Convertir les schedules en événements de calendrier
  const calendarEvents = getCalendarEvents();

  const handleEventClick = (event: CalendarEvent) => {
    // Pour l'instant, on peut juste log l'événement
    console.log('Événement sélectionné:', event);
  };

  return (
    <div className="h-full max-h-screen overflow-hidden">
      {/* Messages d'erreur */}
      {error && (
        <Card className="border-destructive mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="ghost" size="sm" onClick={clearError}>
                ×
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendrier */}
      <Card className="h-full ">
        <CardContent className="p-0 h-full">
          <Calendar
            events={calendarEvents}
            onEventClick={handleEventClick}
            locale={fr}
            enableHotkeys={true}
          >
            <div className="p-4 border-b flex-shrink-0">
              <div className="flex items-center justify-between">
                <CalendarCurrentDate />

                <div className="flex items-center gap-2">
                  <CalendarViewTrigger view="day">Jour</CalendarViewTrigger>
                  <CalendarViewTrigger view="week">Semaine</CalendarViewTrigger>
                  <CalendarViewTrigger view="month">Mois</CalendarViewTrigger>
                  <CalendarViewTrigger view="year">Année</CalendarViewTrigger>

                  <div className="h-4 w-px bg-border mx-2" />

                  <Button onClick={onCreateSchedule} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau
                  </Button>
                </div>
              </div>
            </div>
            <ScrollArea className="h-full ">
            
                <CalendarDayView />
                <CalendarWeekView />
                <CalendarMonthView />
                <CalendarYearView />
              
            </ScrollArea>
          </Calendar>
        </CardContent>
      </Card>
    </div>
  );
} 
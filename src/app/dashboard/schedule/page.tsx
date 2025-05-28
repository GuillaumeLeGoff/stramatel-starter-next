"use client";

import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Calendar, Plus, Settings, Filter } from 'lucide-react';
import { ScheduleCalendar, ScheduleForm, useScheduleStore } from '@/features/schedule';
import type { Schedule, CreateScheduleData, UpdateScheduleData } from '@/features/schedule';

export default function SchedulePage() {
  const { createSchedule, updateSchedule, loading } = useScheduleStore();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  const handleCreateSchedule = () => {
    setEditingSchedule(null);
    setShowCreateDialog(true);
  };

  const handleEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setShowCreateDialog(true);
  };

  const handleSubmitSchedule = async (data: CreateScheduleData | UpdateScheduleData) => {
    try {
      if (editingSchedule) {
        await updateSchedule(data as UpdateScheduleData);
      } else {
        await createSchedule(data as CreateScheduleData);
      }
      setShowCreateDialog(false);
      setEditingSchedule(null);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleCancelForm = () => {
    setShowCreateDialog(false);
    setEditingSchedule(null);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planification</h1>
          <p className="text-muted-foreground">
            Gérez la planification automatique de vos slideshows
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtres
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Paramètres
          </Button>
          <Button onClick={handleCreateSchedule}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle planification
          </Button>
        </div>
      </div>

      {/* Calendrier principal */}
      <ScheduleCalendar
        onCreateSchedule={handleCreateSchedule}
        onEditSchedule={handleEditSchedule}
      />

      {/* Dialog de création/modification */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {editingSchedule ? 'Modifier la planification' : 'Nouvelle planification'}
            </DialogTitle>
            <DialogDescription>
              {editingSchedule 
                ? 'Modifiez les détails de cette planification'
                : 'Créez une nouvelle planification pour automatiser l\'affichage de vos slideshows'
              }
            </DialogDescription>
          </DialogHeader>
          
          <ScheduleForm
            schedule={editingSchedule || undefined}
            onSubmit={handleSubmitSchedule}
            onCancel={handleCancelForm}
            loading={loading}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
} 
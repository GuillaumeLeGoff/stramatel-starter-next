"use client";

import { useState } from 'react';
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Calendar } from "@/shared/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useMonitoringStartDate } from "../hooks/useMonitoringStartDate";
import { useSecurityIndicators } from "../hooks/useSecurityIndicators";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { CalendarIcon, Save, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function MonitoringStartDateForm() {
  const { data, loading, error, updateMonitoringStartDate } = useMonitoringStartDate();
  const { updateIndicators } = useSecurityIndicators();
  const { user } = useAuth();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedHour, setSelectedHour] = useState<string>('09');
  const [selectedMinute, setSelectedMinute] = useState<string>('00');
  const [isUpdating, setIsUpdating] = useState(false);

  // Générer les options d'heures et minutes
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  const handleSubmit = async () => {
    if (!selectedDate) {
      toast.error('Veuillez sélectionner une date');
      return;
    }

    if (!user) {
      toast.error('Utilisateur non connecté');
      return;
    }

    try {
      setIsUpdating(true);
      
      // Créer la date complète avec l'heure sélectionnée
      const fullDate = new Date(selectedDate);
      fullDate.setHours(parseInt(selectedHour), parseInt(selectedMinute), 0, 0);
      
      // Mettre à jour la date de début de suivi
      await updateMonitoringStartDate(fullDate);
      
      // Mettre à jour les indicateurs pour refléter le changement
      await updateIndicators(user.id);
      
      toast.success('Date de début de suivi mise à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error('Erreur lors de la mise à jour de la date de début de suivi');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="text-sm text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 border border-destructive rounded-md">
        <AlertCircle className="h-5 w-5 text-destructive" />
        <span className="text-destructive">{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Date de début de suivi</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? (
                  format(selectedDate, "PPP", { locale: fr })
                ) : data?.monitoringStartDate ? (
                  format(data.monitoringStartDate, "PPP", { locale: fr })
                ) : (
                  <span>Sélectionner une date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate || data?.monitoringStartDate || undefined}
                onSelect={setSelectedDate}
                disabled={(date) =>
                  date > new Date() || date < new Date("1900-01-01")
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Heure</Label>
            <Select value={selectedHour} onValueChange={setSelectedHour}>
              <SelectTrigger>
                <Clock className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Heure" />
              </SelectTrigger>
              <SelectContent>
                {hours.map((hour) => (
                  <SelectItem key={hour} value={hour}>
                    {hour}h
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Minutes</Label>
            <Select value={selectedMinute} onValueChange={setSelectedMinute}>
              <SelectTrigger>
                <SelectValue placeholder="Minutes" />
              </SelectTrigger>
              <SelectContent>
                {minutes.filter((_, index) => index % 5 === 0).map((minute) => (
                  <SelectItem key={minute} value={minute}>
                    {minute}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Définissez la date et l'heure à partir desquelles le suivi des accidents a commencé. 
          Ces informations seront utilisées pour calculer les records et statistiques.
        </p>
      </div>
      
      {data?.monitoringStartDate && (
        <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
          <div className="font-medium mb-1">Date actuelle :</div>
          <div>
            {format(data.monitoringStartDate, "PPP à HH:mm", { locale: fr })}
          </div>
        </div>
      )}
      
      <Button 
        disabled={isUpdating}
        className="w-full"
        onClick={handleSubmit}
      >
        {isUpdating ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Mise à jour...
          </>
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            Mettre à jour
          </>
        )}
      </Button>
    </div>
  );
} 
"use client";

import { useState } from 'react';
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useMonitoringStartDate } from "../hooks/useMonitoringStartDate";
import { useSecurityIndicators } from "../hooks/useSecurityIndicators";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Calendar, Save, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export function MonitoringStartDateForm() {
  const { data, loading, error, updateMonitoringStartDate } = useMonitoringStartDate();
  const { updateIndicators } = useSecurityIndicators();
  const { user } = useAuth();
  
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Formater la date pour l'input HTML
  const formatDateForInput = (date: Date | null) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      
      // Mettre à jour la date de début de suivi
      await updateMonitoringStartDate(new Date(selectedDate));
      
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
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="monitoringStartDate">Date de début de suivi</Label>
        <Input
          id="monitoringStartDate"
          type="date"
          value={selectedDate || formatDateForInput(data?.monitoringStartDate)}
          onChange={(e) => setSelectedDate(e.target.value)}
          required
        />
        <p className="text-sm text-muted-foreground">
          Définissez la date à partir de laquelle le suivi des accidents a commencé. 
          Cette date sera utilisée pour calculer les records et statistiques.
        </p>
      </div>
      
      {data?.monitoringStartDate && (
        <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
          Date actuelle : {data.monitoringStartDate.toLocaleDateString('fr-FR')}
        </div>
      )}
      
      <Button 
        type="submit" 
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
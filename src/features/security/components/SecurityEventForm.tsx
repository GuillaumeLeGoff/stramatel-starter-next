"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { Calendar } from "@/shared/components/ui/calendar";
import { SecurityEventType, SecuritySeverity, SecurityEvent, CreateSecurityEventRequest } from "../types";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { cn } from "@/lib/utils";

interface SecurityEventFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateSecurityEventRequest & { createdBy: number }) => Promise<void>;
  event?: SecurityEvent | null;
  loading?: boolean;
}

export function SecurityEventForm({ 
  open, 
  onOpenChange, 
  onSubmit, 
  event,
  loading = false 
}: SecurityEventFormProps) {
  const { user } = useAuth();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    event ? new Date(event.date) : new Date()
  );
  const [selectedTime, setSelectedTime] = useState<string>(
    event ? format(new Date(event.date), 'HH:mm') : format(new Date(), 'HH:mm')
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<CreateSecurityEventRequest>({
    defaultValues: event ? {
      type: event.type,
      date: event.date.toISOString().slice(0, 16),
      description: event.description || '',
      location: event.location || '',
      severity: event.severity || undefined,
      withWorkStop: event.withWorkStop
    } : {
      type: SecurityEventType.ACCIDENT,
      date: new Date().toISOString().slice(0, 16),
      description: '',
      location: '',
      severity: SecuritySeverity.MEDIUM,
      withWorkStop: false
    }
  });

  const watchedType = watch("type");
  const watchedWithWorkStop = watch("withWorkStop");

  const handleFormSubmit = async (data: CreateSecurityEventRequest) => {
    if (!user || !selectedDate) return;
    
    setSubmitLoading(true);
    try {
      // Combiner la date sélectionnée avec l'heure
      const [hours, minutes] = selectedTime.split(':');
      const combinedDateTime = new Date(selectedDate);
      combinedDateTime.setHours(parseInt(hours), parseInt(minutes));
      
      await onSubmit({
        ...data,
        date: combinedDateTime.toISOString(),
        createdBy: user.id
      });
      reset();
      setSelectedDate(new Date());
      setSelectedTime(format(new Date(), 'HH:mm'));
      onOpenChange(false);
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
    } finally {
      setSubmitLoading(false);
    }
  };



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {event ? "Modifier l'événement" : "Nouvel événement de sécurité"}
          </DialogTitle>
          <DialogDescription>
            {event ? "Modifiez les informations de l'événement" : "Ajoutez un nouvel événement de sécurité"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Type d'événement */}
          <div className="space-y-2">
            <Label htmlFor="type">Type d'événement *</Label>
            <Select
              value={watchedType}
              onValueChange={(value) => setValue("type", value as SecurityEventType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un type" />
              </SelectTrigger>
                             <SelectContent>
                <SelectItem value="ACCIDENT">Accident</SelectItem>
                <SelectItem value="ACCIDENT_WITH_STOP">Accident avec arrêt</SelectItem>
                <SelectItem value="ACCIDENT_WITHOUT_STOP">Accident sans arrêt</SelectItem>
                <SelectItem value="MINOR_CARE">Soin bénin</SelectItem>
                <SelectItem value="NEAR_MISS">Presqu'accident</SelectItem>
                <SelectItem value="DANGEROUS_SITUATION">Situation dangereuse</SelectItem>
               </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "PPP", { locale: fr })
                  ) : (
                    <span>Sélectionner une date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {!selectedDate && (
              <p className="text-sm text-destructive">Date requise</p>
            )}
          </div>

          {/* Heure */}
          <div className="space-y-2">
            <Label htmlFor="time">Heure *</Label>
            <Input
              id="time"
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Décrivez l'événement..."
              {...register("description")}
              rows={3}
            />
          </div>

          {/* Lieu */}
          <div className="space-y-2">
            <Label htmlFor="location">Lieu</Label>
            <Input
              id="location"
              placeholder="Lieu de l'événement"
              {...register("location")}
            />
          </div>

          {/* Sévérité */}
          <div className="space-y-2">
            <Label htmlFor="severity">Sévérité</Label>
            <Select
              value={watch("severity") || ""}
              onValueChange={(value) => setValue("severity", value as SecuritySeverity)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez une sévérité" />
              </SelectTrigger>
                             <SelectContent>
                <SelectItem value="LOW">Faible</SelectItem>
                <SelectItem value="MEDIUM">Moyen</SelectItem>
                <SelectItem value="HIGH">Élevé</SelectItem>
                <SelectItem value="CRITICAL">Critique</SelectItem>
               </SelectContent>
            </Select>
          </div>

          {/* Arrêt de travail */}
          <div className="flex items-center space-x-2">
            <Switch
              id="withWorkStop"
              checked={watchedWithWorkStop}
              onCheckedChange={(checked) => setValue("withWorkStop", checked)}
            />
            <Label htmlFor="withWorkStop">Avec arrêt de travail</Label>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={submitLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={submitLoading || loading}>
              {submitLoading ? "Enregistrement..." : event ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 
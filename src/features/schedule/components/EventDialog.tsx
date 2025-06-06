"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Clock, Repeat } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Switch } from "@/shared/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { Calendar as CalendarComponent } from "@/shared/components/ui/calendar";
import {
  Schedule,
  SchedulePriority,
  ScheduleStatus,
  CreateScheduleData,
  RecurrenceType,
} from "../types";

interface EventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: CreateScheduleData) => void;
  event?: Schedule;
  initialDate?: Date;
  initialTime?: string;
}

const priorityColors = {
  [SchedulePriority.LOW]: "#6B7280",
  [SchedulePriority.NORMAL]: "#3B82F6",
  [SchedulePriority.HIGH]: "#F59E0B",
  [SchedulePriority.URGENT]: "#EF4444",
};

// Couleurs aléatoires pour les nouveaux événements
const randomColors = [
  "#EF4444", // Rouge
  "#F59E0B", // Orange
  "#10B981", // Vert
  "#3B82F6", // Bleu
  "#8B5CF6", // Violet
  "#EC4899", // Rose
  "#06B6D4", // Cyan
  "#84CC16", // Lime
  "#F97316", // Orange foncé
  "#6366F1", // Indigo
];

// Fonction pour générer une couleur aléatoire
const getRandomColor = () => {
  return randomColors[Math.floor(Math.random() * randomColors.length)];
};

export function EventDialog({
  isOpen,
  onClose,
  onSave,
  event,
  initialDate,
  initialTime,
}: EventDialogProps) {
  const [formData, setFormData] = useState<CreateScheduleData>({
    title: "",
    description: "",
    slideshowId: 1, // Default value
    startDate: initialDate || new Date(),
    endDate: undefined,
    startTime: initialTime || "09:00",
    endTime: "10:00",
    allDay: false,
    isRecurring: false,
    status: ScheduleStatus.ACTIVE,
    priority: SchedulePriority.NORMAL,
    color: getRandomColor(),
  });

  const [showCalendar, setShowCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);

  useEffect(() => {
    if (event) {
      const newFormData = {
        title: event.title,
        description: event.description || "",
        slideshowId: event.slideshowId,
        startDate: new Date(event.startDate),
        endDate: event.endDate ? new Date(event.endDate) : undefined,
        startTime: event.startTime,
        endTime: event.endTime || "",
        allDay: event.allDay,
        isRecurring: event.isRecurring,
        status: event.status,
        priority: event.priority,
        color: event.color || priorityColors[event.priority],
      };
      setFormData(newFormData);
    } else if (initialDate || initialTime) {
      setFormData((prev) => ({
        ...prev,
        startDate: initialDate || prev.startDate,
        startTime: initialTime || prev.startTime,
      }));
    }
  }, [event, initialDate, initialTime]);

  // Réinitialiser le formulaire quand le dialog se ferme
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        title: "",
        description: "",
        slideshowId: 1,
        startDate: new Date(),
        endDate: undefined,
        startTime: "09:00",
        endTime: "10:00",
        allDay: false,
        isRecurring: false,
        status: ScheduleStatus.ACTIVE,
        priority: SchedulePriority.NORMAL,
        color: getRandomColor(),
      });
    }
  }, [isOpen]);

  const handleSave = () => {
    if (!formData.title.trim()) return;

    // Si c'est un nouvel événement (pas d'event existant), on génère une nouvelle couleur aléatoire
    const eventData = {
      ...formData,
      color: event ? formData.color : getRandomColor(),
    };

    onSave(eventData);
    onClose();

    // Reset form avec une nouvelle couleur aléatoire
    setFormData({
      title: "",
      description: "",
      slideshowId: 1,
      startDate: new Date(),
      endDate: undefined,
      startTime: "09:00",
      endTime: "10:00",
      allDay: false,
      isRecurring: false,
      status: ScheduleStatus.ACTIVE,
      priority: SchedulePriority.NORMAL,
      color: getRandomColor(),
    });
  };

  const timeOptions = Array.from({ length: 24 * 2 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? "00" : "30";
    return `${hour.toString().padStart(2, "0")}:${minute}`;
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {event ? "Modifier l'événement" : "Créer un événement"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Titre */}
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Titre de l'événement"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Description de l'événement"
              rows={3}
            />
          </div>

          {/* Date et heure */}
          <div className="grid grid-cols-2 gap-4">
            {/* Date de début */}
            <div className="space-y-2">
              <Label>Date de début</Label>
              <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="mr-2 h-4 w-4" />
                    {format(formData.startDate, "dd/MM/yyyy", { locale: fr })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={formData.startDate}
                    onSelect={(date) => {
                      if (date) {
                        setFormData((prev) => ({ ...prev, startDate: date }));
                        setShowCalendar(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Date de fin */}
            <div className="space-y-2">
              <Label>Date de fin (optionnelle)</Label>
              <Popover open={showEndCalendar} onOpenChange={setShowEndCalendar}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="mr-2 h-4 w-4" />
                    {formData.endDate
                      ? format(formData.endDate, "dd/MM/yyyy", { locale: fr })
                      : "Sélectionner"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={formData.endDate}
                    onSelect={(date) => {
                      setFormData((prev) => ({ ...prev, endDate: date }));
                      setShowEndCalendar(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Toute la journée */}
          <div className="flex items-center space-x-2">
            <Switch
              id="allDay"
              checked={formData.allDay}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, allDay: checked }))
              }
            />
            <Label htmlFor="allDay">Toute la journée</Label>
          </div>

          {/* Heures */}
          {!formData.allDay && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Heure de début</Label>
                <Select
                  value={formData.startTime}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, startTime: value }))
                  }
                >
                  <SelectTrigger>
                    <Clock className="mr-2 h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Heure de fin</Label>
                <Select
                  value={formData.endTime}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, endTime: value }))
                  }
                >
                  <SelectTrigger>
                    <Clock className="mr-2 h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Récurrence */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="recurring"
                checked={formData.isRecurring}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isRecurring: checked }))
                }
              />
              <Label
                htmlFor="recurring"
                className="flex items-center space-x-1"
              >
                <Repeat className="h-4 w-4" />
                <span>Événement récurrent</span>
              </Label>
            </div>

            {formData.isRecurring && (
              <div className="space-y-2">
                <Label>Type de récurrence</Label>
                <Select
                  value={formData.recurrence?.type || RecurrenceType.WEEKLY}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      recurrence: {
                        type: value as RecurrenceType,
                        interval: 1,
                      },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={RecurrenceType.DAILY}>
                      Quotidien
                    </SelectItem>
                    <SelectItem value={RecurrenceType.WEEKLY}>
                      Hebdomadaire
                    </SelectItem>
                    <SelectItem value={RecurrenceType.MONTHLY}>
                      Mensuel
                    </SelectItem>
                    <SelectItem value={RecurrenceType.YEARLY}>
                      Annuel
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Statut */}
          <div className="space-y-2">
            <Label>Statut</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  status: value as ScheduleStatus,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ScheduleStatus.ACTIVE}>Actif</SelectItem>
                <SelectItem value={ScheduleStatus.INACTIVE}>Inactif</SelectItem>
                <SelectItem value={ScheduleStatus.COMPLETED}>
                  Terminé
                </SelectItem>
                <SelectItem value={ScheduleStatus.CANCELLED}>Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={!formData.title.trim()}>
            {event ? "Modifier" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

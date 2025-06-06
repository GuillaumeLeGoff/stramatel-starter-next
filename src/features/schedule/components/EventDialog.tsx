"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Clock, Repeat, Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
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
import { Schedule, CreateScheduleData, RecurrenceType } from "../types";

interface EventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: CreateScheduleData) => void;
  onDelete?: (eventId: number) => void;
  event?: Schedule;
  initialDate?: Date;
  initialTime?: string;
}

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
  onDelete,
  event,
  initialDate,
  initialTime,
}: EventDialogProps) {
  const [formData, setFormData] = useState<CreateScheduleData>({
    title: "",
    slideshowId: 1, // Default value
    startDate: initialDate || new Date(),
    endDate: undefined,
    startTime: initialTime || "09:00",
    endTime: "10:00",
    allDay: false,
    isRecurring: false,
    color: getRandomColor(),
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (event) {
      const newFormData = {
        title: event.title,
        slideshowId: event.slideshowId,
        startDate: new Date(event.startDate),
        endDate: event.endDate ? new Date(event.endDate) : undefined,
        startTime: event.startTime,
        endTime: event.endTime || "",
        allDay: event.allDay,
        isRecurring: event.isRecurring,
        color: event.color || getRandomColor(),
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
        slideshowId: 1,
        startDate: new Date(),
        endDate: undefined,
        startTime: "09:00",
        endTime: "10:00",
        allDay: false,
        isRecurring: false,
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
      slideshowId: 1,
      startDate: new Date(),
      endDate: undefined,
      startTime: "09:00",
      endTime: "10:00",
      allDay: false,
      isRecurring: false,
      color: getRandomColor(),
    });
  };

  const handleDelete = () => {
    if (event && onDelete) {
      setShowDeleteConfirm(true);
    }
  };

  const confirmDelete = () => {
    if (event && onDelete) {
      onDelete(event.id);
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const timeOptions = Array.from({ length: 24 * 2 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? "00" : "30";
    return `${hour.toString().padStart(2, "0")}:${minute}`;
  });

  return (
    <>
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

            {/* Date et heure */}
            <div className="grid grid-cols-2 gap-4">
              {/* Date de début */}
              <div className="space-y-2">
                <Label>Date de début</Label>
                <Popover modal={true}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      type="button"
                      onClick={() => {
                        console.log("Bouton date de début cliqué");
                      }}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {format(formData.startDate, "dd/MM/yyyy", { locale: fr })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0"
                    style={{ zIndex: 9999 }}
                    align="start"
                    side="bottom"
                    sideOffset={5}
                    avoidCollisions={true}
                  >
                    <CalendarComponent
                      mode="single"
                      selected={formData.startDate}
                      onSelect={(date) => {
                        if (date) {
                          console.log("Date de début sélectionnée:", date);
                          setFormData((prev) => ({ ...prev, startDate: date }));
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
                <Popover modal={true}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      type="button"
                      onClick={() => {
                        console.log("Bouton date de fin cliqué");
                      }}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {formData.endDate
                        ? format(formData.endDate, "dd/MM/yyyy", { locale: fr })
                        : "Sélectionner"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0"
                    style={{ zIndex: 9999 }}
                    align="start"
                    side="bottom"
                    sideOffset={5}
                    avoidCollisions={true}
                  >
                    <CalendarComponent
                      mode="single"
                      selected={formData.endDate}
                      onSelect={(date) => {
                        console.log("Date de fin sélectionnée:", date);
                        setFormData((prev) => ({ ...prev, endDate: date }));
                      }}
                      initialFocus
                      disabled={(date) =>
                        formData.startDate && date < formData.startDate
                      }
                    />
                  </PopoverContent>
                </Popover>
                {formData.endDate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, endDate: undefined }));
                    }}
                    className="mt-1"
                    type="button"
                  >
                    Supprimer la date de fin
                  </Button>
                )}
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
          </div>

          <DialogFooter className="flex justify-between">
            <div>
              {event && onDelete && (
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  type="button"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </Button>
              )}
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={!formData.title.trim()}>
                {event ? "Modifier" : "Créer"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Êtes-vous sûr de vouloir supprimer cet événement ?</p>
            <p className="text-sm text-gray-500 mt-2">
              Cette action est irréversible.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelDelete}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

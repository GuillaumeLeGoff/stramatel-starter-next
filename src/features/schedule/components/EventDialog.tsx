"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Calendar as CalendarComponent } from "@/shared/components/ui/calendar";
import { Switch } from "@/shared/components/ui/switch";
import { Calendar, Clock, Play, Trash2 } from "lucide-react";
import { Schedule, CreateScheduleData, RecurrenceType } from "../types";
import { useScheduleStore } from "../store/scheduleStore";
import { useSlideshowStore } from "@/features/slideshow/store/slideshowStore";
import { useSlideshow } from "@/features/slideshow/hooks/useSlideshow";

interface EventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: CreateScheduleData) => void;
  onDelete?: (eventId: number) => void;
  event?: Schedule;
  initialDate?: Date;
  initialTime?: string;
}

const getRandomColor = () => {
  const colors = [
    "#3B82F6",
    "#EF4444",
    "#10B981",
    "#F59E0B",
    "#8B5CF6",
    "#EC4899",
    "#6B7280",
    "#14B8A6",
    "#F97316",
    "#84CC16",
    "#06B6D4",
    "#8B5A2B",
    "#DC2626",
    "#059669",
    "#7C3AED",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const recurrenceOptions = [
  { value: "none", label: "Une seule fois" },
  { value: "daily", label: "Tous les jours" },
  { value: "weekly", label: "Toutes les semaines" },
  { value: "monthly", label: "Tous les mois" },
  { value: "yearly", label: "Tous les ans" },
  { value: "custom", label: "Récurrence personnalisée" },
];

export function EventDialog({
  isOpen,
  onClose,
  onSave,
  onDelete,
  event,
  initialDate,
  initialTime,
}: EventDialogProps) {
  const { slideshows } = useSlideshowStore();
  const { fetchSlideshows } = useSlideshow();
  const { schedules } = useScheduleStore();

  const [formData, setFormData] = useState<CreateScheduleData>({
    title: "",
    slideshowId: slideshows.length > 0 ? slideshows[0].id : 0,
    startDate: initialDate || new Date(),
    startTime: initialTime || "09:00",
    endTime: "10:00",
    allDay: false,
    isRecurring: false,
    color: getRandomColor(),
  });

  const [recurrenceType, setRecurrenceType] = useState<string>("none");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);

  // Fonctions utilitaires
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}`;
  };

  const getValidEndTimeOptions = () => {
    if (!formData.startTime) return [];
    const startMinutes = timeToMinutes(formData.startTime);
    return Array.from({ length: 48 }, (_, i) => i * 30)
      .filter((minutes) => minutes > startMinutes)
      .map((minutes) => minutesToTime(minutes));
  };

  const handleStartTimeChange = (value: string) => {
    setFormData((prev) => {
      const newData = { ...prev, startTime: value };

      // Vérifier si l'heure de fin est encore valide
      if (prev.endTime) {
        const startMinutes = timeToMinutes(value);
        const endMinutes = timeToMinutes(prev.endTime);

        if (endMinutes <= startMinutes) {
          // Ajuster l'heure de fin automatiquement
          newData.endTime = minutesToTime(startMinutes + 60);
        }
      }

      return newData;
    });
  };

  const checkTimeConflicts = (eventData: CreateScheduleData): string | null => {
    if (eventData.allDay) return null;

    const startMinutes = timeToMinutes(eventData.startTime);
    const endMinutes = eventData.endTime
      ? timeToMinutes(eventData.endTime)
      : startMinutes + 60;

    for (const schedule of schedules) {
      if (event && schedule.id === event.id) continue;

      const scheduleStart = timeToMinutes(schedule.startTime);
      const scheduleEnd = schedule.endTime
        ? timeToMinutes(schedule.endTime)
        : scheduleStart + 60;

      const isSameDate =
        format(new Date(schedule.startDate), "yyyy-MM-dd") ===
        format(eventData.startDate, "yyyy-MM-dd");

      if (isSameDate) {
        const hasOverlap =
          startMinutes < scheduleEnd && endMinutes > scheduleStart;

        if (hasOverlap) {
          return `Conflit détecté avec "${schedule.title}" (${
            schedule.startTime
          } - ${schedule.endTime || "fin non définie"})`;
        }
      }
    }

    return null;
  };

  // Charger les slideshows au montage du composant
  useEffect(() => {
    if (slideshows.length === 0) {
      fetchSlideshows();
    }
  }, [slideshows.length, fetchSlideshows]);

  useEffect(() => {
    if (event) {
      let eventEndTime = event.endTime || "";

      // Vérifier si l'heure de fin est valide (après l'heure de début)
      if (eventEndTime && event.startTime) {
        const startMinutes = timeToMinutes(event.startTime);
        const endMinutes = timeToMinutes(eventEndTime);

        if (endMinutes <= startMinutes) {
          // Si l'heure de fin n'est pas valide, l'ajuster
          eventEndTime = minutesToTime(startMinutes + 60); // Ajouter 1 heure par défaut
        }
      }

      // Trouver le slideshow correspondant pour récupérer le nom
      const relatedSlideshow = slideshows.find(
        (s) => s.id === event.slideshowId
      );

      const newFormData = {
        title: relatedSlideshow?.name || event.title,
        slideshowId: event.slideshowId,
        startDate: new Date(event.startDate),
        startTime: event.startTime,
        endTime: eventEndTime,
        allDay: event.allDay,
        isRecurring: event.isRecurring,
        color: event.color || getRandomColor(),
      };
      setFormData(newFormData);

      // Déterminer le type de récurrence
      if (event.isRecurring && event.recurrence) {
        if (
          event.recurrence.type === RecurrenceType.DAILY &&
          event.recurrence.interval === 1
        ) {
          setRecurrenceType("daily");
        } else if (
          event.recurrence.type === RecurrenceType.WEEKLY &&
          event.recurrence.interval === 1
        ) {
          setRecurrenceType("weekly");
        } else if (
          event.recurrence.type === RecurrenceType.MONTHLY &&
          event.recurrence.interval === 1
        ) {
          setRecurrenceType("monthly");
        } else if (
          event.recurrence.type === RecurrenceType.YEARLY &&
          event.recurrence.interval === 1
        ) {
          setRecurrenceType("yearly");
        } else {
          setRecurrenceType("custom");
        }
      } else {
        setRecurrenceType("none");
      }
    } else if (initialDate || initialTime) {
      setFormData((prev) => {
        const newStartTime = initialTime || prev.startTime;
        let newEndTime = prev.endTime;

        // Si on définit une nouvelle heure de début, vérifier l'heure de fin
        if (initialTime && prev.endTime) {
          const startMinutes = timeToMinutes(newStartTime);
          const endMinutes = timeToMinutes(prev.endTime);

          if (endMinutes <= startMinutes) {
            newEndTime = minutesToTime(startMinutes + 60);
          }
        }

        return {
          ...prev,
          startDate: initialDate || prev.startDate,
          startTime: newStartTime,
          endTime: newEndTime,
        };
      });
    }
  }, [event, initialDate, initialTime, slideshows]);

  // Réinitialiser le formulaire quand le dialog se ferme
  useEffect(() => {
    if (!isOpen) {
      const defaultSlideshowId = slideshows.length > 0 ? slideshows[0].id : 0;
      const defaultTitle = slideshows.length > 0 ? slideshows[0].name : "";

      setFormData({
        title: defaultTitle,
        slideshowId: defaultSlideshowId,
        startDate: new Date(),
        startTime: "09:00",
        endTime: "10:00",
        allDay: false,
        isRecurring: false,
        color: getRandomColor(),
      });
      setRecurrenceType("none");
      setConflictError(null);
    }
  }, [isOpen, slideshows]);

  const handleRecurrenceChange = (value: string) => {
    setRecurrenceType(value);

    if (value === "none") {
      setFormData((prev) => ({
        ...prev,
        isRecurring: false,
        recurrence: undefined,
      }));
    } else if (value !== "custom") {
      // Types de récurrence prédéfinis
      const typeMap: Record<string, RecurrenceType> = {
        daily: RecurrenceType.DAILY,
        weekly: RecurrenceType.WEEKLY,
        monthly: RecurrenceType.MONTHLY,
        yearly: RecurrenceType.YEARLY,
      };

      setFormData((prev) => ({
        ...prev,
        isRecurring: true,
        recurrence: {
          type: typeMap[value],
          interval: 1,
        },
      }));
    } else {
      // Récurrence personnalisée
      setFormData((prev) => ({
        ...prev,
        isRecurring: true,
        recurrence: {
          type: RecurrenceType.WEEKLY,
          interval: 1,
        },
      }));
    }
  };

  const handleSave = async () => {
    if (!formData.slideshowId || formData.slideshowId === 0) {
      console.error("Aucun slideshow sélectionné");
      return;
    }

    // Si c'est un nouvel événement (pas d'event existant), on génère une nouvelle couleur aléatoire
    const eventData = {
      ...formData,
      color: event ? formData.color : getRandomColor(),
    };

    // Vérifier les conflits d'horaires
    const conflictMessage = checkTimeConflicts(eventData);
    if (conflictMessage) {
      setConflictError(conflictMessage);
      return;
    }

    // Effacer toute erreur de conflit précédente
    setConflictError(null);

    onSave(eventData);
    onClose();
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (onDelete && event) {
      onDelete(event.id);
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {event ? "Modifier l'événement" : "Nouvel événement"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Erreur de conflit */}
            {conflictError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-800 text-sm font-medium">
                  Conflit d'horaires détecté
                </p>
                <p className="text-red-700 text-sm mt-1">{conflictError}</p>
              </div>
            )}

            {/* Slideshow */}
            <div className="space-y-2">
              <Label htmlFor="slideshow">Slideshow *</Label>
              <Select
                value={formData.slideshowId.toString()}
                onValueChange={(value) => {
                  const slideshowId = parseInt(value);
                  const selectedSlideshow = slideshows.find(
                    (s) => s.id === slideshowId
                  );
                  setFormData((prev) => ({
                    ...prev,
                    slideshowId,
                    title: selectedSlideshow?.name || "",
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue>
                    {formData.slideshowId > 0 && (
                      <div className="flex items-center space-x-2">
                        <Play className="h-4 w-4 text-blue-600" />
                        <span>
                          {
                            slideshows.find(
                              (s) => s.id === formData.slideshowId
                            )?.name
                          }
                        </span>
                        {slideshows.find((s) => s.id === formData.slideshowId)
                          ?.description && (
                          <span className="text-sm text-gray-500">
                            -{" "}
                            {
                              slideshows.find(
                                (s) => s.id === formData.slideshowId
                              )?.description
                            }
                          </span>
                        )}
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {slideshows.map((slideshow) => (
                    <SelectItem
                      key={slideshow.id}
                      value={slideshow.id.toString()}
                    >
                      <div className="flex items-center space-x-2">
                        <Play className="h-4 w-4 text-blue-600" />
                        <span>{slideshow.name}</span>
                        {slideshow.description && (
                          <span className="text-sm text-gray-500">
                            - {slideshow.description}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label>Date *</Label>
              <Popover modal={true}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    type="button"
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
                        setFormData((prev) => ({ ...prev, startDate: date }));
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Journée entière */}
            <div className="flex items-center space-x-2">
              <Switch
                id="allDay"
                checked={formData.allDay}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, allDay: checked }))
                }
              />
              <Label htmlFor="allDay">Journée entière</Label>
            </div>

            {/* Heures */}
            {!formData.allDay && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Heure de début *</Label>
                  <Select
                    value={formData.startTime}
                    onValueChange={handleStartTimeChange}
                  >
                    <SelectTrigger>
                      <SelectValue>
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4" />
                          {formData.startTime}
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      {Array.from({ length: 48 }, (_, i) => {
                        const minutes = i * 30;
                        const time = minutesToTime(minutes);
                        return (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime">Heure de fin</Label>
                  <Select
                    value={formData.endTime || ""}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        endTime: value || undefined,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une heure">
                        {formData.endTime && (
                          <div className="flex items-center">
                            <Clock className="mr-2 h-4 w-4" />
                            {formData.endTime}
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      {getValidEndTimeOptions().map((time) => (
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
              <div className="space-y-2">
                <Label>Récurrence</Label>
                <Select
                  value={recurrenceType}
                  onValueChange={handleRecurrenceChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {recurrenceOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Configuration récurrence personnalisée */}
              {recurrenceType === "custom" && (
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={
                          formData.recurrence?.type || RecurrenceType.WEEKLY
                        }
                        onValueChange={(value: string) => {
                          setFormData((prev) => ({
                            ...prev,
                            recurrence: {
                              ...prev.recurrence,
                              type: value as RecurrenceType,
                              interval: prev.recurrence?.interval || 1,
                            },
                          }));
                        }}
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

                    <div className="space-y-2">
                      <Label>Intervalle</Label>
                      <Input
                        type="number"
                        min="1"
                        max="999"
                        value={formData.recurrence?.interval || 1}
                        onChange={(e) => {
                          const interval = parseInt(e.target.value) || 1;
                          setFormData((prev) => ({
                            ...prev,
                            recurrence: {
                              ...prev.recurrence,
                              type:
                                prev.recurrence?.type || RecurrenceType.WEEKLY,
                              interval,
                            },
                          }));
                        }}
                      />
                    </div>
                  </div>

                  {/* Jours de la semaine pour récurrence hebdomadaire */}
                  {formData.recurrence?.type === RecurrenceType.WEEKLY && (
                    <div className="space-y-2">
                      <Label>Jours de la semaine</Label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: 1, label: "Lun" },
                          { value: 2, label: "Mar" },
                          { value: 3, label: "Mer" },
                          { value: 4, label: "Jeu" },
                          { value: 5, label: "Ven" },
                          { value: 6, label: "Sam" },
                          { value: 0, label: "Dim" },
                        ].map((day) => (
                          <Button
                            key={day.value}
                            type="button"
                            variant={
                              formData.recurrence?.daysOfWeek?.includes(
                                day.value
                              )
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() => {
                              const currentDays =
                                formData.recurrence?.daysOfWeek || [];
                              const newDays = currentDays.includes(day.value)
                                ? currentDays.filter((d) => d !== day.value)
                                : [...currentDays, day.value];

                              setFormData((prev) => ({
                                ...prev,
                                recurrence: {
                                  ...prev.recurrence,
                                  type:
                                    prev.recurrence?.type ||
                                    RecurrenceType.WEEKLY,
                                  interval: prev.recurrence?.interval || 1,
                                  daysOfWeek: newDays,
                                },
                              }));
                            }}
                          >
                            {day.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fin de récurrence */}
                  <div className="space-y-2">
                    <Label>Fin de récurrence</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="never"
                          name="recurrenceEnd"
                          checked={
                            !formData.recurrence?.endDate &&
                            !formData.recurrence?.occurrences
                          }
                          onChange={() => {
                            setFormData((prev) => ({
                              ...prev,
                              recurrence: {
                                ...prev.recurrence,
                                type:
                                  prev.recurrence?.type ||
                                  RecurrenceType.WEEKLY,
                                interval: prev.recurrence?.interval || 1,
                                endDate: undefined,
                                occurrences: undefined,
                              },
                            }));
                          }}
                        />
                        <Label htmlFor="never">Jamais</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="endDate"
                          name="recurrenceEnd"
                          checked={!!formData.recurrence?.endDate}
                          onChange={() => {
                            setFormData((prev) => ({
                              ...prev,
                              recurrence: {
                                ...prev.recurrence,
                                type:
                                  prev.recurrence?.type ||
                                  RecurrenceType.WEEKLY,
                                interval: prev.recurrence?.interval || 1,
                                endDate: new Date(),
                                occurrences: undefined,
                              },
                            }));
                          }}
                        />
                        <Label htmlFor="endDate">Le</Label>
                        {formData.recurrence?.endDate && (
                          <Popover modal={true}>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm" type="button">
                                <Calendar className="mr-2 h-4 w-4" />
                                {format(
                                  formData.recurrence.endDate,
                                  "dd/MM/yyyy",
                                  { locale: fr }
                                )}
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
                                selected={formData.recurrence.endDate}
                                onSelect={(date: Date | undefined) => {
                                  if (date) {
                                    setFormData((prev) => ({
                                      ...prev,
                                      recurrence: {
                                        ...prev.recurrence,
                                        type:
                                          prev.recurrence?.type ||
                                          RecurrenceType.WEEKLY,
                                        interval:
                                          prev.recurrence?.interval || 1,
                                        endDate: date,
                                      },
                                    }));
                                  }
                                }}
                                initialFocus
                                disabled={(date) =>
                                  formData.startDate &&
                                  date < formData.startDate
                                }
                              />
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="occurrences"
                          name="recurrenceEnd"
                          checked={!!formData.recurrence?.occurrences}
                          onChange={() => {
                            setFormData((prev) => ({
                              ...prev,
                              recurrence: {
                                ...prev.recurrence,
                                type:
                                  prev.recurrence?.type ||
                                  RecurrenceType.WEEKLY,
                                interval: prev.recurrence?.interval || 1,
                                endDate: undefined,
                                occurrences: 10,
                              },
                            }));
                          }}
                        />
                        <Label htmlFor="occurrences">Après</Label>
                        {formData.recurrence?.occurrences && (
                          <>
                            <Input
                              type="number"
                              min="1"
                              max="999"
                              value={formData.recurrence.occurrences}
                              onChange={(e) => {
                                const occurrences =
                                  parseInt(e.target.value) || 1;
                                setFormData((prev) => ({
                                  ...prev,
                                  recurrence: {
                                    ...prev.recurrence,
                                    type:
                                      prev.recurrence?.type ||
                                      RecurrenceType.WEEKLY,
                                    interval: prev.recurrence?.interval || 1,
                                    occurrences,
                                  },
                                }));
                              }}
                              className="w-20"
                            />
                            <span className="text-sm text-gray-600">
                              occurrences
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
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
              <Button
                onClick={handleSave}
                disabled={!formData.slideshowId || formData.slideshowId === 0}
              >
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

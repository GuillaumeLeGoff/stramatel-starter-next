"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import { Switch } from '@/shared/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Calendar } from '@/shared/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover';
import { CalendarIcon, Clock, Repeat, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  Schedule, 
  CreateScheduleData, 
  UpdateScheduleData,
  ScheduleStatus,
  SchedulePriority,
  RecurrenceType 
} from '../types';
import { useScheduleStore } from '../store/scheduleStore';

// Schéma de validation
const scheduleSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  description: z.string().optional(),
  slideshowId: z.number().min(1, 'Veuillez sélectionner un slideshow'),
  startDate: z.date({
    required_error: 'La date de début est requise',
  }),
  endDate: z.date().optional(),
  startTime: z.string().min(1, 'L\'heure de début est requise'),
  endTime: z.string().optional(),
  allDay: z.boolean().default(false),
  isRecurring: z.boolean().default(false),
  status: z.enum(['ACTIVE', 'INACTIVE', 'COMPLETED', 'CANCELLED']),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
  color: z.string().optional(),
  // Récurrence
  recurrenceType: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).optional(),
  recurrenceInterval: z.number().min(1).optional(),
  recurrenceDaysOfWeek: z.array(z.number()).optional(),
  recurrenceEndDate: z.date().optional(),
  recurrenceOccurrences: z.number().min(1).optional(),
});

type ScheduleFormData = z.infer<typeof scheduleSchema>;

interface ScheduleFormProps {
  schedule?: Schedule;
  onSubmit: (data: CreateScheduleData | UpdateScheduleData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

// Hook pour récupérer les slideshows
const useSlideshows = () => {
  const [slideshows, setSlideshows] = useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSlideshows = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/slideshows');
        if (response.ok) {
          const data = await response.json();
          setSlideshows(data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des slideshows:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSlideshows();
  }, []);

  return { slideshows, loading };
};

export function ScheduleForm({ schedule, onSubmit, onCancel, loading }: ScheduleFormProps) {
  const { slideshows } = useSlideshows();
  const [showRecurrence, setShowRecurrence] = useState(schedule?.isRecurring || false);

  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      title: schedule?.title || '',
      description: schedule?.description || '',
      slideshowId: schedule?.slideshowId || 0,
      startDate: schedule ? new Date(schedule.startDate) : new Date(),
      endDate: schedule?.endDate ? new Date(schedule.endDate) : undefined,
      startTime: schedule?.startTime || '09:00',
      endTime: schedule?.endTime || '',
      allDay: schedule?.allDay || false,
      isRecurring: schedule?.isRecurring || false,
      status: schedule?.status || 'ACTIVE',
      priority: schedule?.priority || 'NORMAL',
      color: schedule?.color || '',
      recurrenceType: schedule?.recurrence?.type || 'DAILY',
      recurrenceInterval: schedule?.recurrence?.interval || 1,
      recurrenceEndDate: schedule?.recurrence?.endDate ? new Date(schedule.recurrence.endDate) : undefined,
      recurrenceOccurrences: schedule?.recurrence?.occurrences || undefined,
    },
  });

  const watchIsRecurring = form.watch('isRecurring');
  const watchAllDay = form.watch('allDay');

  useEffect(() => {
    setShowRecurrence(watchIsRecurring);
  }, [watchIsRecurring]);

  const handleSubmit = async (data: ScheduleFormData) => {
    try {
      const submitData: CreateScheduleData | UpdateScheduleData = {
        ...(schedule && { id: schedule.id }),
        title: data.title,
        description: data.description,
        slideshowId: data.slideshowId,
        startDate: data.startDate,
        endDate: data.endDate,
        startTime: data.allDay ? '00:00' : data.startTime,
        endTime: data.allDay ? '23:59' : data.endTime,
        allDay: data.allDay,
        isRecurring: data.isRecurring,
        status: data.status,
        priority: data.priority,
        color: data.color,
        ...(data.isRecurring && {
          recurrence: {
            type: data.recurrenceType!,
            interval: data.recurrenceInterval!,
            endDate: data.recurrenceEndDate,
            occurrences: data.recurrenceOccurrences,
            daysOfWeek: data.recurrenceDaysOfWeek ? JSON.stringify(data.recurrenceDaysOfWeek) : undefined,
          }
        }),
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Informations de base */}
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
            <CardDescription>
              Définissez les détails de base de votre planification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nom de la planification" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Description optionnelle"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slideshowId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slideshow *</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un slideshow" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {slideshows.map((slideshow) => (
                        <SelectItem key={slideshow.id} value={slideshow.id.toString()}>
                          {slideshow.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Actif</SelectItem>
                        <SelectItem value="INACTIVE">Inactif</SelectItem>
                        <SelectItem value="COMPLETED">Terminé</SelectItem>
                        <SelectItem value="CANCELLED">Annulé</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priorité</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="LOW">Basse</SelectItem>
                        <SelectItem value="NORMAL">Normale</SelectItem>
                        <SelectItem value="HIGH">Haute</SelectItem>
                        <SelectItem value="URGENT">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Planification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Planification
            </CardTitle>
            <CardDescription>
              Définissez quand cette planification doit être exécutée
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="allDay"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Toute la journée</FormLabel>
                    <FormDescription>
                      Cette planification s'exécute toute la journée
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date de début *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: fr })
                            ) : (
                              <span>Sélectionnez une date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date de fin</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: fr })
                            ) : (
                              <span>Optionnel</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {!watchAllDay && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Heure de début *</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Heure de fin</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Récurrence */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Repeat className="h-5 w-5" />
              Récurrence
            </CardTitle>
            <CardDescription>
              Configurez la répétition de cette planification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="isRecurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Planification récurrente</FormLabel>
                    <FormDescription>
                      Cette planification se répète automatiquement
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {showRecurrence && (
              <div className="space-y-4 pl-4 border-l-2 border-muted">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="recurrenceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type de récurrence</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="DAILY">Quotidienne</SelectItem>
                            <SelectItem value="WEEKLY">Hebdomadaire</SelectItem>
                            <SelectItem value="MONTHLY">Mensuelle</SelectItem>
                            <SelectItem value="YEARLY">Annuelle</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="recurrenceInterval"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Intervalle</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1"
                            placeholder="1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormDescription>
                          Répéter tous les X jours/semaines/mois/années
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="recurrenceEndDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Fin de récurrence</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: fr })
                                ) : (
                                  <span>Jamais</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="recurrenceOccurrences"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre d'occurrences</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1"
                            placeholder="Illimité"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormDescription>
                          Laisser vide pour une récurrence illimitée
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Enregistrement...' : schedule ? 'Modifier' : 'Créer'}
          </Button>
        </div>
      </form>
    </Form>
  );
} 
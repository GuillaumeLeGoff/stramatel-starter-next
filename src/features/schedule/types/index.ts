export interface Schedule {
  id: number;
  title: string;
  slideshowId: number;
  slideshow?: {
    id: number;
    name: string;
    description?: string;
  };
  createdBy: number;
  user?: {
    id: number;
    username: string;
  };

  // Dates et heures
  startDate: Date;
  endDate?: Date;
  startTime: string; // Format HH:mm
  endTime?: string; // Format HH:mm
  allDay: boolean;

  // Récurrence
  isRecurring: boolean;
  recurrence?: ScheduleRecurrence;

  color?: string;

  // Métadonnées
  createdAt: Date;
  updatedAt: Date;

  // Relations
  exceptions?: ScheduleException[];
}

export interface ScheduleRecurrence {
  id: number;
  scheduleId: number;

  // Type de récurrence
  type: RecurrenceType;
  interval: number;

  // Pour récurrence hebdomadaire
  daysOfWeek?: number[]; // [1,2,3,4,5] pour lun-ven

  // Pour récurrence mensuelle
  dayOfMonth?: number;
  weekOfMonth?: number;

  // Fin de récurrence
  endDate?: Date;
  occurrences?: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduleException {
  id: number;
  scheduleId: number;

  // Date de l'exception
  exceptionDate: Date;

  // Type d'exception
  type: ExceptionType;

  // Nouvelles valeurs si modifié
  newStartTime?: string;
  newEndTime?: string;
  newTitle?: string;

  createdAt: Date;
}

export enum RecurrenceType {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  YEARLY = "YEARLY",
}

export enum ExceptionType {
  CANCELLED = "CANCELLED",
  MODIFIED = "MODIFIED",
}

// Types pour les formulaires
export interface CreateScheduleData {
  title: string;
  slideshowId: number;
  startDate: Date;
  endDate?: Date;
  startTime: string;
  endTime?: string;
  allDay: boolean;
  isRecurring: boolean;
  recurrence?: Omit<
    ScheduleRecurrence,
    "id" | "scheduleId" | "createdAt" | "updatedAt"
  >;
  color?: string;
}

export interface UpdateScheduleData extends Partial<CreateScheduleData> {
  id: number;
}

// Types pour les filtres
export interface ScheduleFilters {
  slideshowIds?: number[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

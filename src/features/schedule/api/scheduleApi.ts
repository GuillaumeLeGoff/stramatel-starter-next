import { 
  Schedule, 
  CreateScheduleData, 
  UpdateScheduleData, 
  ScheduleFilters
} from "../types";

const API_BASE = "/api/schedules";

// Récupérer toutes les planifications
export async function fetchSchedules(filters?: ScheduleFilters): Promise<Schedule[]> {
  const params = new URLSearchParams();
  
  if (filters?.status?.length) {
    params.append('status', filters.status.join(','));
  }
  if (filters?.priority?.length) {
    params.append('priority', filters.priority.join(','));
  }
  if (filters?.slideshowIds?.length) {
    params.append('slideshowIds', filters.slideshowIds.join(','));
  }
  if (filters?.dateRange) {
    params.append('startDate', filters.dateRange.start.toISOString());
    params.append('endDate', filters.dateRange.end.toISOString());
  }

  const url = params.toString() ? `${API_BASE}?${params}` : API_BASE;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Erreur lors de la récupération des planifications: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.map((schedule: any) => ({
    ...schedule,
    startDate: new Date(schedule.startDate),
    endDate: schedule.endDate ? new Date(schedule.endDate) : undefined,
    createdAt: new Date(schedule.createdAt),
    updatedAt: new Date(schedule.updatedAt),
    recurrence: schedule.recurrence ? {
      ...schedule.recurrence,
      endDate: schedule.recurrence.endDate ? new Date(schedule.recurrence.endDate) : undefined,
      createdAt: new Date(schedule.recurrence.createdAt),
      updatedAt: new Date(schedule.recurrence.updatedAt),
    } : undefined,
    exceptions: schedule.exceptions?.map((exception: any) => ({
      ...exception,
      exceptionDate: new Date(exception.exceptionDate),
      createdAt: new Date(exception.createdAt),
    })) || [],
  }));
}

// Récupérer une planification par ID
export async function fetchScheduleById(id: number): Promise<Schedule> {
  const response = await fetch(`${API_BASE}/${id}`);
  
  if (!response.ok) {
    throw new Error(`Erreur lors de la récupération de la planification: ${response.statusText}`);
  }
  
  const schedule = await response.json();
  return {
    ...schedule,
    startDate: new Date(schedule.startDate),
    endDate: schedule.endDate ? new Date(schedule.endDate) : undefined,
    createdAt: new Date(schedule.createdAt),
    updatedAt: new Date(schedule.updatedAt),
    recurrence: schedule.recurrence ? {
      ...schedule.recurrence,
      endDate: schedule.recurrence.endDate ? new Date(schedule.recurrence.endDate) : undefined,
      createdAt: new Date(schedule.recurrence.createdAt),
      updatedAt: new Date(schedule.recurrence.updatedAt),
    } : undefined,
    exceptions: schedule.exceptions?.map((exception: any) => ({
      ...exception,
      exceptionDate: new Date(exception.exceptionDate),
      createdAt: new Date(exception.createdAt),
    })) || [],
  };
}

// Créer une nouvelle planification
export async function createSchedule(data: CreateScheduleData): Promise<Schedule> {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...data,
      startDate: data.startDate.toISOString(),
      endDate: data.endDate?.toISOString(),
      recurrence: data.recurrence ? {
        ...data.recurrence,
        endDate: data.recurrence.endDate?.toISOString(),
        daysOfWeek: data.recurrence.daysOfWeek ? JSON.stringify(data.recurrence.daysOfWeek) : undefined,
      } : undefined,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Erreur lors de la création de la planification");
  }

  const schedule = await response.json();
  return {
    ...schedule,
    startDate: new Date(schedule.startDate),
    endDate: schedule.endDate ? new Date(schedule.endDate) : undefined,
    createdAt: new Date(schedule.createdAt),
    updatedAt: new Date(schedule.updatedAt),
  };
}

// Mettre à jour une planification
export async function updateSchedule(data: UpdateScheduleData): Promise<Schedule> {
  const { id, ...updateData } = data;
  
  const response = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...updateData,
      startDate: updateData.startDate?.toISOString(),
      endDate: updateData.endDate?.toISOString(),
      recurrence: updateData.recurrence ? {
        ...updateData.recurrence,
        endDate: updateData.recurrence.endDate?.toISOString(),
        daysOfWeek: updateData.recurrence.daysOfWeek ? JSON.stringify(updateData.recurrence.daysOfWeek) : undefined,
      } : undefined,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Erreur lors de la mise à jour de la planification");
  }

  const schedule = await response.json();
  return {
    ...schedule,
    startDate: new Date(schedule.startDate),
    endDate: schedule.endDate ? new Date(schedule.endDate) : undefined,
    createdAt: new Date(schedule.createdAt),
    updatedAt: new Date(schedule.updatedAt),
  };
}

// Supprimer une planification
export async function deleteSchedule(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Erreur lors de la suppression de la planification");
  }
}

// Récupérer tous les slideshows pour les sélecteurs
export async function fetchSlideshows(): Promise<Array<{ id: number; name: string; description?: string }>> {
  const response = await fetch("/api/slideshows");
  
  if (!response.ok) {
    throw new Error(`Erreur lors de la récupération des slideshows: ${response.statusText}`);
  }
  
  return response.json();
} 
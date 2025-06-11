import {
  CreateScheduleData,
  Schedule
} from "../types";

const API_BASE = "/api/schedules";

// Récupérer tous les schedules
export async function fetchAllSchedules(): Promise<Schedule[]> {
  const response = await fetch(API_BASE);

  if (!response.ok) {
    throw new Error(
      `Erreur lors de la récupération des schedules: ${response.status}`
    );
  }

  return response.json();
}

// Récupérer un schedule par ID
export async function fetchScheduleById(id: number): Promise<Schedule> {
  const response = await fetch(`${API_BASE}/${id}`);

  if (!response.ok) {
    throw new Error(
      `Erreur lors de la récupération du schedule ${id}: ${response.status}`
    );
  }

  return response.json();
}

// Créer un nouveau schedule
export async function createSchedule(
  scheduleData: CreateScheduleData
): Promise<Schedule> {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(scheduleData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message ||
        `Erreur lors de la création du schedule: ${response.status}`
    );
  }

  return response.json();
}

// Mettre à jour un schedule
export async function updateSchedule(
  id: number,
  scheduleData: Partial<CreateScheduleData>
): Promise<Schedule> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(scheduleData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message ||
        `Erreur lors de la mise à jour du schedule: ${response.status}`
    );
  }

  return response.json();
}

// Supprimer un schedule
export async function deleteSchedule(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message ||
        `Erreur lors de la suppression du schedule: ${response.status}`
    );
  }
}

// Récupérer les schedules avec filtres
export async function fetchSchedulesByFilters(filters: {
  slideshowId?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
}): Promise<Schedule[]> {
  const searchParams = new URLSearchParams();

  if (filters.slideshowId) {
    searchParams.append("slideshowId", filters.slideshowId.toString());
  }
  if (filters.startDate) {
    searchParams.append("startDate", filters.startDate);
  }
  if (filters.endDate) {
    searchParams.append("endDate", filters.endDate);
  }
  if (filters.search) {
    searchParams.append("search", filters.search);
  }

  const url = searchParams.toString()
    ? `${API_BASE}?${searchParams}`
    : API_BASE;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Erreur lors de la récupération des schedules filtrés: ${response.status}`
    );
  }

  return response.json();
}

// Récupérer tous les slideshows pour les sélecteurs
export async function fetchSlideshows(): Promise<
  Array<{ id: number; name: string; description?: string }>
> {
  const response = await fetch("/api/slideshows");

  if (!response.ok) {
    throw new Error(
      `Erreur lors de la récupération des slideshows: ${response.statusText}`
    );
  }

  return response.json();
}

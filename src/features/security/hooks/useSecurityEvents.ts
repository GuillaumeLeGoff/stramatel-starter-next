
"use client";

import { useState, useEffect, useCallback } from 'react';
import { SecurityApi } from '../api/securityApi';
import { SecurityEvent, SecurityEventFilters, CreateSecurityEventRequest } from '../types';

export function useSecurityEvents(initialFilters?: SecurityEventFilters) {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les événements
  const loadEvents = useCallback(async (filters?: SecurityEventFilters) => {
    try {
      setLoading(true);
      setError(null);
      const data = await SecurityApi.getSecurityEvents(filters);
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  // Créer un nouvel événement
  const createEvent = useCallback(async (eventData: CreateSecurityEventRequest & { createdBy: number }) => {
    try {
      setLoading(true);
      setError(null);
      const newEvent = await SecurityApi.createSecurityEvent(eventData);
      setEvents(prev => [newEvent, ...prev]);
      return newEvent;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Modifier un événement
  const updateEvent = useCallback(async (id: number, updates: Partial<CreateSecurityEventRequest>) => {
    try {
      setLoading(true);
      setError(null);
      const updatedEvent = await SecurityApi.updateSecurityEvent(id, updates);
      setEvents(prev => prev.map(event => event.id === id ? updatedEvent : event));
      return updatedEvent;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la modification');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Supprimer un événement
  const deleteEvent = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      await SecurityApi.deleteSecurityEvent(id);
      setEvents(prev => prev.filter(event => event.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger au montée du composant
  useEffect(() => {
    loadEvents(initialFilters);
  }, [loadEvents, initialFilters]);

  return {
    events,
    loading,
    error,
    loadEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    refresh: () => loadEvents(initialFilters)
  };
} 
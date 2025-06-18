"use client";

import { useState, useEffect, useCallback } from 'react';
import { SecurityApi } from '../api/securityApi';
import { DigitalDisplayData } from '../types';

export function useSecurityIndicators(refreshInterval?: number) {
  const [indicators, setIndicators] = useState<DigitalDisplayData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les indicateurs
  const loadIndicators = useCallback(async (days?: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await SecurityApi.getDigitalIndicators(days);
      setIndicators(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des indicateurs');
    } finally {
      setLoading(false);
    }
  }, []);

  // Forcer la mise à jour des indicateurs
  const updateIndicators = useCallback(async (userId: number) => {
    try {
      setLoading(true);
      setError(null);
      await SecurityApi.updateIndicators(userId);
      await loadIndicators();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  }, [loadIndicators]);

  // Obtenir un résumé rapide
  const getQuickSummary = useCallback(async () => {
    try {
      return await SecurityApi.getQuickSummary();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la récupération du résumé');
      return null;
    }
  }, []);

  // Charger au montage
  useEffect(() => {
    loadIndicators();
  }, [loadIndicators]);

  // Actualisation automatique si demandée
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(() => {
        loadIndicators();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [refreshInterval, loadIndicators]);

  return {
    indicators,
    loading,
    error,
    loadIndicators,
    updateIndicators,
    getQuickSummary,
    refresh: loadIndicators
  };
} 
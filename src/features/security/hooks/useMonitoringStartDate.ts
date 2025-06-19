import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface MonitoringStartDateData {
  monitoringStartDate: Date | null;
}

export function useMonitoringStartDate() {
  const [data, setData] = useState<MonitoringStartDateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchMonitoringStartDate = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/security/monitoring-start-date');
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération de la date de début de suivi');
      }
      
      const result = await response.json();
      setData({
        monitoringStartDate: result.monitoringStartDate ? new Date(result.monitoringStartDate) : null
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const updateMonitoringStartDate = async (monitoringStartDate: Date) => {
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/security/monitoring-start-date', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          monitoringStartDate: monitoringStartDate.toISOString(),
          updatedBy: user.id
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour de la date de début de suivi');
      }

      const result = await response.json();
      setData({
        monitoringStartDate: new Date(result.monitoringStartDate)
      });

      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringStartDate();
  }, []);

  return {
    data,
    loading,
    error,
    updateMonitoringStartDate,
    refresh: fetchMonitoringStartDate
  };
} 
import { useState, useCallback } from 'react';
import { fetchClient } from '@/shared/api/fetch-client';

interface UseFetchOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export function useFetch<T>(
  url: string,
  options: RequestInit = {},
  fetchOptions: UseFetchOptions<T> = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (additionalOptions: RequestInit = {}) => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetchClient(url, {
          ...options,
          ...additionalOptions,
          headers: {
            ...options.headers,
            ...additionalOptions.headers,
          },
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Une erreur est survenue');
        }
        
        const result = await response.json();
        setData(result);
        fetchOptions.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Une erreur inconnue est survenue');
        setError(error);
        fetchOptions.onError?.(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [url, options, fetchOptions]
  );

  return { data, isLoading, error, execute };
} 
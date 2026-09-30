import { useState, useEffect, useCallback } from 'react';
import { WeatherAlert } from '../api/types';
import { api } from '../api/client';

export function useAlerts(region?: string, audience?: string) {
  const [data, setData] = useState<WeatherAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.alerts.get(region, audience);
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch weather alerts');
    } finally {
      setLoading(false);
    }
  }, [region, audience]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  return { data, loading, error, refetch: fetchAlerts };
}

import { useState, useEffect, useCallback } from 'react';
import { BlendResponse, LeadTimeHours, WeatherParameter } from '../api/types';
import { api } from '../api/client';

export function useBlend(
  region: string,
  lead: LeadTimeHours,
  param: WeatherParameter,
  overrideWeights?: Record<string, number> | null
) {
  const [data, setData] = useState<BlendResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBlend = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let res: BlendResponse;
      if (overrideWeights && Object.keys(overrideWeights).length > 0) {
        res = await api.weights.override(overrideWeights, region, lead, param);
      } else {
        res = await api.blend.get(region, lead, param);
      }
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch blend forecast');
    } finally {
      setLoading(false);
    }
  }, [region, lead, param, overrideWeights]);

  useEffect(() => {
    fetchBlend();
  }, [fetchBlend]);

  return { data, loading, error, refetch: fetchBlend };
}

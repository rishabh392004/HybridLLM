import { useState, useEffect, useCallback } from 'react';
import { SkillResponse, WeatherParameter } from '../api/types';
import { api } from '../api/client';

export function useSkill(region: string, param: WeatherParameter, days: number = 30) {
  const [data, setData] = useState<SkillResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSkill = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.skill.get(region, param, days);
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch skill verification metrics');
    } finally {
      setLoading(false);
    }
  }, [region, param, days]);

  useEffect(() => {
    fetchSkill();
  }, [fetchSkill]);

  return { data, loading, error, refetch: fetchSkill };
}

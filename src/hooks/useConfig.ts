import { useState, useEffect } from 'react';
import { getMiningRates, getDurationOptions } from '../constants/mining';

export const useConfig = () => {
  const [miningRates, setMiningRates] = useState<Record<number, { rate: number; hourlyReward: number }> | null>(null);
  const [durationOptions, setDurationOptions] = useState<Array<{ value: number; label: string }> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const [rates, options] = await Promise.all([
        getMiningRates(),
        getDurationOptions(),
      ]);
      setMiningRates(rates);
      setDurationOptions(options);
    } catch (error) {
      console.error('[useConfig] Failed to load config:', error);
    } finally {
      setLoading(false);
    }
  };

  return { miningRates, durationOptions, loading };
};

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { DailyMetric } from '@/lib/types';

export function useDailyMetrics() {
  return useQuery({
    queryKey: ['daily-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_metrics')
        .select('*')
        .order('date', { ascending: true });
      if (error) throw error;
      return data as DailyMetric[];
    },
    refetchInterval: 10 * 60 * 1000,
  });
}

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { OutreachMetric } from '@/lib/types';

export function useOutreachMetricsDaily() {
  return useQuery({
    queryKey: ['outreach-metrics-daily'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('outreach_metrics')
        .select('*')
        .eq('period_type', 'daily')
        .gte('period_start', thirtyDaysAgo.toISOString().split('T')[0])
        .order('period_start', { ascending: true });
      if (error) throw error;
      return data as OutreachMetric[];
    },
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useOutreachMetricsWeekly() {
  return useQuery({
    queryKey: ['outreach-metrics-weekly'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('outreach_metrics')
        .select('*')
        .eq('period_type', 'weekly')
        .order('period_start', { ascending: false })
        .limit(8);
      if (error) throw error;
      return data as OutreachMetric[];
    },
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useLatestOutreachMetric() {
  return useQuery({
    queryKey: ['outreach-metric-latest'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('outreach_metrics')
        .select('*')
        .eq('period_type', 'weekly')
        .order('period_end', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as OutreachMetric | null;
    },
    refetchInterval: 5 * 60 * 1000,
  });
}

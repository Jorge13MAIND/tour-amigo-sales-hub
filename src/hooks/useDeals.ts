import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Deal, PipelineKey } from '@/lib/types';
import { EXCLUDED_STAGES } from '@/lib/types';
import { useQueryClient } from '@tanstack/react-query';

export function useDeals(pipeline: PipelineKey) {
  return useQuery({
    queryKey: ['deals', pipeline],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('pipeline', pipeline)
        .not('deal_stage', 'in', `(${EXCLUDED_STAGES.join(',')})`)
        .order('risk_score', { ascending: false });
      if (error) throw error;
      return data as Deal[];
    },
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useDeal(dealId: number | null) {
  return useQuery({
    queryKey: ['deal', dealId],
    queryFn: async () => {
      if (!dealId) return null;
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('id', dealId)
        .single();
      if (error) throw error;
      return data as Deal;
    },
    enabled: !!dealId,
  });
}

export function useSyncStatus() {
  return useQuery({
    queryKey: ['sync-status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deals')
        .select('synced_at')
        .order('synced_at', { ascending: false })
        .limit(1)
        .single();
      if (error) throw error;
      return data?.synced_at as string | null;
    },
    refetchInterval: 60 * 1000,
  });
}

export function useRefreshAll() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries();
}

export function useAtRiskCount(pipeline: PipelineKey) {
  return useQuery({
    queryKey: ['at-risk-count', pipeline],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('deals')
        .select('*', { count: 'exact', head: true })
        .eq('pipeline', pipeline)
        .not('deal_stage', 'in', `(${EXCLUDED_STAGES.join(',')})`)
        .eq('status', 'at_risk');
      if (error) throw error;
      return count ?? 0;
    },
    refetchInterval: 5 * 60 * 1000,
  });
}

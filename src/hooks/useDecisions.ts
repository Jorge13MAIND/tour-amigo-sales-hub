import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Decision } from '@/lib/types';

export function useDecisions() {
  return useQuery({
    queryKey: ['decisions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('decisions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Decision[];
    },
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useDealDecisions(dealId: number | null) {
  return useQuery({
    queryKey: ['deal-decisions', dealId],
    queryFn: async () => {
      if (!dealId) return [];
      const { data, error } = await supabase
        .from('decisions')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Decision[];
    },
    enabled: !!dealId,
  });
}

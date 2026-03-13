import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { FollowUpPlan } from '@/lib/types';

export function useFollowUpPlans(filters?: {
  status?: string;
  planType?: string;
}) {
  return useQuery({
    queryKey: ['follow-up-plans', filters],
    queryFn: async () => {
      let query = supabase
        .from('follow_up_plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters?.planType && filters.planType !== 'all') {
        query = query.eq('plan_type', filters.planType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as FollowUpPlan[];
    },
    refetchInterval: 60_000,
  });
}

export function useActiveFollowUpCount() {
  return useQuery({
    queryKey: ['active-followup-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('follow_up_plans')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active');
      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 60_000,
  });
}

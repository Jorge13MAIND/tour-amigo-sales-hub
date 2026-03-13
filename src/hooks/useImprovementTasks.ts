import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Task } from '@/lib/types';

export function useImprovementTasks(filters?: {
  priority?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['improvement-tasks', filters],
    queryFn: async () => {
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('source', 'improvement_scan')
        .order('created_at', { ascending: false });

      if (filters?.priority && filters.priority !== 'all') {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Task[];
    },
    refetchInterval: 5 * 60_000,
  });
}

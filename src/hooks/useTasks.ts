import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Task } from '@/lib/types';

export function useTodaysTasks() {
  return useQuery({
    queryKey: ['tasks-today'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('tasks')
        .select('*, deals(deal_name)')
        .eq('due_date', today)
        .eq('status', 'pending')
        .order('priority', { ascending: true });
      if (error) throw error;
      return data as Task[];
    },
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useDealTasks(dealId: number | null) {
  return useQuery({
    queryKey: ['deal-tasks', dealId],
    queryFn: async () => {
      if (!dealId) return [];
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Task[];
    },
    enabled: !!dealId,
  });
}

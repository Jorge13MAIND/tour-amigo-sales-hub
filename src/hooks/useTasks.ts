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
        .eq('status', 'pending')
        .lte('due_date', today)
        .order('due_date', { ascending: true });
      if (error) throw error;
      return data as Task[];
    },
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useUpcomingTasks() {
  return useQuery({
    queryKey: ['tasks-upcoming'],
    queryFn: async () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const { data, error } = await supabase
        .from('tasks')
        .select('*, deals(deal_name)')
        .eq('status', 'pending')
        .gt('due_date', tomorrow.toISOString().split('T')[0])
        .lte('due_date', nextWeek.toISOString().split('T')[0])
        .order('due_date', { ascending: true });
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

export function useOverdueTaskCount() {
  return useQuery({
    queryKey: ['tasks-overdue-count'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { count, error } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .lt('due_date', today);
      if (error) throw error;
      return count ?? 0;
    },
    refetchInterval: 5 * 60 * 1000,
  });
}

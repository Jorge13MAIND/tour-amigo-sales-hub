import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Playbook } from '@/lib/types';

export function usePlaybooks() {
  return useQuery({
    queryKey: ['playbooks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('playbooks')
        .select('*')
        .order('times_used', { ascending: false });
      if (error) throw error;
      return data as Playbook[];
    },
    refetchInterval: 10 * 60_000,
  });
}

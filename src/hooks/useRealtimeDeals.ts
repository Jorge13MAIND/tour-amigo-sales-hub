import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function useRealtimeDeals() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('deals-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deals' }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ['deals'] });
        queryClient.invalidateQueries({ queryKey: ['at-risk-count'] });
        queryClient.invalidateQueries({ queryKey: ['sync-status'] });
        toast.info('Pipeline updated', { description: 'Deal data has been synced', duration: 3000 });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

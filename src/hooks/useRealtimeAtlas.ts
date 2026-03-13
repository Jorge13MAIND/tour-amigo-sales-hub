import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function useRealtimeAtlas() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const agentChannel = supabase
      .channel('agent-activity-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agent_activity' }, () => {
        queryClient.invalidateQueries({ queryKey: ['agent-activity'] });
        queryClient.invalidateQueries({ queryKey: ['agent-stats-today'] });
        queryClient.invalidateQueries({ queryKey: ['agent-health'] });
        queryClient.invalidateQueries({ queryKey: ['pending-approval-count'] });
        toast.info('Agent activity', { description: 'New agent action logged', duration: 3000 });
      })
      .subscribe();

    const followUpChannel = supabase
      .channel('follow-up-plans-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'follow_up_plans' }, () => {
        queryClient.invalidateQueries({ queryKey: ['follow-up-plans'] });
        queryClient.invalidateQueries({ queryKey: ['active-followup-count'] });
      })
      .subscribe();

    const playbooksChannel = supabase
      .channel('playbooks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'playbooks' }, () => {
        queryClient.invalidateQueries({ queryKey: ['playbooks'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(agentChannel);
      supabase.removeChannel(followUpChannel);
      supabase.removeChannel(playbooksChannel);
    };
  }, [queryClient]);
}

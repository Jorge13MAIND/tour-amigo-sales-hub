import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { AtlasNotification } from '@/lib/types';

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

    const outreachChannel = supabase
      .channel('outreach-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'outreach_contacts' }, () => {
        queryClient.invalidateQueries({ queryKey: ['outreach-contacts'] });
        queryClient.invalidateQueries({ queryKey: ['outreach-stats'] });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'atlas_notifications' }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
        const n = payload.new as AtlasNotification;
        toast.info(n.title, { description: n.body || undefined, duration: 5000 });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(agentChannel);
      supabase.removeChannel(followUpChannel);
      supabase.removeChannel(playbooksChannel);
      supabase.removeChannel(outreachChannel);
    };
  }, [queryClient]);
}

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { AtlasNotification, AgentActivity } from '@/lib/types';

export interface MorningBriefData {
  briefDate: string | null;
  header: AtlasNotification | null;
  actions: AtlasNotification[];
  dealAlerts: AtlasNotification[];
  infoItems: AtlasNotification[];
  agentScan: AgentActivity | null;
  allBriefNotifications: AtlasNotification[];
}

export function useMorningBrief() {
  return useQuery({
    queryKey: ['morning-brief'],
    queryFn: async (): Promise<MorningBriefData> => {
      // Get all morning-brief notifications from today (or latest batch)
      const { data: notifications, error: nErr } = await supabase
        .from('atlas_notifications')
        .select('*')
        .eq('agent_name', 'morning-brief')
        .order('created_at', { ascending: false })
        .limit(20);

      if (nErr) throw nErr;

      const items = (notifications || []) as AtlasNotification[];

      // Find the latest brief header to determine the date
      const header = items.find((n) => n.notification_type === 'morning_brief') || null;
      const briefDate = header?.metadata?.date as string | null || null;

      // If we have a brief date, filter to only that date's items
      // Otherwise just use the latest batch (same created_at window)
      let briefItems = items;
      if (header) {
        const headerTime = new Date(header.created_at).getTime();
        // Items within 5 minutes of the header
        briefItems = items.filter(
          (n) => Math.abs(new Date(n.created_at).getTime() - headerTime) < 5 * 60 * 1000
        );
      }

      const actions = briefItems
        .filter((n) => n.notification_type === 'action_required')
        .sort((a, b) => {
          const pa = (a.metadata?.priority_rank as number) || 99;
          const pb = (b.metadata?.priority_rank as number) || 99;
          return pa - pb;
        });

      const dealAlerts = briefItems.filter((n) => n.notification_type === 'deal_alert');
      const infoItems = briefItems.filter((n) => n.notification_type === 'info');

      // Get the agent scan log
      const { data: agentLogs } = await supabase
        .from('agent_activity')
        .select('*')
        .eq('agent_name', 'morning-brief')
        .order('created_at', { ascending: false })
        .limit(1);

      const agentScan = (agentLogs?.[0] as AgentActivity) || null;

      return {
        briefDate,
        header,
        actions,
        dealAlerts,
        infoItems,
        agentScan,
        allBriefNotifications: briefItems,
      };
    },
    refetchInterval: 60 * 1000, // 1 min
  });
}

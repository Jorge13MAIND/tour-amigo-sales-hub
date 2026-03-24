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
      // Get today's start in UTC
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

      // Get ALL morning-brief notifications from today
      const { data: notifications, error: nErr } = await supabase
        .from('atlas_notifications')
        .select('*')
        .eq('agent_name', 'morning-brief')
        .gte('created_at', todayStart)
        .order('created_at', { ascending: false })
        .limit(30);

      if (nErr) throw nErr;

      // If no today's data, fall back to latest 20
      let items = (notifications || []) as AtlasNotification[];
      if (items.length === 0) {
        const { data: fallback } = await supabase
          .from('atlas_notifications')
          .select('*')
          .eq('agent_name', 'morning-brief')
          .order('created_at', { ascending: false })
          .limit(20);
        items = (fallback || []) as AtlasNotification[];
      }

      // Find the latest brief header
      const header = items.find((n) => n.notification_type === 'morning_brief') || null;
      const briefDate = header?.metadata?.date as string | null || null;

      // Use ALL items from today — no time-window filter
      // Actions, alerts, and info are all grouped by notification_type
      const actions = items
        .filter((n) => n.notification_type === 'action_required')
        .sort((a, b) => {
          const pa = (a.metadata?.priority_rank as number) || 99;
          const pb = (b.metadata?.priority_rank as number) || 99;
          return pa - pb;
        });

      const dealAlerts = items.filter((n) => n.notification_type === 'deal_alert');
      const infoItems = items.filter((n) => n.notification_type === 'info');

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
        allBriefNotifications: items,
      };
    },
    refetchInterval: 60 * 1000,
  });
}

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { AgentActivity } from '@/lib/types';

export function useAgentActivity(filters?: {
  agentName?: string;
  result?: string;
  timeRange?: 'today' | '7d' | '30d' | 'all';
}) {
  return useQuery({
    queryKey: ['agent-activity', filters],
    queryFn: async () => {
      let query = supabase
        .from('agent_activity')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (filters?.agentName && filters.agentName !== 'all') {
        query = query.eq('agent_name', filters.agentName);
      }
      if (filters?.result && filters.result !== 'all') {
        query = query.eq('result', filters.result);
      }
      if (filters?.timeRange && filters.timeRange !== 'all') {
        const now = new Date();
        let since: Date;
        if (filters.timeRange === 'today') {
          since = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        } else if (filters.timeRange === '7d') {
          since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else {
          since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
        query = query.gte('created_at', since.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AgentActivity[];
    },
    refetchInterval: 60_000,
  });
}

export function useTodayAgentStats() {
  return useQuery({
    queryKey: ['agent-stats-today'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from('agent_activity')
        .select('id, result')
        .gte('created_at', today.toISOString());
      if (error) throw error;
      const rows = data || [];
      return {
        total: rows.length,
        autoExecuted: rows.filter((r) => r.result === 'auto_executed' || r.result === 'success').length,
        pendingApproval: rows.filter((r) => r.result === 'needs_approval').length,
      };
    },
    refetchInterval: 60_000,
  });
}

export function useAgentHealth() {
  return useQuery({
    queryKey: ['agent-health'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_agent_health');
      if (error) {
        // Fallback: query manually if RPC doesn't exist
        const { data: activities, error: err2 } = await supabase
          .from('agent_activity')
          .select('agent_name, created_at')
          .order('created_at', { ascending: false });
        if (err2) throw err2;
        const map: Record<string, string> = {};
        for (const a of activities || []) {
          if (!map[a.agent_name]) map[a.agent_name] = a.created_at;
        }
        return Object.entries(map).map(([agent_name, last_run]) => ({
          agent_name,
          last_run,
        }));
      }
      return data as { agent_name: string; last_run: string }[];
    },
    refetchInterval: 5 * 60_000,
  });
}

export function usePendingApprovalCount() {
  return useQuery({
    queryKey: ['pending-approval-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('agent_activity')
        .select('id', { count: 'exact', head: true })
        .eq('result', 'needs_approval');
      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30_000,
  });
}

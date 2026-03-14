import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { OutreachContact } from '@/lib/types';

export interface OutreachFilters {
  status?: string;
  tier?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export function useOutreachContacts(filters: OutreachFilters = {}) {
  const { status, tier, dateFrom, dateTo, page = 1, pageSize = 25 } = filters;
  return useQuery({
    queryKey: ['outreach-contacts', filters],
    queryFn: async () => {
      let query = supabase
        .from('outreach_contacts')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (status && status !== 'all') query = query.eq('status', status);
      if (tier && tier !== 'all') query = query.eq('tier', tier);
      if (dateFrom) query = query.gte('created_at', dateFrom);
      if (dateTo) query = query.lte('created_at', dateTo);

      const from = (page - 1) * pageSize;
      query = query.range(from, from + pageSize - 1);

      const { data, error, count } = await query;
      if (error) throw error;
      return { contacts: data as OutreachContact[], total: count ?? 0 };
    },
    refetchInterval: 60 * 1000,
  });
}

export function useOutreachStats() {
  return useQuery({
    queryKey: ['outreach-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];

      // Today's counts
      const { data: todayData } = await supabase
        .from('outreach_contacts')
        .select('status')
        .gte('email_sent_at', today);

      const todaySent = todayData?.filter(c => c.status === 'enrolled').length ?? 0;

      // This week
      const { data: weekData } = await supabase
        .from('outreach_contacts')
        .select('status, reply_sentiment')
        .gte('email_sent_at', weekAgoStr);

      const weekSent = weekData?.length ?? 0;
      const weekReplies = weekData?.filter(c => c.status === 'replied').length ?? 0;
      const weekPositive = weekData?.filter(c => c.reply_sentiment === 'positive').length ?? 0;

      // Total by status
      const { data: allData } = await supabase
        .from('outreach_contacts')
        .select('status, tier');

      const totalByStatus: Record<string, number> = {};
      const totalByTier: Record<string, number> = {};
      (allData || []).forEach(c => {
        totalByStatus[c.status] = (totalByStatus[c.status] || 0) + 1;
        if (c.tier) totalByTier[c.tier] = (totalByTier[c.tier] || 0) + 1;
      });

      return {
        todaySent,
        weekSent,
        weekReplies,
        weekPositive,
        totalByStatus,
        totalByTier,
      };
    },
    refetchInterval: 60 * 1000,
  });
}

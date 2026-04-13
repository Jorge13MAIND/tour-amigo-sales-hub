import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { OutreachContact } from '@/lib/types';

export interface OutreachFilters {
  status?: string;
  tier?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'created_at' | 'engagement_score';
  warmOnly?: boolean;
}

export function useOutreachContacts(filters: OutreachFilters = {}) {
  const { status, tier, search, dateFrom, dateTo, page = 1, pageSize = 25, sortBy = 'created_at', warmOnly } = filters;
  return useQuery({
    queryKey: ['outreach-contacts', filters],
    queryFn: async () => {
      let query = supabase
        .from('outreach_contacts')
        .select('*', { count: 'exact' })
        .order(sortBy, { ascending: false });

      if (status && status !== 'all') query = query.eq('status', status);
      if (tier && tier !== 'all') query = query.eq('tier', tier);
      if (warmOnly) query = query.gte('engagement_score', 50);
      if (search && search.trim()) {
        const s = search.trim().toLowerCase();
        query = query.or(`first_name.ilike.%${s}%,last_name.ilike.%${s}%,company.ilike.%${s}%,email.ilike.%${s}%`);
      }
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

      // Total by status — all-time counts from outreach_contacts
      const { data: allData } = await supabase
        .from('outreach_contacts')
        .select('status, tier, reply_sentiment, engagement_score, open_count, click_count');

      const totalByStatus: Record<string, number> = {};
      const totalByTier: Record<string, number> = {};
      (allData || []).forEach(c => {
        totalByStatus[c.status] = (totalByStatus[c.status] || 0) + 1;
        if (c.tier) totalByTier[c.tier] = (totalByTier[c.tier] || 0) + 1;
      });

      // All-time totals calculated from actual contact records
      const totalSent = (allData || []).filter(c =>
        ['enrolled', 'replied', 'converted', 'bounced'].includes(c.status)
      ).length;
      const totalReplied = (allData || []).filter(c =>
        ['replied', 'converted'].includes(c.status)
      ).length;
      const totalPositive = (allData || []).filter(c =>
        c.reply_sentiment === 'positive' || c.status === 'converted'
      ).length;
      const totalBounced = totalByStatus['bounced'] ?? 0;
      const totalDelivered = totalSent - totalBounced;
      const replyRate = totalDelivered > 0 ? totalReplied / totalDelivered : 0;
      const positiveReplyRate = totalDelivered > 0 ? totalPositive / totalDelivered : 0;

      // Engagement stats
      const warmLeads = (allData || []).filter(c => (c as any).engagement_score >= 50).length;
      const contactsWithOpens = (allData || []).filter(c => (c as any).open_count > 0).length;
      const contactsWithClicks = (allData || []).filter(c => (c as any).click_count > 0).length;
      const scores = (allData || []).map(c => (c as any).engagement_score as number).filter(s => s > 0);
      const avgEngagement = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      const bounceRate = totalSent > 0 ? totalBounced / totalSent : 0;

      return {
        todaySent,
        weekSent,
        weekReplies,
        weekPositive,
        totalByStatus,
        totalByTier,
        totalSent,
        totalReplied,
        totalPositive,
        totalBounced,
        totalDelivered,
        replyRate,
        positiveReplyRate,
        warmLeads,
        contactsWithOpens,
        contactsWithClicks,
        avgEngagement,
        bounceRate,
      };
    },
    refetchInterval: 60 * 1000,
  });
}

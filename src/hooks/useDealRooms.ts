import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { DealRoom, DealStakeholder, DealRoomFeedItem, DealDocument, ChatMessage } from '@/lib/types';

export function useDealRooms(status?: string) {
  return useQuery({
    queryKey: ['deal-rooms', status],
    queryFn: async () => {
      let q = supabase.from('deal_rooms').select('*, deals(*)').order('target_close_date', { ascending: true });
      if (status && status !== 'all') q = q.eq('status', status);
      const { data, error } = await q;
      if (error) throw error;
      return data as DealRoom[];
    },
  });
}

export function useDealRoom(id: string | undefined) {
  return useQuery({
    queryKey: ['deal-room', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deal_rooms')
        .select('*, deals(*)')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as DealRoom;
    },
  });
}

export function useDealStakeholders(dealId: number | undefined) {
  return useQuery({
    queryKey: ['deal-stakeholders', dealId],
    enabled: !!dealId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deal_stakeholders')
        .select('*')
        .eq('deal_id', dealId!)
        .order('engagement_score', { ascending: false });
      if (error) throw error;
      return data as DealStakeholder[];
    },
  });
}

export function useDealRoomFeed(dealId: number | undefined) {
  return useQuery({
    queryKey: ['deal-room-feed', dealId],
    enabled: !!dealId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deal_room_feed')
        .select('*')
        .eq('deal_id', dealId!)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as DealRoomFeedItem[];
    },
  });
}

export function useDealDocuments(dealId: number | undefined) {
  return useQuery({
    queryKey: ['deal-documents', dealId],
    enabled: !!dealId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deal_documents')
        .select('*')
        .eq('deal_id', dealId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as DealDocument[];
    },
  });
}

export function useDealChatMessages(dealId: number | null, scope: 'deal' | 'global') {
  return useQuery({
    queryKey: ['chat-messages', dealId, scope],
    queryFn: async () => {
      let q = supabase
        .from('chat_messages')
        .select('*')
        .eq('scope', scope)
        .order('created_at', { ascending: true })
        .limit(20);
      if (scope === 'deal' && dealId) {
        q = q.eq('deal_id', dealId);
      } else {
        q = q.is('deal_id', null);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data as ChatMessage[];
    },
  });
}

// Counts for cards/widgets
export function useDealRoomCounts() {
  return useQuery({
    queryKey: ['deal-room-counts'],
    queryFn: async () => {
      const [rooms, feed, stakeholders] = await Promise.all([
        supabase.from('deal_rooms').select('id, room_type, status, risks, target_close_date, close_probability, deal_name', { count: 'exact' }).eq('status', 'active'),
        supabase.from('deal_room_feed').select('id', { count: 'exact' }).gte('created_at', new Date().toISOString().split('T')[0]),
        supabase.from('deal_stakeholders').select('id', { count: 'exact' }),
      ]);
      return {
        rooms: rooms.data || [],
        roomCount: rooms.count || 0,
        feedTodayCount: feed.count || 0,
        stakeholderCount: stakeholders.count || 0,
      };
    },
  });
}

// Deals without rooms for list page
export function useDealsWithoutRooms() {
  return useQuery({
    queryKey: ['deals-without-rooms'],
    queryFn: async () => {
      // Get all deal_ids that have rooms
      const { data: rooms } = await supabase.from('deal_rooms').select('deal_id');
      const roomDealIds = (rooms || []).map((r) => r.deal_id);

      const { data, error } = await supabase
        .from('deals')
        .select('id, deal_name, deal_stage_label, amount, days_since_contact')
        .not('deal_stage', 'in', `(${['266180272', '168848473', '168848474'].join(',')})`)
        .order('deal_name');
      if (error) throw error;
      return (data || []).filter((d) => !roomDealIds.includes(d.id));
    },
  });
}

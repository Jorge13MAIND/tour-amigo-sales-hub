import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { AtlasNotification } from '@/lib/types';

export function useNotifications(unreadOnly = false) {
  return useQuery({
    queryKey: ['notifications', unreadOnly],
    queryFn: async () => {
      let query = supabase
        .from('atlas_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (unreadOnly) query = query.eq('read', false);

      const { data, error } = await query;
      if (error) throw error;
      return data as AtlasNotification[];
    },
    refetchInterval: 30 * 1000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('atlas_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('read', false);
      if (error) throw error;
      return count ?? 0;
    },
    refetchInterval: 30 * 1000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('atlas_notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('atlas_notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      toast.success('All notifications marked as read');
    },
  });
}

export function useRealtimeNotifications() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'atlas_notifications' }, (payload) => {
        qc.invalidateQueries({ queryKey: ['notifications'] });
        qc.invalidateQueries({ queryKey: ['notifications-unread-count'] });
        const n = payload.new as AtlasNotification;
        toast.info(n.title, { description: n.body || undefined, duration: 5000 });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [qc]);
}

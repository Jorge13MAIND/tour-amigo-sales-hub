import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function useRealtimeDealRooms() {
  const qc = useQueryClient();

  useEffect(() => {
    const ch = supabase
      .channel('deal-rooms-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deal_rooms' }, () => {
        qc.invalidateQueries({ queryKey: ['deal-rooms'] });
        qc.invalidateQueries({ queryKey: ['deal-room'] });
        qc.invalidateQueries({ queryKey: ['deal-room-counts'] });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'deal_room_feed' }, () => {
        qc.invalidateQueries({ queryKey: ['deal-room-feed'] });
        qc.invalidateQueries({ queryKey: ['deal-room-counts'] });
        toast.info('New activity', { description: 'Deal room feed updated', duration: 3000 });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deal_stakeholders' }, () => {
        qc.invalidateQueries({ queryKey: ['deal-stakeholders'] });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, () => {
        qc.invalidateQueries({ queryKey: ['chat-messages'] });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'deal_documents' }, () => {
        qc.invalidateQueries({ queryKey: ['deal-documents'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [qc]);
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ChatMessage, Conversation } from '@/lib/types';

export function useConversations() {
  return useQuery({
    queryKey: ['atlas-conversations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('conversation_id, conversation_title, created_at')
        .eq('scope', 'global')
        .not('conversation_id', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by conversation_id, keep latest title and timestamp
      const map = new Map<string, Conversation>();
      for (const row of data || []) {
        const id = row.conversation_id as string;
        if (!map.has(id)) {
          map.set(id, {
            conversation_id: id,
            conversation_title: row.conversation_title,
            last_message_at: row.created_at,
            message_count: 1,
          });
        } else {
          map.get(id)!.message_count++;
        }
      }

      return Array.from(map.values());
    },
    refetchInterval: 30_000,
  });
}

export function useConversationMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ['atlas-messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as ChatMessage[];
    },
    enabled: !!conversationId,
  });
}

interface SendMessageParams {
  message: string;
  conversationId: string;
  history: Array<{ role: string; content: string }>;
}

export function useSendAtlasMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ message, conversationId, history }: SendMessageParams) => {
      const { data, error } = await supabase.functions.invoke('deal-room-chat', {
        body: {
          message,
          scope: 'global',
          model: 'opus',
          conversation_id: conversationId,
          history: history.slice(-10),
        },
      });

      if (error) throw new Error(error.message || 'Chat request failed');
      return data as {
        reply: string;
        scope: string;
        actions_executed: string[];
        conversation_id: string;
      };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['atlas-messages', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['atlas-conversations'] });
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('conversation_id', conversationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atlas-conversations'] });
    },
  });
}

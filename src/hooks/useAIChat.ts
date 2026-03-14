import { useState, useCallback, useRef } from 'react';
import { useDealChatMessages } from './useDealRooms';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface LocalMessage {
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export function useAIChat(dealId: number | null, scope: 'deal' | 'global') {
  const { data: dbMessages, isLoading: isLoadingHistory } = useDealChatMessages(dealId, scope);
  const queryClient = useQueryClient();
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesRef = useRef<{ role: string; content: string }[]>([]);

  const allMessages = [
    ...(dbMessages || []).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content, created_at: m.created_at })),
    ...localMessages,
  ];

  messagesRef.current = allMessages.map((m) => ({ role: m.role, content: m.content }));

  const sendMessage = useCallback(async (message: string) => {
    setError(null);
    const userMsg: LocalMessage = { role: 'user', content: message, created_at: new Date().toISOString() };
    setLocalMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const history = [...messagesRef.current.slice(-10), { role: 'user', content: message }];

      const { data, error: fnError } = await supabase.functions.invoke('deal-room-chat', {
        body: {
          message,
          deal_id: scope === 'deal' ? dealId : null,
          scope,
          history: history.slice(0, -1),
        },
      });

      if (fnError) throw new Error(fnError.message || `Error invoking chat`);
      const reply = data?.reply || data?.response || 'No response received.';

      setLocalMessages((prev) => [
        ...prev,
        { role: 'assistant', content: reply, created_at: new Date().toISOString() },
      ]);

      queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
    } catch (err: unknown) {
      const msg = err instanceof Error && err.name === 'AbortError'
        ? 'Request timed out. Please try again.'
        : 'Sorry, I couldn\'t process that. Please try again.';
      setError(msg);
      setLocalMessages((prev) => [
        ...prev,
        { role: 'assistant', content: msg, created_at: new Date().toISOString() },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [dealId, scope, queryClient]);

  const clearLocal = useCallback(() => setLocalMessages([]), []);

  return { messages: allMessages, sendMessage, isLoading, isLoadingHistory, error, clearLocal };
}

import { useState, useCallback, useRef } from 'react';
import { useDealChatMessages } from './useDealRooms';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const EDGE_URL = 'https://vffwtlmbwiizynzxpxnv.supabase.co/functions/v1/deal-room-chat';
// Reuse the anon key from supabase client config
const ANON_KEY = (supabase as unknown as { supabaseKey: string }).supabaseKey
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZnd0bG1id2lpenluenhweG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDEwNjcsImV4cCI6MjA4ODkxNzA2N30.v2oYHrN-jOqj4-_kJH3rb0E3nqU2cluRhd9QsQ6Osws';

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

  // Use ref to avoid stale closure in sendMessage
  const messagesRef = useRef<{ role: string; content: string }[]>([]);

  const allMessages = [
    ...(dbMessages || []).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content, created_at: m.created_at })),
    ...localMessages,
  ];

  // Keep ref in sync
  messagesRef.current = allMessages.map((m) => ({ role: m.role, content: m.content }));

  const sendMessage = useCallback(async (message: string) => {
    setError(null);
    const userMsg: LocalMessage = { role: 'user', content: message, created_at: new Date().toISOString() };
    setLocalMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Use ref for stable history snapshot
      const history = [...messagesRef.current.slice(-10), { role: 'user', content: message }];

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const res = await fetch(EDGE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`,
        },
        body: JSON.stringify({
          message,
          deal_id: scope === 'deal' ? dealId : null,
          scope,
          history: history.slice(0, -1), // Exclude the current message from history
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      const reply = data.reply || data.response || 'No response received.';

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

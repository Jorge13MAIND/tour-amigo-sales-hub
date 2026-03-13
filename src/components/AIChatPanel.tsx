import { useState, useRef, useEffect } from 'react';
import { useAIChat } from '@/hooks/useAIChat';
import { useLocation, useParams } from 'react-router-dom';
import { useDealRoom } from '@/hooks/useDealRooms';
import { X, Send, Sparkles, Bot, User } from 'lucide-react';

const DEAL_PROMPTS = [
  'What risks should I focus on?',
  'Summarize stakeholder engagement',
  "What's the next close plan step?",
  'Draft a follow-up email',
];

const GLOBAL_PROMPTS = [
  'Pipeline health summary',
  'Which deals need attention?',
  'What did ATLAS do today?',
  'Outreach performance this week',
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function AIChatPanel({ isOpen, onClose }: Props) {
  const location = useLocation();
  const params = useParams<{ id: string }>();
  const isDealRoom = location.pathname.startsWith('/deal-rooms/') && !!params.id;

  const { data: room } = useDealRoom(isDealRoom ? params.id : undefined);
  const dealId = room?.deal_id ?? null;

  const [scope, setScope] = useState<'deal' | 'global'>(isDealRoom ? 'deal' : 'global');
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setScope(isDealRoom ? 'deal' : 'global');
  }, [isDealRoom]);

  const { messages, sendMessage, isLoading, clearLocal } = useAIChat(
    scope === 'deal' ? dealId : null,
    scope
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput('');
  };

  const handleScopeChange = (newScope: 'deal' | 'global') => {
    setScope(newScope);
    clearLocal();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const prompts = scope === 'deal' ? DEAL_PROMPTS : GLOBAL_PROMPTS;

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-card border-l border-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className={`p-4 border-b-2 ${scope === 'deal' ? 'border-b-blue-500' : 'border-b-purple-500'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm text-foreground">Atlas AI</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {scope === 'deal' && room ? `Deal: ${room.deal_name}` : 'Global'}
        </p>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && !isLoading && (
          <div className="space-y-3 pt-4">
            <p className="text-xs text-muted-foreground text-center">Ask anything about your {scope === 'deal' ? 'deal' : 'pipeline'}:</p>
            <div className="space-y-2">
              {prompts.map((p) => (
                <button
                  key={p}
                  onClick={() => { setInput(p); }}
                  className="block w-full text-left text-xs px-3 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground'
            }`}>
              <div className="flex items-center gap-1.5 mb-0.5">
                {msg.role === 'assistant' ? <Bot className="h-3 w-3 shrink-0" /> : <User className="h-3 w-3 shrink-0" />}
                <span className="text-[10px] opacity-70">{msg.role === 'assistant' ? 'Atlas' : 'You'}</span>
              </div>
              <div className="whitespace-pre-wrap text-xs leading-relaxed">{msg.content}</div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-xl px-3 py-2">
              <div className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border space-y-2">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Atlas..."
            rows={1}
            className="flex-1 resize-none text-sm rounded-lg border border-border bg-background p-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary max-h-24"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="shrink-0 h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 transition-opacity"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

        {isDealRoom && (
          <div className="flex gap-1">
            <button
              onClick={() => handleScopeChange('deal')}
              className={`flex-1 text-[10px] py-1 rounded-full font-medium transition-colors ${scope === 'deal' ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Deal
            </button>
            <button
              onClick={() => handleScopeChange('global')}
              className={`flex-1 text-[10px] py-1 rounded-full font-medium transition-colors ${scope === 'global' ? 'bg-purple-500/15 text-purple-700 dark:text-purple-400' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Global
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

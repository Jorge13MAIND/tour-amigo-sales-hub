import { useState, useRef, useEffect, useCallback } from 'react';
import { useConversations, useConversationMessages, useSendAtlasMessage, useDeleteConversation } from '@/hooks/useAtlasChat';
import { Sparkles, Plus, Send, Bot, User, Trash2, Loader2, CheckCircle2, Mail, Bell, Search as SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { isToday, isYesterday, isThisWeek, format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Conversation } from '@/lib/types';

const COMMAND_CARDS = [
  { label: 'Morning Brief', prompt: 'Give me my morning brief. Pipeline health, urgent actions, calendar for today, and top 3 things I should focus on.', description: 'Daily priorities and action items', icon: '🌅' },
  { label: 'Pipeline Pulse', prompt: 'Pipeline pulse. Quick health check across all active deals. Flag anything at risk.', description: 'Health check across all deals', icon: '📊' },
  { label: 'Inbox', prompt: 'Review my inbox from the last 2 days. Classify what needs reply, what ATLAS can handle, and draft replies for the important ones.', description: 'Review and triage emails', icon: '📧' },
  { label: 'Prep', prompt: 'Prep me for my next meeting. Pull all context from HubSpot, Gmail, and the deal room.', description: 'Prepare for upcoming meeting', icon: '🎯' },
  { label: 'Debrief', prompt: 'I just finished a meeting. Help me debrief — I\'ll tell you what happened and you extract the intel, update HubSpot, and draft follow-up.', description: 'Record meeting notes and next steps', icon: '📝' },
];

function groupConversationsByDate(conversations: Conversation[]) {
  const groups: { label: string; items: Conversation[] }[] = [];
  const today: Conversation[] = [];
  const yesterday: Conversation[] = [];
  const thisWeek: Conversation[] = [];
  const older: Conversation[] = [];

  for (const c of conversations) {
    const d = new Date(c.last_message_at);
    if (isToday(d)) today.push(c);
    else if (isYesterday(d)) yesterday.push(c);
    else if (isThisWeek(d)) thisWeek.push(c);
    else older.push(c);
  }

  if (today.length) groups.push({ label: 'Today', items: today });
  if (yesterday.length) groups.push({ label: 'Yesterday', items: yesterday });
  if (thisWeek.length) groups.push({ label: 'This Week', items: thisWeek });
  if (older.length) groups.push({ label: 'Older', items: older });
  return groups;
}

function ActionCard({ action }: { action: string }) {
  let icon = <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />;
  if (action.toLowerCase().includes('draft')) icon = <Mail className="h-3.5 w-3.5 text-blue-500 shrink-0" />;
  if (action.toLowerCase().includes('notification')) icon = <Bell className="h-3.5 w-3.5 text-amber-500 shrink-0" />;
  if (action.toLowerCase().includes('search') || action.toLowerCase().includes('gmail')) icon = <SearchIcon className="h-3.5 w-3.5 text-purple-500 shrink-0" />;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-400">
      {icon}
      <span>{action}</span>
    </div>
  );
}

function relativeTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return format(d, 'MMM d');
}

export default function AtlasAI() {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(null);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: conversations = [], isLoading: loadingConversations } = useConversations();
  const { data: messages = [], isLoading: loadingMessages } = useConversationMessages(activeConversationId);
  const sendMutation = useSendAtlasMessage();
  const deleteMutation = useDeleteConversation();

  // Elapsed time counter
  useEffect(() => {
    if (!loadingStartTime) { setElapsed(0); return; }
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - loadingStartTime) / 1000)), 100);
    return () => clearInterval(interval);
  }, [loadingStartTime]);

  // Auto-scroll on new messages
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 100);
  }, [messages.length, pendingUserMessage]);

  const startNewConversation = useCallback((prompt?: string) => {
    const newId = crypto.randomUUID();
    setActiveConversationId(newId);
    if (prompt) {
      setTimeout(() => handleSend(prompt, newId), 50);
    }
  }, []);

  const handleSend = useCallback((text?: string, forceConversationId?: string) => {
    const msg = text || input.trim();
    if (!msg || sendMutation.isPending) return;
    setInput('');

    let convId = forceConversationId || activeConversationId;
    if (!convId) {
      convId = crypto.randomUUID();
      setActiveConversationId(convId);
    }

    setPendingUserMessage(msg);
    setLoadingStartTime(Date.now());

    const history = messages.map(m => ({ role: m.role, content: m.content }));
    sendMutation.mutate(
      { message: msg, conversationId: convId, history },
      {
        onSuccess: () => {
          setPendingUserMessage(null);
          setLoadingStartTime(null);
        },
        onError: () => {
          setPendingUserMessage(null);
          setLoadingStartTime(null);
        },
      }
    );
  }, [input, activeConversationId, messages, sendMutation]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDelete = (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeConversationId === convId) setActiveConversationId(null);
    deleteMutation.mutate(convId);
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [input]);

  const conversationGroups = groupConversationsByDate(conversations);
  const isLoading = sendMutation.isPending;

  // Parse actions from context_used
  const getActions = (msg: { context_used: Record<string, unknown> | null }) => {
    const actions = msg.context_used?.actions_executed as string[] | undefined;
    return actions?.filter(a => a && !a.includes('limit reached')) || [];
  };

  return (
    <div className="flex h-[calc(100vh-64px)] -m-6 overflow-hidden">
      {/* Conversation Sidebar */}
      <div className="w-72 border-r border-border bg-card/50 flex flex-col shrink-0">
        <div className="p-4">
          <Button onClick={() => startNewConversation()} className="w-full gap-2" size="sm">
            <Plus className="h-4 w-4" />
            New Conversation
          </Button>
        </div>
        <Separator />
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-4">
            {loadingConversations && (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            )}
            {conversationGroups.map(group => (
              <div key={group.label}>
                <p className="px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{group.label}</p>
                {group.items.map(conv => (
                  <button
                    key={conv.conversation_id}
                    onClick={() => setActiveConversationId(conv.conversation_id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors group flex items-center gap-2 ${
                      activeConversationId === conv.conversation_id
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-foreground/70 hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <span className="flex-1 truncate">{conv.conversation_title || 'Untitled'}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0 group-hover:hidden">{relativeTime(conv.last_message_at)}</span>
                    <button
                      onClick={(e) => handleDelete(conv.conversation_id, e)}
                      className="hidden group-hover:block shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </button>
                ))}
              </div>
            ))}
            {!loadingConversations && conversations.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">No conversations yet</p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {!activeConversationId ? (
          /* Welcome Screen */
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-2xl w-full space-y-8">
              <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold text-primary">ATLAS AI</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">Opus 4.6</span>
                </div>
                <h2 className="text-2xl font-bold text-foreground">Your strategic sales brain</h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  I have access to your deals, pipeline, outreach, calendar, and email.
                  I can execute actions, draft emails, create tasks, and update deals for you.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {COMMAND_CARDS.map(card => (
                  <button
                    key={card.label}
                    onClick={() => startNewConversation(card.prompt)}
                    className="text-left p-4 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all group"
                  >
                    <span className="text-xl">{card.icon}</span>
                    <p className="text-sm font-semibold text-foreground mt-2 group-hover:text-primary transition-colors">{card.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{card.description}</p>
                  </button>
                ))}
              </div>

              {/* Quick input on welcome screen */}
              <div className="flex gap-2 max-w-lg mx-auto">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask ATLAS anything..."
                  rows={1}
                  className="flex-1 resize-none text-sm rounded-xl border border-border bg-background p-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <Button
                  onClick={() => handleSend()}
                  disabled={!input.trim()}
                  size="icon"
                  className="h-11 w-11 rounded-xl shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Conversation View */
          <>
            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto p-6 space-y-6">
                {loadingMessages && (
                  <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                )}

                {messages.map((msg, i) => (
                  <div key={msg.id || i}>
                    {msg.role === 'user' ? (
                      <div className="flex justify-end">
                        <div className="max-w-[80%] bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-3">
                          <div className="flex items-center gap-1.5 mb-1 opacity-70">
                            <User className="h-3 w-3" />
                            <span className="text-[10px] font-medium">You</span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-start">
                        <div className="max-w-[90%]">
                          <div className="flex items-center gap-1.5 mb-2 text-muted-foreground">
                            <Bot className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-medium">ATLAS</span>
                            <span className="text-[10px]">{msg.model || ''}</span>
                          </div>
                          <div className="prose prose-sm dark:prose-invert max-w-none text-foreground [&_table]:text-xs [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-1.5 [&_th]:bg-muted [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-1.5 [&_p]:text-sm [&_li]:text-sm [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_code]:text-xs [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-muted [&_pre]:rounded-lg [&_pre]:p-3">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                          </div>
                          {/* Action cards */}
                          {getActions(msg).length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {getActions(msg).map((action, j) => (
                                <ActionCard key={j} action={action} />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Pending user message (optimistic) */}
                {pendingUserMessage && (
                  <div className="flex justify-end">
                    <div className="max-w-[80%] bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-3">
                      <div className="flex items-center gap-1.5 mb-1 opacity-70">
                        <User className="h-3 w-3" />
                        <span className="text-[10px] font-medium">You</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{pendingUserMessage}</p>
                    </div>
                  </div>
                )}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-muted">
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        ATLAS is thinking... {elapsed > 0 && `${elapsed}s`}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Input Bar */}
            <div className="border-t border-border p-4 bg-background">
              <div className="max-w-3xl mx-auto flex gap-3 items-end">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask ATLAS anything..."
                  rows={1}
                  className="flex-1 resize-none text-sm rounded-xl border border-border bg-muted/30 p-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 max-h-36"
                />
                <Button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="h-11 w-11 rounded-xl shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

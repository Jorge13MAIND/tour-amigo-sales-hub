import type { DealRoomFeedItem, FeedSource } from '@/lib/types';
import { relativeTime } from '@/lib/relativeTime';
import { useState } from 'react';
import { Mail, Calendar, MessageSquare, FolderOpen, Link, Bot, Mic, Pencil, Activity, ExternalLink, AlertTriangle } from 'lucide-react';

const SOURCE_CONFIG: Record<FeedSource, { icon: React.ReactNode; color: string }> = {
  email: { icon: <Mail className="h-4 w-4" />, color: 'text-blue-500' },
  calendar: { icon: <Calendar className="h-4 w-4" />, color: 'text-purple-500' },
  slack: { icon: <MessageSquare className="h-4 w-4" />, color: 'text-emerald-500' },
  drive: { icon: <FolderOpen className="h-4 w-4" />, color: 'text-amber-500' },
  hubspot: { icon: <Link className="h-4 w-4" />, color: 'text-orange-500' },
  agent: { icon: <Bot className="h-4 w-4" />, color: 'text-teal-500' },
  transcript: { icon: <Mic className="h-4 w-4" />, color: 'text-pink-500' },
  manual: { icon: <Pencil className="h-4 w-4" />, color: 'text-muted-foreground' },
};

const SENTIMENT_STYLES: Record<string, string> = {
  positive: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  negative: 'bg-destructive/15 text-destructive',
  neutral: 'bg-muted text-muted-foreground',
};

interface Props {
  feed: DealRoomFeedItem[];
}

export function ActivityFeed({ feed }: Props) {
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState(false);

  const sources: string[] = ['all', ...new Set(feed.map((f) => f.source))];

  const filtered = feed.filter((f) => {
    if (sourceFilter !== 'all' && f.source !== sourceFilter) return false;
    if (actionFilter && !f.action_required) return false;
    return true;
  });

  if (!feed.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Activity className="h-10 w-10 mb-3 opacity-40" />
        <p className="text-sm">No activity recorded yet.</p>
        <p className="text-xs mt-1">The deal room sync agent feeds this automatically from Gmail, Calendar, Slack, Drive, and HubSpot.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {sources.map((s) => (
          <button
            key={s}
            onClick={() => setSourceFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${sourceFilter === s ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <button
          onClick={() => setActionFilter(!actionFilter)}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${actionFilter ? 'bg-amber-500 text-white border-amber-500' : 'border-border text-muted-foreground hover:text-foreground'}`}
        >
          ⚡ Action Required
        </button>
      </div>

      {/* Feed items */}
      <div className="space-y-3">
        {filtered.map((item) => <FeedCard key={item.id} item={item} />)}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No items match the current filters.</p>}
      </div>
    </div>
  );
}

function FeedCard({ item }: { item: DealRoomFeedItem }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = SOURCE_CONFIG[item.source] || SOURCE_CONFIG.manual;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={cfg.color}>{cfg.icon}</span>
          <span className="text-sm font-semibold text-foreground">{item.event_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</span>
        </div>
        <span className="text-xs text-muted-foreground shrink-0">{relativeTime(item.created_at)}</span>
      </div>

      {item.stakeholder_name && <p className="text-xs text-muted-foreground">From: {item.stakeholder_name}</p>}
      <p className="text-sm font-medium text-foreground">{item.title}</p>

      {item.summary && (
        <p className={`text-sm text-muted-foreground ${!expanded ? 'line-clamp-3' : ''}`}>{item.summary}</p>
      )}
      {item.summary && item.summary.length > 150 && (
        <button onClick={() => setExpanded(!expanded)} className="text-xs text-primary">{expanded ? 'Show less' : 'Show more'}</button>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {item.sentiment && SENTIMENT_STYLES[item.sentiment] && (
          <span className={`text-[10px] font-medium rounded-full px-2 py-0.5 ${SENTIMENT_STYLES[item.sentiment]}`}>
            {item.sentiment === 'positive' ? '😊' : item.sentiment === 'negative' ? '😟' : '😐'} {item.sentiment}
          </span>
        )}
        {item.external_url && (
          <a href={item.external_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
            Open <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {item.action_required && item.action_description && (
        <div className="flex items-start gap-2 bg-amber-500/10 rounded-lg p-2.5 mt-1">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-300">{item.action_description}</p>
        </div>
      )}
    </div>
  );
}

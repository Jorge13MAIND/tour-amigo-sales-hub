import { useState } from 'react';
import { Bot } from 'lucide-react';
import { useAgentActivity, useTodayAgentStats } from '@/hooks/useAgentActivity';
import { AgentIcon } from '@/components/AgentIcon';
import { ResultBadge } from '@/components/ResultBadge';
import { relativeTime } from '@/lib/relativeTime';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AGENT_CONFIG } from '@/lib/types';
import type { AgentName, AgentActivity } from '@/lib/types';

const AGENT_OPTIONS = ['all', ...Object.keys(AGENT_CONFIG)] as const;
const RESULT_OPTIONS = ['all', 'success', 'auto_executed', 'needs_approval', 'failed', 'skipped'] as const;
const TIME_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'all', label: 'All time' },
] as const;

function ActivityCard({ activity }: { activity: AgentActivity }) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-start gap-3">
        <AgentIcon agent={activity.agent_name} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-semibold text-foreground truncate">
                {AGENT_CONFIG[activity.agent_name]?.label || activity.agent_name}
              </span>
              <ResultBadge result={activity.result} />
            </div>
            <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
              {relativeTime(activity.created_at)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{activity.description}</p>
          <div className="flex items-center gap-2 mt-2">
            {activity.deal_name && (
              <span className="text-xs text-primary font-medium truncate">
                {activity.deal_name}
              </span>
            )}
            <span className="text-[10px] bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono">
              {activity.action_type}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function AgentFeed() {
  const [agentFilter, setAgentFilter] = useState('all');
  const [resultFilter, setResultFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState<'today' | '7d' | '30d' | 'all'>('today');

  const { data: activities, isLoading } = useAgentActivity({
    agentName: agentFilter,
    result: resultFilter,
    timeRange: timeFilter,
  });
  const { data: stats } = useTodayAgentStats();

  return (
    <div className="space-y-5 max-w-[1000px]">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Agent Activity</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Today: {stats?.total || 0} actions, {stats?.autoExecuted || 0} auto-executed, {stats?.pendingApproval || 0} pending approval
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={agentFilter} onValueChange={setAgentFilter}>
          <SelectTrigger className="w-[180px] h-9 text-sm">
            <SelectValue placeholder="Agent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Agents</SelectItem>
            {AGENT_OPTIONS.filter((a) => a !== 'all').map((agent) => (
              <SelectItem key={agent} value={agent}>
                {AGENT_CONFIG[agent as AgentName]?.label || agent}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={resultFilter} onValueChange={setResultFilter}>
          <SelectTrigger className="w-[170px] h-9 text-sm">
            <SelectValue placeholder="Result" />
          </SelectTrigger>
          <SelectContent>
            {RESULT_OPTIONS.map((r) => (
              <SelectItem key={r} value={r}>
                {r === 'all' ? 'All Results' : r.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as typeof timeFilter)}>
          <SelectTrigger className="w-[150px] h-9 text-sm">
            <SelectValue placeholder="Time" />
          </SelectTrigger>
          <SelectContent>
            {TIME_OPTIONS.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Activity Feed */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : !activities?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Bot className="h-10 w-10" />
          <p className="text-sm text-center max-w-xs">
            No agent activity yet. ATLAS agents will log their actions here as they run.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { ShieldCheck, CheckCircle, Clock } from 'lucide-react';
import { useAgentActivity } from '@/hooks/useAgentActivity';
import { AgentIcon } from '@/components/AgentIcon';
import { relativeTime } from '@/lib/relativeTime';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AGENT_CONFIG } from '@/lib/types';
import type { AgentActivity } from '@/lib/types';

function ApprovalCard({ activity }: { activity: AgentActivity }) {
  return (
    <Card className="p-4 border-l-4 border-l-amber-400 hover:shadow-md transition-shadow animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          <Clock className="h-5 w-5 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
              Pending Approval
            </span>
            <span className="text-[11px] text-muted-foreground whitespace-nowrap">
              {relativeTime(activity.created_at)}
            </span>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <AgentIcon agent={activity.agent_name} size={14} />
            <span className="text-sm font-semibold text-foreground">
              {AGENT_CONFIG[activity.agent_name]?.label || activity.agent_name}
            </span>
            <span className="text-[10px] bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono">
              {activity.action_type}
            </span>
          </div>

          {activity.deal_name && (
            <p className="text-xs text-primary font-medium mb-1.5">{activity.deal_name}</p>
          )}

          <p className="text-sm text-muted-foreground leading-relaxed">{activity.description}</p>

          <div className="mt-3 pt-2.5 border-t border-border">
            <p className="text-[11px] text-muted-foreground/70 flex items-center gap-1.5">
              <span className="text-amber-500">💡</span>
              Approve via Gmail (send the draft) or reply to Slack DM from Atlas
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function Approvals() {
  const [timeFilter, setTimeFilter] = useState<'today' | '7d' | '30d' | 'all'>('all');

  const { data: activities, isLoading } = useAgentActivity({
    result: 'needs_approval',
    timeRange: timeFilter === 'all' ? 'all' : timeFilter,
  });

  const pending = activities || [];

  return (
    <div className="space-y-5 max-w-[900px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            Pending Approvals
            {pending.length > 0 && (
              <span className="text-sm font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 rounded-full px-2.5 py-0.5">
                {pending.length}
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Actions that need your review before execution
          </p>
        </div>
        <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as typeof timeFilter)}>
          <SelectTrigger className="w-[150px] h-9 text-sm">
            <SelectValue placeholder="Time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full max-w-[300px] grid-cols-2">
          <TabsTrigger value="pending" className="text-sm">Pending</TabsTrigger>
          <TabsTrigger value="history" className="text-sm">History</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
            </div>
          ) : !pending.length ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
              <CheckCircle className="h-10 w-10 text-emerald-500" />
              <p className="text-sm text-center max-w-xs">
                All clear! No pending approvals. ATLAS agents will notify you here when they need your input.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map((a) => (
                <ApprovalCard key={a.id} activity={a} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
            <ShieldCheck className="h-10 w-10" />
            <p className="text-sm text-center max-w-xs">
              Approval history will appear here as approvals are processed.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

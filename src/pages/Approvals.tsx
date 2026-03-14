import { useState } from 'react';
import { ShieldCheck, CheckCircle, Clock, Check, X, Loader2 } from 'lucide-react';
import { useAgentActivity } from '@/hooks/useAgentActivity';
import { AgentIcon } from '@/components/AgentIcon';
import { relativeTime } from '@/lib/relativeTime';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AGENT_CONFIG } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import type { AgentActivity } from '@/lib/types';

const SUPABASE_URL = 'https://vffwtlmbwiizynzxpxnv.supabase.co';

async function processApproval(activityId: string, action: 'approved' | 'rejected') {
  const { data: { session } } = await supabase.auth.getSession();
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZnd0bG1id2lpenluenhweG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDEwNjcsImV4cCI6MjA4ODkxNzA2N30.v2oYHrN-jOqj4-_kJH3rb0E3nqU2cluRhd9QsQ6Osws';
  const token = session?.access_token || anonKey;

  const res = await fetch(`${SUPABASE_URL}/functions/v1/process-approval`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ activity_id: activityId, action }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `Failed with status ${res.status}`);
  }

  return res.json();
}

function ApprovalCard({
  activity,
  onProcess,
  processing,
}: {
  activity: AgentActivity;
  onProcess: (id: string, action: 'approved' | 'rejected') => void;
  processing: string | null;
}) {
  const isProcessing = processing === activity.id;

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

          <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground/70">
              Action required
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-3 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                onClick={() => onProcess(activity.id, 'rejected')}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <X className="h-3 w-3 mr-1" />
                    Reject
                  </>
                )}
              </Button>
              <Button
                size="sm"
                className="h-7 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => onProcess(activity.id, 'approved')}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Approve
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function HistoryCard({ activity }: { activity: AgentActivity }) {
  const isApproved = activity.result === 'approved';
  return (
    <Card className={`p-4 border-l-4 ${isApproved ? 'border-l-emerald-400' : 'border-l-red-400'} opacity-80 hover:opacity-100 transition-opacity`}>
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          {isApproved ? (
            <CheckCircle className="h-5 w-5 text-emerald-500" />
          ) : (
            <X className="h-5 w-5 text-red-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className={`text-xs font-bold uppercase tracking-wide ${isApproved ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {isApproved ? 'Approved' : 'Rejected'}
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
        </div>
      </div>
    </Card>
  );
}

export default function Approvals() {
  const [timeFilter, setTimeFilter] = useState<'today' | '7d' | '30d' | 'all'>('all');
  const [processing, setProcessing] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: pendingActivities, isLoading: pendingLoading } = useAgentActivity({
    result: 'needs_approval',
    timeRange: timeFilter === 'all' ? 'all' : timeFilter,
  });

  const { data: approvedActivities, isLoading: historyLoading } = useAgentActivity({
    result: 'approved',
    timeRange: timeFilter === 'all' ? 'all' : timeFilter,
  });

  const { data: rejectedActivities } = useAgentActivity({
    result: 'rejected',
    timeRange: timeFilter === 'all' ? 'all' : timeFilter,
  });

  const pending = pendingActivities || [];
  const history = [
    ...(approvedActivities || []),
    ...(rejectedActivities || []),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const handleProcess = async (activityId: string, action: 'approved' | 'rejected') => {
    setProcessing(activityId);
    try {
      await processApproval(activityId, action);
      toast({
        title: action === 'approved' ? 'Approved' : 'Rejected',
        description: action === 'approved'
          ? 'Action approved. A task has been queued for execution.'
          : 'Action rejected and logged.',
      });
      queryClient.invalidateQueries({ queryKey: ['agent-activity'] });
      queryClient.invalidateQueries({ queryKey: ['pending-approval-count'] });
      queryClient.invalidateQueries({ queryKey: ['agent-stats-today'] });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to process approval',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

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
          <TabsTrigger value="pending" className="text-sm">
            Pending {pending.length > 0 && `(${pending.length})`}
          </TabsTrigger>
          <TabsTrigger value="history" className="text-sm">
            History {history.length > 0 && `(${history.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {pendingLoading ? (
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
                <ApprovalCard
                  key={a.id}
                  activity={a}
                  onProcess={handleProcess}
                  processing={processing}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {historyLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
          ) : !history.length ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
              <ShieldCheck className="h-10 w-10" />
              <p className="text-sm text-center max-w-xs">
                Approval history will appear here as you approve or reject actions.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((a) => (
                <HistoryCard key={a.id} activity={a} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

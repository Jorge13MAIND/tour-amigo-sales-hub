import { useState } from 'react';
import { Route, Check, Mail, Clock, SkipForward, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useFollowUpPlans } from '@/hooks/useFollowUpPlans';
import { relativeTime } from '@/lib/relativeTime';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { FollowUpPlan, FollowUpStep } from '@/lib/types';

const STATUS_STYLES: Record<string, { label: string; classes: string }> = {
  active: { label: 'Active', classes: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
  completed: { label: 'Completed', classes: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
  paused: { label: 'Paused', classes: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  cancelled: { label: 'Cancelled', classes: 'bg-gray-100 text-gray-600 dark:bg-gray-800/40 dark:text-gray-400' },
};

const PLAN_TYPE_LABELS: Record<string, string> = {
  post_demo: 'Post-Demo',
  stale_reengagement: 'Stale Re-engage',
  cold_outreach: 'Cold Outreach',
  close_date_recovery: 'Close Date Recovery',
};

function StepIndicator({ step, isLast }: { step: FollowUpStep; isLast: boolean }) {
  const isSent = step.status === 'sent' || step.status === 'completed';
  const isPending = step.status === 'pending';
  const isSkipped = step.status === 'skipped';

  return (
    <div className="flex items-center">
      <div className="flex flex-col items-center min-w-[80px]">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
          isSent ? 'bg-emerald-500 border-emerald-500 text-white' :
          isPending ? 'bg-primary/10 border-primary text-primary' :
          'bg-muted border-muted-foreground/30 text-muted-foreground'
        }`}>
          {isSent ? <Check className="h-4 w-4" /> :
           isPending ? <Mail className="h-4 w-4" /> :
           isSkipped ? <SkipForward className="h-3 w-3" /> :
           <X className="h-3 w-3" />}
        </div>
        <span className="text-[10px] text-muted-foreground mt-1 text-center leading-tight">
          {step.action?.slice(0, 20) || `Step ${step.step_number}`}
        </span>
        <span className="text-[9px] text-muted-foreground/60">
          {isSent && step.sent_at ? new Date(step.sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) :
           isPending ? `Day ${step.delay_days}` :
           isSkipped ? 'Skipped' : ''}
        </span>
      </div>
      {!isLast && (
        <div className={`h-0.5 w-8 mx-1 ${isSent ? 'bg-emerald-500' : 'bg-border'}`} />
      )}
    </div>
  );
}

function FollowUpCard({ plan }: { plan: FollowUpPlan }) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_STYLES[plan.status] || STATUS_STYLES.active;
  const steps = Array.isArray(plan.steps) ? plan.steps : [];
  const daysAgo = Math.floor((Date.now() - new Date(plan.created_at).getTime()) / 86400000);

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{plan.deal_name}</span>
            <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${status.classes}`}>
              {status.label}
            </span>
            <span className="text-[10px] text-muted-foreground">{daysAgo}d ago</span>
          </div>
          {plan.trigger_reason && (
            <p className="text-xs text-muted-foreground mt-0.5">Reason: {plan.trigger_reason}</p>
          )}
          {plan.playbook_used && (
            <p className="text-xs text-muted-foreground/70">Playbook: {plan.playbook_used}</p>
          )}
        </div>
        <span className="text-[10px] bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono whitespace-nowrap">
          {PLAN_TYPE_LABELS[plan.plan_type] || plan.plan_type}
        </span>
      </div>

      {/* Stepper */}
      {steps.length > 0 && (
        <div className="flex items-start overflow-x-auto pb-2 mb-2">
          {steps.map((step, i) => (
            <StepIndicator key={i} step={step} isLast={i === steps.length - 1} />
          ))}
        </div>
      )}

      {/* Expand/collapse for email content */}
      {steps.length > 0 && (
        <Collapsible open={expanded} onOpenChange={setExpanded}>
          <CollapsibleTrigger className="flex items-center gap-1 text-xs text-primary hover:underline mt-1">
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded ? 'Collapse' : 'View email content'}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-2">
            {steps.map((step, i) => (
              <div key={i} className="bg-muted/50 rounded-lg p-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">
                  Step {step.step_number} — {step.action}
                </p>
                <p className="text-xs text-foreground/80 whitespace-pre-wrap">
                  {step.template || 'No template content'}
                </p>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </Card>
  );
}

export default function FollowUps() {
  const [statusFilter, setStatusFilter] = useState('active');
  const [typeFilter, setTypeFilter] = useState('all');

  const { data: plans, isLoading } = useFollowUpPlans({
    status: statusFilter,
    planType: typeFilter,
  });

  const activePlans = plans || [];
  const emailsDueToday = activePlans.reduce((count, plan) => {
    const steps = Array.isArray(plan.steps) ? plan.steps : [];
    return count + steps.filter((s) => s.status === 'pending').length;
  }, 0);

  return (
    <div className="space-y-5 max-w-[1100px]">
      <div>
        <h1 className="text-xl font-bold text-foreground">Follow-Up Plans</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {activePlans.length} plan{activePlans.length !== 1 ? 's' : ''} shown, {emailsDueToday} email{emailsDueToday !== 1 ? 's' : ''} pending
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px] h-9 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px] h-9 text-sm">
            <SelectValue placeholder="Plan Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="post_demo">Post-Demo</SelectItem>
            <SelectItem value="stale_reengagement">Stale Re-engage</SelectItem>
            <SelectItem value="cold_outreach">Cold Outreach</SelectItem>
            <SelectItem value="close_date_recovery">Close Date Recovery</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : !activePlans.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Route className="h-10 w-10" />
          <p className="text-sm text-center max-w-xs">
            No follow-up plans yet. Plans are created automatically when ATLAS detects deals needing attention.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activePlans.map((plan) => (
            <FollowUpCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}
    </div>
  );
}

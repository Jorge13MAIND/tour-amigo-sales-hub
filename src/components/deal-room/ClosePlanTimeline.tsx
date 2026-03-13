import type { ClosePlanStep } from '@/lib/types';
import { computeStepStatus, daysRemaining, type ComputedStepStatus } from '@/lib/dealRoomUtils';
import { useState } from 'react';
import { CheckCircle2, Circle, Clock, ChevronDown, ChevronUp } from 'lucide-react';

const STATUS_STYLES: Record<ComputedStepStatus, { border: string; badge: string; badgeText: string; icon: React.ReactNode; bg: string }> = {
  completed: {
    border: 'border-l-emerald-500',
    badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
    badgeText: 'COMPLETED',
    icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
    bg: '',
  },
  today: {
    border: 'border-l-blue-500',
    badge: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
    badgeText: 'TODAY',
    icon: <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center"><div className="h-2 w-2 rounded-full bg-white" /></div>,
    bg: 'bg-blue-500/5',
  },
  upcoming: {
    border: 'border-l-amber-500',
    badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
    badgeText: 'UPCOMING',
    icon: <Clock className="h-5 w-5 text-amber-500" />,
    bg: '',
  },
  pending: {
    border: 'border-l-muted-foreground/30',
    badge: 'bg-muted text-muted-foreground',
    badgeText: 'PENDING',
    icon: <Circle className="h-5 w-5 text-muted-foreground/40" />,
    bg: '',
  },
};

interface Props {
  steps: ClosePlanStep[];
  targetCloseDate: string | null;
}

export function ClosePlanTimeline({ steps, targetCloseDate }: Props) {
  const sortedSteps = [...steps].sort((a, b) => a.date.localeCompare(b.date));
  const completedCount = sortedSteps.filter((s) => computeStepStatus(s) === 'completed').length;
  const total = sortedSteps.length;
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const days = daysRemaining(targetCloseDate);
  const barColor = pct > 60 ? 'bg-emerald-500' : pct > 30 ? 'bg-amber-500' : 'bg-destructive';

  return (
    <div className="space-y-4">
      {/* Progress summary */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium text-foreground">Close Plan Progress</span>
          <span className="text-muted-foreground">
            {completedCount} of {total} steps · {pct}% complete
            {days !== null && ` · ${days > 0 ? `${days} days remaining` : days === 0 ? 'Closes today' : `${Math.abs(days)} days overdue`}`}
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-0">
        {sortedSteps.map((step, i) => (
          <TimelineStep key={i} step={step} isLast={i === sortedSteps.length - 1} />
        ))}
      </div>
    </div>
  );
}

function TimelineStep({ step, isLast }: { step: ClosePlanStep; isLast: boolean }) {
  const status = computeStepStatus(step);
  const style = STATUS_STYLES[status];
  const defaultOpen = status === 'today' || status === 'upcoming';
  const [open, setOpen] = useState(defaultOpen);

  const dateFormatted = new Date(step.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className={`relative border-l-4 ${style.border} ${style.bg} ${!isLast ? 'pb-1' : ''}`}>
      <div className="pl-4 py-3 pr-3">
        <button onClick={() => setOpen(!open)} className="flex items-center gap-3 w-full text-left group">
          <div className="shrink-0">{style.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold text-muted-foreground">{step.day}</span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">{dateFormatted}</span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className={`text-sm font-semibold ${status === 'completed' ? 'text-muted-foreground' : 'text-foreground'}`}>{step.focus}</span>
            </div>
          </div>
          <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 shrink-0 ${style.badge}`}>{style.badgeText}</span>
          {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
        </button>

        {open && (
          <div className="mt-2 ml-8 space-y-1.5 text-sm">
            {step.actions && (
              <div><span className="text-muted-foreground font-medium">Actions:</span> <span className="text-foreground/80">{step.actions}</span></div>
            )}
            {step.owner && (
              <div><span className="text-muted-foreground font-medium">Owner:</span> <span className="text-foreground/80">{step.owner}</span></div>
            )}
            {step.deliverable && (
              <div><span className="text-muted-foreground font-medium">Deliverable:</span> <span className="text-foreground/80">{step.deliverable}</span></div>
            )}
            {step.risk && (
              <div><span className="text-muted-foreground font-medium">Risk:</span> <span className="text-destructive/80">{step.risk}</span></div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

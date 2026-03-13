import type { DealRoom, Deal } from '@/lib/types';
import { computeStepStatus } from '@/lib/dealRoomUtils';
import { relativeTime } from '@/lib/relativeTime';
import { formatCurrency } from '@/lib/format';
import { Link } from 'react-router-dom';
import { Users, AlertTriangle, Rss, FileText } from 'lucide-react';

const TYPE_COLORS: Record<string, string> = {
  enterprise: 'bg-purple-500/15 text-purple-700 dark:text-purple-400',
  mid_market: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  standard: 'bg-muted text-muted-foreground',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  won: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  lost: 'bg-destructive/15 text-destructive',
  paused: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
};

interface Props {
  room: DealRoom;
  stakeholderCount?: number;
  feedCount?: number;
  docCount?: number;
  lastFeedAt?: string | null;
}

export function DealRoomCard({ room, stakeholderCount = 0, feedCount = 0, docCount = 0, lastFeedAt }: Props) {
  const deal = room.deals as Deal | undefined;
  const steps = room.close_plan || [];
  const completedSteps = steps.filter((s) => computeStepStatus(s) === 'completed').length;
  const totalSteps = steps.length;
  const pct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  const barColor = pct > 60 ? 'bg-emerald-500' : pct > 30 ? 'bg-amber-500' : 'bg-destructive';

  const openRisks = (room.risks || []).filter((r) => r.status === 'open').length;
  const riskScore = deal?.risk_score ?? 0;
  const riskColor = riskScore <= 3 ? 'text-emerald-600 dark:text-emerald-400' : riskScore <= 6 ? 'text-amber-600 dark:text-amber-400' : 'text-destructive';

  return (
    <Link
      to={`/deal-rooms/${room.id}`}
      className="block rounded-xl border border-border bg-card p-5 hover:shadow-lg hover:border-primary/30 transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{room.deal_name}</h3>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 uppercase ${TYPE_COLORS[room.room_type] || TYPE_COLORS.standard}`}>
            {room.room_type.replace('_', '-')}
          </span>
          <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 uppercase ${STATUS_COLORS[room.status] || ''}`}>
            {room.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-3">
        <div>
          <span className="text-muted-foreground">TCV:</span>{' '}
          <span className="font-semibold text-foreground">{room.total_contract_value ? formatCurrency(room.total_contract_value) : '—'}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Probability:</span>{' '}
          <span className="font-semibold text-foreground">{room.close_probability ?? '—'}%</span>
        </div>
        <div>
          <span className="text-muted-foreground">Close:</span>{' '}
          <span className="text-foreground">{room.target_close_date ? new Date(room.target_close_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Users:</span>{' '}
          <span className="text-foreground">{deal?.number_of_users || '—'}</span>
        </div>
      </div>

      {totalSteps > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Close Plan</span>
            <span>{completedSteps}/{totalSteps} done</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
        <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {stakeholderCount}</span>
        <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {openRisks} risks</span>
        <span className="flex items-center gap-1"><Rss className="h-3 w-3" /> {feedCount}</span>
        <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> {docCount}</span>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{deal?.deal_stage_label}</span>
        <span className={`font-medium ${riskColor}`}>Risk: {riskScore}</span>
        {lastFeedAt && <span className="text-muted-foreground">{relativeTime(lastFeedAt)}</span>}
      </div>
    </Link>
  );
}

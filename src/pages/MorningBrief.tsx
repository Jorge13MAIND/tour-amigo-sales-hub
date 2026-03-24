import { useMorningBrief } from '@/hooks/useMorningBrief';
import { useDeals } from '@/hooks/useDeals';
import { useTodaysTasks } from '@/hooks/useTasks';
import { useMarkNotificationRead, useMarkAllRead } from '@/hooks/useNotifications';
import { useAppContext } from '@/contexts/AppContext';
import { formatCurrency, relativeTime } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Zap,
  AlertTriangle,
  CheckCircle2,
  Users,
  Mail,
  Calendar,
  Clock,
  ArrowRight,
  DollarSign,
  CircleDot,
  FileText,
  Send,
  Pencil,
  X,
  ChevronRight,
  TrendingUp,
  Shield,
  Eye,
} from 'lucide-react';
import type { AtlasNotification } from '@/lib/types';

/* ── Priority config (icons only, no emojis) ── */
const PRIORITY_CONFIG = {
  critical: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-900', dot: 'bg-red-500', label: 'Now' },
  high: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-900', dot: 'bg-amber-500', label: 'Today' },
  normal: { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-900', dot: 'bg-blue-500', label: 'This week' },
  low: { color: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-950/30', border: 'border-slate-200 dark:border-slate-800', dot: 'bg-slate-400', label: 'FYI' },
} as const;

/* ── Stat Pill ── */
function StatPill({ value, label, color }: { value: string | number; label: string; color: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border">
      <div className={cn('w-2 h-2 rounded-full', color)} />
      <div>
        <div className="text-lg font-semibold tracking-tight leading-none">{value}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">{label}</div>
      </div>
    </div>
  );
}

/* ── Focus Card (critical/high actions) ── */
function FocusCard({ notification, index }: { notification: AtlasNotification; index: number }) {
  const markRead = useMarkNotificationRead();
  const priority = (notification.priority as keyof typeof PRIORITY_CONFIG) || 'normal';
  const config = PRIORITY_CONFIG[priority];
  const meta = notification.metadata || {};
  const dealName = meta.deal_name as string | undefined;
  const contact = meta.contact as string | undefined;
  const competitor = meta.competitor as string | undefined;
  const action = meta.action as string | undefined;

  // Clean title: remove leading emoji patterns
  const cleanTitle = notification.title.replace(/^[^\w\s]*\s*(?:ACTION \d+:\s*)?/i, '');

  return (
    <div className={cn(
      'rounded-2xl border p-6 transition-all hover:shadow-lg',
      config.bg, config.border,
      notification.read && 'opacity-60'
    )}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white', config.dot)}>
            {index + 1}
          </div>
          <span className={cn('text-xs font-semibold uppercase tracking-wider', config.color)}>{config.label}</span>
          {action && (
            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {action.replace(/_/g, ' ')}
            </span>
          )}
        </div>
        {!notification.read && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => markRead.mutate(notification.id)}
          >
            <X className="h-3 w-3 mr-1" /> Dismiss
          </Button>
        )}
      </div>

      {/* Title */}
      <h3 className="text-[15px] font-semibold text-foreground leading-snug mb-2">{cleanTitle}</h3>

      {/* Body */}
      {notification.body && (
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">{notification.body}</p>
      )}

      {/* Deal context bar */}
      <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
        {dealName && (
          <span className="flex items-center gap-1">
            <CircleDot className="h-3 w-3" /> {dealName}
          </span>
        )}
        {contact && (
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" /> {contact}
          </span>
        )}
        {competitor && (
          <span className="flex items-center gap-1 text-red-500">
            <Shield className="h-3 w-3" /> vs {competitor}
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-dashed">
        {(action === 'reply_email' || action === 'send_follow_up' || action === 'follow_up') && (
          <>
            <Button size="sm" className="h-8 text-xs gap-1.5 rounded-xl">
              <Send className="h-3 w-3" /> View Draft
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 rounded-xl">
              <Pencil className="h-3 w-3" /> Edit
            </Button>
          </>
        )}
        {action === 'schedule_demo' && (
          <Button size="sm" className="h-8 text-xs gap-1.5 rounded-xl">
            <Calendar className="h-3 w-3" /> Send Meeting Link
          </Button>
        )}
        {action === 'prep_training' && (
          <Button size="sm" className="h-8 text-xs gap-1.5 rounded-xl">
            <FileText className="h-3 w-3" /> Open Deal Room
          </Button>
        )}
        {!notification.read && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs gap-1.5 rounded-xl ml-auto"
            onClick={() => markRead.mutate(notification.id)}
          >
            <CheckCircle2 className="h-3 w-3" /> Done
          </Button>
        )}
      </div>
    </div>
  );
}

/* ── Alert Row (compact) ── */
function AlertRow({ notification }: { notification: AtlasNotification }) {
  const meta = notification.metadata || {};
  const daysStale = meta.days_stale as number | undefined;
  const contact = meta.contact as string | undefined;
  const risk = meta.risk as string | undefined;
  const cleanTitle = notification.title.replace(/^[^\w\s]*\s*/, '');

  return (
    <div className="flex items-center gap-4 py-3 border-b last:border-0">
      <AlertTriangle className={cn(
        'h-4 w-4 shrink-0',
        risk === 'high' ? 'text-red-500' : 'text-amber-500'
      )} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-foreground truncate">{cleanTitle}</p>
        {notification.body && (
          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{notification.body}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {daysStale && (
          <span className="text-[10px] text-red-500 font-medium flex items-center gap-1">
            <Clock className="h-3 w-3" /> {daysStale}d
          </span>
        )}
        {contact && (
          <span className="text-[10px] text-muted-foreground">{contact.split(',')[0]}</span>
        )}
        <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
      </div>
    </div>
  );
}

/* ── Info Row (minimal) ── */
function InfoRow({ notification }: { notification: AtlasNotification }) {
  const cleanTitle = notification.title.replace(/^[^\w\s]*\s*/, '');
  return (
    <div className="flex items-center gap-3 py-2.5 border-b last:border-0">
      <Eye className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
      <p className="text-[12px] text-muted-foreground flex-1">{cleanTitle}</p>
      <span className="text-[10px] text-muted-foreground/50">{relativeTime(notification.created_at)}</span>
    </div>
  );
}

/* ── Main Page ── */
export default function MorningBrief() {
  const { data: brief, isLoading: briefLoading } = useMorningBrief();
  const { selectedPipeline } = useAppContext();
  const { data: deals } = useDeals(selectedPipeline);
  const { data: tasks } = useTodaysTasks();
  const markAllRead = useMarkAllRead();

  if (briefLoading) {
    return (
      <div className="space-y-4 max-w-[860px] mx-auto">
        <Skeleton className="h-16 rounded-2xl" />
        <div className="grid grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}
        </div>
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  const allDeals = deals || [];
  const totalValue = allDeals.reduce((s, d) => s + (d.amount || 0), 0);
  const atRisk = allDeals.filter((d) => d.status === 'at_risk' || d.status === 'needs_attention').length;
  const pendingTasks = (tasks || []).length;
  const scanMeta = brief?.agentScan?.metadata as Record<string, unknown> | null;
  const meetingsToday = (brief?.header?.metadata?.meetings_count as number) || (scanMeta?.meetings_today as number) || 0;
  const noBrief = !brief?.header;

  const today = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dateStr = `${dayNames[today.getDay()]}, ${monthNames[today.getMonth()]} ${today.getDate()}`;

  return (
    <div className="max-w-[860px] mx-auto space-y-6">

      {/* ── Date Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{dateStr}</h1>
          {brief?.header && (
            <p className="text-[12px] text-muted-foreground mt-1">
              Scanned {relativeTime(brief.header.created_at)} — HubSpot, Gmail, Calendar, Supabase
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {brief?.header && (
            <Badge variant="outline" className="text-emerald-600 border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 text-[11px] gap-1">
              <CheckCircle2 className="h-3 w-3" /> Live
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7"
            onClick={() => markAllRead.mutate()}
          >
            Clear all
          </Button>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatPill value={formatCurrency(totalValue)} label="Pipeline" color="bg-blue-500" />
        <StatPill value={meetingsToday} label="Meetings today" color="bg-violet-500" />
        <StatPill value={allDeals.length} label="Active deals" color="bg-emerald-500" />
        <StatPill value={atRisk || pendingTasks} label="Needs attention" color="bg-amber-500" />
      </div>

      {/* ── No brief warning ── */}
      {noBrief && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 p-5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-sm font-medium text-foreground">No brief generated today</p>
              <p className="text-xs text-muted-foreground mt-0.5">Run the morning command from Claude to generate one, or wait for the 8am automated scan.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Focus: Critical & High Actions ── */}
      {(brief?.actions?.length ?? 0) > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-foreground" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Focus</h2>
            <Badge variant="secondary" className="text-[10px] ml-1">{brief!.actions.length}</Badge>
          </div>
          <div className="space-y-3">
            {brief!.actions.map((a, i) => (
              <FocusCard key={a.id} notification={a} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* ── Alerts ── */}
      {(brief?.dealAlerts?.length ?? 0) > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-foreground" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Alerts</h2>
          </div>
          <div className="rounded-2xl border bg-card px-5">
            {brief!.dealAlerts.map((a) => (
              <AlertRow key={a.id} notification={a} />
            ))}
          </div>
        </section>
      )}

      {/* ── Updates ── */}
      {(brief?.infoItems?.length ?? 0) > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Updates</h2>
          </div>
          <div className="rounded-2xl border bg-card px-5">
            {brief!.infoItems.map((a) => (
              <InfoRow key={a.id} notification={a} />
            ))}
          </div>
        </section>
      )}

      {/* ── Scan footer ── */}
      {brief?.agentScan && (
        <div className="text-center py-4">
          <p className="text-[11px] text-muted-foreground/50">
            ATLAS scan — {brief.agentScan.description} — {relativeTime(brief.agentScan.created_at)}
          </p>
        </div>
      )}
    </div>
  );
}

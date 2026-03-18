import { useMorningBrief } from '@/hooks/useMorningBrief';
import { useDeals } from '@/hooks/useDeals';
import { useTodaysTasks } from '@/hooks/useTasks';
import { useMarkNotificationRead } from '@/hooks/useNotifications';
import { useAppContext } from '@/contexts/AppContext';
import { MetricCard } from '@/components/MetricCard';
import { formatCurrency, formatDate, relativeTime } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Sun,
  Zap,
  AlertTriangle,
  Info,
  CheckCircle2,
  ExternalLink,
  BarChart3,
  Users,
  Mail,
  Calendar,
  Target,
  Clock,
  ArrowRight,
  DollarSign,
  Activity,
  Shield,
} from 'lucide-react';
import type { AtlasNotification } from '@/lib/types';

const PRIORITY_STYLES: Record<string, { border: string; bg: string; icon: React.ReactNode; label: string }> = {
  critical: {
    border: 'border-l-destructive',
    bg: 'bg-destructive/5',
    icon: <Zap className="h-4 w-4 text-destructive" />,
    label: 'CRITICAL',
  },
  high: {
    border: 'border-l-orange-500',
    bg: 'bg-orange-500/5',
    icon: <AlertTriangle className="h-4 w-4 text-orange-500" />,
    label: 'HIGH',
  },
  normal: {
    border: 'border-l-blue-500',
    bg: 'bg-blue-500/5',
    icon: <Info className="h-4 w-4 text-blue-500" />,
    label: 'NORMAL',
  },
  low: {
    border: 'border-l-muted-foreground/30',
    bg: 'bg-muted/30',
    icon: <Info className="h-4 w-4 text-muted-foreground" />,
    label: 'FYI',
  },
};

function ActionCard({ notification, index }: { notification: AtlasNotification; index: number }) {
  const markRead = useMarkNotificationRead();
  const style = PRIORITY_STYLES[notification.priority] || PRIORITY_STYLES.normal;
  const meta = notification.metadata || {};
  const dealName = meta.deal_name as string | undefined;
  const contact = meta.contact as string | undefined;
  const action = meta.action as string | undefined;

  return (
    <div
      className={cn(
        'rounded-xl border-l-4 border bg-card p-5 shadow-sm hover:shadow-md transition-all',
        style.border,
        !notification.read && style.bg
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-lg">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {style.icon}
            <Badge variant="outline" className="text-[10px]">{style.label}</Badge>
            {dealName && <Badge variant="secondary" className="text-[10px]">{dealName}</Badge>}
          </div>
          <h3 className="text-sm font-semibold text-foreground leading-snug">{notification.title.replace(/^[^\s]+\s/, '')}</h3>
          {notification.body && (
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{notification.body}</p>
          )}
          <div className="flex items-center gap-3 mt-3">
            {contact && (
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" /> {contact}
              </span>
            )}
            {action && (
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <ArrowRight className="h-3 w-3" /> {action.replace(/_/g, ' ')}
              </span>
            )}
          </div>
        </div>
        {!notification.read && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 shrink-0"
            onClick={() => markRead.mutate(notification.id)}
          >
            <CheckCircle2 className="h-3 w-3 mr-1" /> Done
          </Button>
        )}
      </div>
    </div>
  );
}

function AlertCard({ notification }: { notification: AtlasNotification }) {
  const style = PRIORITY_STYLES[notification.priority] || PRIORITY_STYLES.normal;
  const meta = notification.metadata || {};
  const daysStale = meta.days_stale as number | undefined;
  const risk = meta.risk as string | undefined;
  const contact = meta.contact as string | undefined;

  return (
    <div className={cn('rounded-lg border p-4 border-l-4', style.border)}>
      <div className="flex items-start gap-3">
        {style.icon}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{notification.title.replace(/^[^\s]+\s/, '')}</p>
          {notification.body && (
            <p className="text-xs text-muted-foreground mt-1">{notification.body}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            {daysStale && (
              <span className="text-[10px] text-destructive font-medium flex items-center gap-1">
                <Clock className="h-3 w-3" /> {daysStale} days stale
              </span>
            )}
            {contact && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" /> {contact}
              </span>
            )}
            {risk && (
              <Badge variant={risk === 'high' ? 'destructive' : 'secondary'} className="text-[10px]">
                {risk}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ notification }: { notification: AtlasNotification }) {
  return (
    <div className="rounded-lg border p-4 bg-muted/20">
      <div className="flex items-start gap-3">
        <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{notification.title.replace(/^[^\s]+\s/, '')}</p>
          {notification.body && (
            <p className="text-xs text-muted-foreground mt-1">{notification.body}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function SourcesBadge({ sources }: { sources: string[] }) {
  const sourceIcons: Record<string, React.ReactNode> = {
    hubspot: <Target className="h-3 w-3" />,
    gmail: <Mail className="h-3 w-3" />,
    calendar: <Calendar className="h-3 w-3" />,
    supabase: <Shield className="h-3 w-3" />,
  };

  return (
    <div className="flex items-center gap-2">
      {sources.map((s) => (
        <span
          key={s}
          className="inline-flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium"
        >
          {sourceIcons[s] || null} {s}
        </span>
      ))}
    </div>
  );
}

export default function MorningBrief() {
  const { data: brief, isLoading: briefLoading } = useMorningBrief();
  const { selectedPipeline } = useAppContext();
  const { data: deals } = useDeals(selectedPipeline);
  const { data: tasks } = useTodaysTasks();

  if (briefLoading) {
    return (
      <div className="space-y-6 max-w-[900px]">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
    );
  }

  const allDeals = deals || [];
  const totalValue = allDeals.reduce((s, d) => s + (d.amount || 0), 0);
  const atRisk = allDeals.filter((d) => d.status === 'at_risk' || d.status === 'needs_attention').length;
  const pendingTasks = (tasks || []).length;
  const scanMeta = brief?.agentScan?.metadata as Record<string, unknown> | null;
  const sourcesList = (scanMeta?.sources_scanned as string[]) || ['hubspot', 'gmail', 'calendar', 'supabase'];
  const meetingsToday = (brief?.header?.metadata?.meetings_count as number) || (scanMeta?.meetings_today as number) || 0;

  const noBrief = !brief?.header;

  return (
    <div className="space-y-6 max-w-[900px]">
      {/* ── Header ── */}
      <div className="rounded-xl border bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Sun className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Morning Brief</h1>
                <p className="text-xs text-muted-foreground">
                  {brief?.header
                    ? formatDate(brief.briefDate || new Date().toISOString())
                    : formatDate(new Date().toISOString())}
                  {brief?.header && (
                    <span className="ml-2 text-muted-foreground/60">
                      Generated {relativeTime(brief.header.created_at)}
                    </span>
                  )}
                </p>
              </div>
            </div>
            {!noBrief && <SourcesBadge sources={sourcesList} />}
          </div>
          {brief?.header && (
            <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Scan complete
            </Badge>
          )}
        </div>

        {noBrief && (
          <div className="mt-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
              No morning brief generated yet today. Run the morning command from Claude to generate one.
            </p>
          </div>
        )}
      </div>

      {/* ── Quick Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Pipeline"
          value={formatCurrency(totalValue)}
          icon={<DollarSign className="h-4 w-4" />}
          className="!p-4"
        />
        <MetricCard
          label="Active Deals"
          value={allDeals.length}
          icon={<BarChart3 className="h-4 w-4" />}
          className="!p-4"
        />
        <MetricCard
          label="Meetings Today"
          value={meetingsToday}
          icon={<Calendar className="h-4 w-4" />}
          className="!p-4"
        />
        <MetricCard
          label="Needs Attention"
          value={atRisk}
          subtitle={`${pendingTasks} tasks pending`}
          icon={<AlertTriangle className="h-4 w-4" />}
          className="!p-4"
        />
      </div>

      {/* ── TOP ACTIONS ── */}
      {(brief?.actions?.length ?? 0) > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Top Actions
              <Badge className="ml-1 text-xs">{brief!.actions.length}</Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Your highest-impact actions for today. Do these first.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {brief!.actions.map((a, i) => (
              <ActionCard key={a.id} notification={a} index={i} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── DEAL ALERTS ── */}
      {(brief?.dealAlerts?.length ?? 0) > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Deal Alerts
              <Badge variant="secondary" className="ml-1 text-xs">{brief!.dealAlerts.length}</Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Deals that need attention or have risk signals.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {brief!.dealAlerts.map((a) => (
              <AlertCard key={a.id} notification={a} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── INFO / FYI ── */}
      {(brief?.infoItems?.length ?? 0) > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" />
              Updates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {brief!.infoItems.map((a) => (
              <InfoCard key={a.id} notification={a} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Agent Scan Details ── */}
      {brief?.agentScan && (
        <div className="rounded-lg border bg-muted/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Scan Details</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{brief.agentScan.description}</p>
          <p className="text-[10px] text-muted-foreground/60 mt-2">
            {relativeTime(brief.agentScan.created_at)}
          </p>
        </div>
      )}
    </div>
  );
}

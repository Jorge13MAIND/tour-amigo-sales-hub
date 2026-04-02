import { useState } from 'react';
import { useMorningBrief } from '@/hooks/useMorningBrief';
import { useDeals } from '@/hooks/useDeals';
import { useTodaysTasks } from '@/hooks/useTasks';
import { useMarkNotificationRead, useMarkAllRead, useTodaysMeetingCount } from '@/hooks/useNotifications';
import { useAppContext } from '@/contexts/AppContext';
import { formatCurrency, relativeTime } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  Users,
  Clock,
  ChevronRight,
  Send,
  Pencil,
  X,
  Calendar,
  CircleDot,
  FileText,
  Sparkles,
} from 'lucide-react';
import type { AtlasNotification } from '@/lib/types';

/* ── Apple-style Focus Card ── */
function FocusCard({ notification, index }: { notification: AtlasNotification; index: number }) {
  const markRead = useMarkNotificationRead();
  const [draftOpen, setDraftOpen] = useState(false);
  const priority = notification.priority || 'normal';
  const meta = notification.metadata || {};
  const dealName = meta.deal_name as string | undefined;
  const contact = meta.contact as string | undefined;
  const competitor = meta.competitor as string | undefined;
  const action = meta.action as string | undefined;
  const draftTo = meta.to as string | undefined;
  const draftSubject = meta.subject as string | undefined;
  const draftBody = meta.body_preview as string | undefined;
  const draftId = meta.draft_id as string | undefined;
  const activityId = meta.activity_id as string | undefined;

  const cleanTitle = notification.title.replace(/^[^\w\s]*\s*(?:ACTION \d+:\s*)?/i, '');

  const gradientClass = priority === 'critical'
    ? 'from-red-500 to-orange-500'
    : priority === 'high'
    ? 'from-amber-500 to-yellow-400'
    : 'from-blue-500 to-cyan-400';

  const tagClass = priority === 'critical'
    ? 'bg-red-500/10 text-red-600 dark:text-red-400'
    : priority === 'high'
    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
    : 'bg-blue-500/10 text-blue-600 dark:text-blue-400';

  return (
    <div
      className={cn(
        'relative bg-card rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer',
        'shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]',
        'hover:shadow-[0_4px_16px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)]',
        'hover:-translate-y-[1px]',
        notification.read && 'opacity-50'
      )}
    >
      {/* Gradient top bar */}
      <div className={cn('h-[3px] w-full bg-gradient-to-r', gradientClass)} />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={cn('text-[11px] font-semibold px-2.5 py-1 rounded-full', tagClass)}>
              {priority === 'critical' ? 'Critical' : priority === 'high' ? 'High' : 'Normal'}
            </span>
            {action && (
              <span className="text-[11px] text-muted-foreground font-medium">
                {action.replace(/_/g, ' ')}
              </span>
            )}
          </div>
          {!notification.read && (
            <button
              className="text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              onClick={(e) => { e.stopPropagation(); markRead.mutate(notification.id); }}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Title — large Apple style */}
        <h3 className="text-[19px] font-bold tracking-tight leading-snug mb-1">{cleanTitle}</h3>

        {/* Deal link */}
        {dealName && (
          <p className="text-[14px] font-medium text-primary mb-2.5">
            {dealName}
            {competitor && <span className="text-muted-foreground font-normal"> vs {competitor}</span>}
          </p>
        )}

        {/* Context */}
        {notification.body && (
          <p className="text-[14px] text-muted-foreground leading-relaxed">{notification.body}</p>
        )}

        {/* Draft preview (inline) */}
        {(action === 'reply_email' || action === 'send_follow_up' || action === 'follow_up') && (
          <div className="mt-4 bg-muted/50 rounded-xl p-4">
            <p className="text-[12px] text-muted-foreground/60 mb-0.5">
              To: {draftTo || contact || 'Contact'}
            </p>
            <p className="text-[13px] font-semibold text-foreground mb-2">
              {draftSubject || `RE: Tour Amigo ${dealName ? `for ${dealName}` : ''}`}
            </p>
            {draftOpen && draftBody ? (
              <div className="text-[13px] text-foreground leading-relaxed whitespace-pre-wrap border-t border-border/50 pt-3 mt-2">
                {draftBody}
              </div>
            ) : draftBody ? (
              <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-2">
                {draftBody}
              </p>
            ) : (
              <p className="text-[13px] text-muted-foreground leading-relaxed italic">
                Draft ready for review.
              </p>
            )}
          </div>
        )}

        {/* Footer: meta + actions */}
        <div className="flex items-center justify-between mt-5">
          <div className="flex items-center gap-3 text-[12px] text-muted-foreground/60">
            {contact && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" /> {contact}
              </span>
            )}
            <span className="flex items-center gap-1">
              <CircleDot className="h-3 w-3" /> Live data
            </span>
          </div>

          <div className="flex items-center gap-2">
            {(action === 'reply_email' || action === 'send_follow_up' || action === 'follow_up') && (
              <>
                <button
                  className="px-4 py-2 rounded-full text-[13px] font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-1.5"
                  onClick={(e) => { e.stopPropagation(); setDraftOpen(!draftOpen); }}
                >
                  <Send className="h-3.5 w-3.5" /> {draftOpen ? 'Collapse' : 'View Draft'}
                </button>
                {draftId && (
                  <a
                    href={`https://mail.google.com/mail/u/0/#drafts/${draftId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-full text-[13px] font-semibold bg-muted text-foreground hover:bg-muted/80 transition-colors flex items-center gap-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit in Gmail
                  </a>
                )}
              </>
            )}
            {action === 'schedule_demo' && (
              <button className="px-4 py-2 rounded-full text-[13px] font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Send Link
              </button>
            )}
            {action === 'prep_training' && (
              <button className="px-4 py-2 rounded-full text-[13px] font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Deal Room
              </button>
            )}
            {!notification.read && (
              <button
                className="px-4 py-2 rounded-full text-[13px] font-medium text-muted-foreground/60 hover:text-foreground transition-colors flex items-center gap-1.5"
                onClick={(e) => { e.stopPropagation(); markRead.mutate(notification.id); }}
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Intel Card (for alerts — Apple Card style) ── */
function IntelCard({ notification }: { notification: AtlasNotification }) {
  const meta = notification.metadata || {};
  const daysStale = meta.days_stale as number | undefined;
  const contact = meta.contact as string | undefined;
  const risk = meta.risk as string | undefined;
  const cleanTitle = notification.title.replace(/^[^\w\s]*\s*/, '');

  return (
    <div className={cn(
      'bg-card rounded-2xl p-5 transition-all duration-200 cursor-pointer',
      'shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]',
      'hover:shadow-[0_4px_16px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)]',
      'hover:-translate-y-[1px]',
    )}>
      <h4 className="text-[14px] font-bold tracking-tight leading-snug mb-1.5">{cleanTitle}</h4>
      {notification.body && (
        <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-2">{notification.body}</p>
      )}
      <div className="flex items-center gap-3 mt-3 text-[11px] text-muted-foreground/60">
        {daysStale && (
          <span className={cn('flex items-center gap-1 font-medium', risk === 'high' ? 'text-red-500' : 'text-amber-500')}>
            <Clock className="h-3 w-3" /> {daysStale} days
          </span>
        )}
        {contact && (
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" /> {contact.split(',')[0]}
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Quick Item (for info/updates) ── */
function QuickItem({ notification }: { notification: AtlasNotification }) {
  const cleanTitle = notification.title.replace(/^[^\w\s]*\s*/, '');
  return (
    <div className={cn(
      'flex items-center justify-between bg-card rounded-xl px-5 py-3.5 cursor-pointer transition-all duration-200',
      'shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]',
      'hover:shadow-[0_4px_16px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)]',
    )}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
        <p className="text-[13px] text-foreground truncate">{cleanTitle}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[11px] text-muted-foreground/50">{relativeTime(notification.created_at)}</span>
        <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function MorningBrief() {
  const { data: brief, isLoading: briefLoading } = useMorningBrief();
  const { selectedPipeline, setIsChatOpen } = useAppContext();
  const { data: deals } = useDeals(selectedPipeline);
  const { data: tasks } = useTodaysTasks();
  const { data: calendarMeetingCount } = useTodaysMeetingCount();
  const markAllRead = useMarkAllRead();

  if (briefLoading) {
    return (
      <div className="space-y-4 max-w-[960px] mx-auto">
        <Skeleton className="h-16 rounded-2xl" />
        <div className="grid grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-[72px] rounded-2xl" />)}
        </div>
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  const allDeals = deals || [];
  const totalValue = allDeals.reduce((s, d) => s + (d.amount || 0), 0);
  const atRisk = allDeals.filter((d) => d.status === 'at_risk' || d.status === 'needs_attention').length;
  const pendingTasks = (tasks || []).length;
  const scanMeta = brief?.agentScan?.metadata as Record<string, unknown> | null;
  const meetingsToday = calendarMeetingCount || (brief?.header?.metadata?.meetings_count as number) || (scanMeta?.meetings_today as number) || 0;
  const noBrief = !brief?.header;

  const today = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="max-w-[960px] mx-auto">

      {/* ── Hero Greeting ── */}
      <div className="pt-4 pb-6">
        <h1 className="text-[32px] font-bold tracking-tight leading-none">{greeting}, Jorge.</h1>
        <p className="text-[17px] text-muted-foreground mt-1.5">
          {dayNames[today.getDay()]}, {monthNames[today.getMonth()]} {today.getDate()}
          {brief?.header && (
            <span className="text-muted-foreground/50"> — scanned {relativeTime(brief.header.created_at)}</span>
          )}
        </p>
      </div>

      {/* ── Spotlight Command Bar ── */}
      <div
        className={cn(
          'bg-card border rounded-[14px] px-5 py-3.5 flex items-center gap-3 mb-8 cursor-pointer',
          'shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]',
          'hover:shadow-[0_4px_16px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)]',
          'transition-all duration-200',
        )}
        onClick={() => setIsChatOpen(true)}
      >
        <Sparkles className="h-[18px] w-[18px] text-muted-foreground/40" />
        <span className="text-[16px] text-muted-foreground/40 flex-1">Ask Atlas anything...</span>
        <span className="text-[12px] text-muted-foreground/30 bg-muted px-2 py-0.5 rounded-md font-medium">
          Cmd+K
        </span>
      </div>

      {/* ── Stats Row ── */}
      <div className="flex gap-3 mb-9 overflow-x-auto pb-1">
        {[
          { value: formatCurrency(totalValue), label: 'Pipeline', color: 'bg-blue-500' },
          { value: meetingsToday, label: 'Meetings today', color: 'bg-violet-500' },
          { value: allDeals.length, label: 'Active deals', color: 'bg-emerald-500' },
          { value: atRisk + pendingTasks, label: 'Needs attention', color: 'bg-amber-500' },
        ].map((stat) => (
          <div key={stat.label} className="flex items-center gap-2.5 bg-card rounded-[14px] px-5 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)] shrink-0">
            <div className={cn('w-2.5 h-2.5 rounded-full', stat.color)} />
            <div>
              <div className="text-[20px] font-bold tracking-tight leading-none">{stat.value}</div>
              <div className="text-[12px] text-muted-foreground mt-0.5">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── No brief warning ── */}
      {noBrief && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 mb-8">
          <p className="text-[14px] font-medium text-foreground">No brief generated today</p>
          <p className="text-[13px] text-muted-foreground mt-1">Run the morning command from Claude or wait for the 8am automated scan.</p>
        </div>
      )}

      {/* ── FOCUS: Now ── */}
      {(brief?.actions?.length ?? 0) > 0 && (
        <section className="mb-10">
          <h2 className="text-[22px] font-bold tracking-tight mb-4">Now</h2>
          <div className="space-y-4">
            {brief!.actions.map((a, i) => (
              <FocusCard key={a.id} notification={a} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* ── INTEL: Alerts as grid ── */}
      {(brief?.dealAlerts?.length ?? 0) > 0 && (
        <section className="mb-10">
          <h2 className="text-[22px] font-bold tracking-tight mb-4">Intel</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {brief!.dealAlerts.map((a) => (
              <IntelCard key={a.id} notification={a} />
            ))}
          </div>
        </section>
      )}

      {/* ── UPDATES: Quick list ── */}
      {(brief?.infoItems?.length ?? 0) > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[22px] font-bold tracking-tight">Updates</h2>
            <button
              className="text-[13px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              onClick={() => markAllRead.mutate()}
            >
              Clear all
            </button>
          </div>
          <div className="space-y-2">
            {brief!.infoItems.map((a) => (
              <QuickItem key={a.id} notification={a} />
            ))}
          </div>
        </section>
      )}

      {/* ── Scan footer ── */}
      {brief?.agentScan && (
        <div className="text-center py-8">
          <p className="text-[11px] text-muted-foreground/30 tracking-wide">
            ATLAS v3.0 — {relativeTime(brief.agentScan.created_at)}
          </p>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useOutreachContacts, type OutreachFilters } from '@/hooks/useOutreachContacts';
import { useOutreachStats } from '@/hooks/useOutreachContacts';
import { useLatestOutreachMetric } from '@/hooks/useOutreachMetrics';
import { MetricCard } from '@/components/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { relativeTime } from '@/lib/format';
import { Send, Eye, MessageSquare, ThumbsUp, ChevronDown, ChevronUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { OutreachContact } from '@/lib/types';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-muted text-muted-foreground',
  researched: 'bg-muted text-muted-foreground',
  enrolled: 'bg-orange-500/15 text-orange-700 dark:text-orange-400',
  replied: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  bounced: 'bg-destructive/15 text-destructive',
  skipped: 'bg-muted text-muted-foreground',
  converted: 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-400',
};

const TIER_COLORS: Record<string, string> = {
  tier_1: 'bg-destructive/15 text-destructive font-bold',
  tier_2: 'bg-orange-500/15 text-orange-700 dark:text-orange-400',
  tier_3: 'bg-muted text-muted-foreground',
};

const FUNNEL_COLORS = ['#94a3b8', '#f97316', '#3b82f6', '#22c55e', '#10b981'];
const FUNNEL_STAGES = ['researched', 'enrolled', 'replied', 'converted'];

export default function Outreach() {
  const [filters, setFilters] = useState<OutreachFilters>({ page: 1, pageSize: 25 });
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const { data: contactsData, isLoading } = useOutreachContacts(filters);
  const { data: stats } = useOutreachStats();
  const { data: latestMetric } = useLatestOutreachMetric();

  const contacts = contactsData?.contacts || [];
  const total = contactsData?.total || 0;
  const totalPages = Math.ceil(total / (filters.pageSize || 25));

  // Funnel data
  const funnelData = FUNNEL_STAGES.map((stage) => ({
    name: stage.charAt(0).toUpperCase() + stage.slice(1),
    value: stats?.totalByStatus[stage] || 0,
  }));

  // Angle data from latest metric
  const angleData = latestMetric?.by_email_angle
    ? Object.entries(latestMetric.by_email_angle as Record<string, { reply_rate?: number; count?: number }>)
        .map(([angle, data]) => ({
          name: angle.replace(/_/g, ' '),
          replyRate: (data.reply_rate ?? 0) * 100,
          count: data.count ?? 0,
        }))
        .sort((a, b) => b.replyRate - a.replyRate)
    : [];

  if (isLoading) {
    return (
      <div className="space-y-5 max-w-[1400px]">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Sent Today"
          value={stats?.todaySent ?? 0}
          subtitle={
            <div className="space-y-1 mt-1">
              <span className="text-[10px]">of 50 daily target</span>
              <Progress value={Math.min(((stats?.todaySent ?? 0) / 50) * 100, 100)} className="h-1.5" />
            </div>
          }
          icon={<Send className="h-4 w-4 text-orange-500" />}
        />
        <MetricCard
          label="Open Rate"
          value={latestMetric?.open_rate != null ? `${(latestMetric.open_rate * 100).toFixed(1)}%` : '—'}
          subtitle="last 7 days"
          icon={<Eye className="h-4 w-4 text-blue-500" />}
        />
        <MetricCard
          label="Reply Rate"
          value={latestMetric?.reply_rate != null ? `${(latestMetric.reply_rate * 100).toFixed(1)}%` : '—'}
          subtitle="last 7 days"
          icon={<MessageSquare className="h-4 w-4 text-emerald-500" />}
        />
        <MetricCard
          label="Positive Replies"
          value={stats?.weekPositive ?? 0}
          subtitle="this week"
          icon={<ThumbsUp className="h-4 w-4 text-emerald-600" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Outreach Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={funnelData} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={90} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {funnelData.map((_, i) => (
                    <Cell key={i} fill={FUNNEL_COLORS[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Reply Rate by Angle</CardTitle>
          </CardHeader>
          <CardContent>
            {angleData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={angleData} margin={{ left: 10 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 10 }} unit="%" />
                  <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                  <Bar dataKey="replyRate" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">No angle data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={filters.status || 'all'} onValueChange={v => setFilters(f => ({ ...f, status: v, page: 1 }))}>
          <SelectTrigger className="w-[140px] h-9 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {['pending', 'researched', 'enrolled', 'replied', 'bounced', 'skipped', 'converted'].map(s => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.tier || 'all'} onValueChange={v => setFilters(f => ({ ...f, tier: v, page: 1 }))}>
          <SelectTrigger className="w-[120px] h-9 text-sm"><SelectValue placeholder="Tier" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="tier_1">Tier 1</SelectItem>
            <SelectItem value="tier_2">Tier 2</SelectItem>
            <SelectItem value="tier_3">Tier 3</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">{total} contacts</span>
      </div>

      {/* Contacts Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground text-xs">
                  <th className="p-3 font-medium">Name</th>
                  <th className="p-3 font-medium">Company</th>
                  <th className="p-3 font-medium">Tier</th>
                  <th className="p-3 font-medium">ICP</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Angle</th>
                  <th className="p-3 font-medium">Sent</th>
                  <th className="p-3 font-medium w-8" />
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => (
                  <ContactRow key={c.id} contact={c} expanded={expandedRow === c.id} onToggle={() => setExpandedRow(expandedRow === c.id ? null : c.id)} />
                ))}
                {contacts.length === 0 && (
                  <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No contacts found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={filters.page === 1} onClick={() => setFilters(f => ({ ...f, page: (f.page || 1) - 1 }))}>Previous</Button>
          <span className="text-sm text-muted-foreground self-center">Page {filters.page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={filters.page === totalPages} onClick={() => setFilters(f => ({ ...f, page: (f.page || 1) + 1 }))}>Next</Button>
        </div>
      )}
    </div>
  );
}

function ContactRow({ contact: c, expanded, onToggle }: { contact: OutreachContact; expanded: boolean; onToggle: () => void }) {
  const name = [c.first_name, c.last_name].filter(Boolean).join(' ') || c.email;

  return (
    <>
      <tr className="border-b border-border hover:bg-muted/30 cursor-pointer transition-colors" onClick={onToggle}>
        <td className="p-3 font-medium text-foreground">{name}</td>
        <td className="p-3 text-muted-foreground">{c.company || '—'}</td>
        <td className="p-3">{c.tier ? <Badge variant="secondary" className={TIER_COLORS[c.tier]}>{c.tier.replace('_', ' ')}</Badge> : '—'}</td>
        <td className="p-3 font-mono text-xs">{c.icp_score}</td>
        <td className="p-3"><Badge variant="secondary" className={STATUS_COLORS[c.status] || ''}>{c.status}</Badge></td>
        <td className="p-3 text-xs text-muted-foreground capitalize">{c.email_angle?.replace(/_/g, ' ') || '—'}</td>
        <td className="p-3 text-xs text-muted-foreground">{c.email_sent_at ? relativeTime(c.email_sent_at) : '—'}</td>
        <td className="p-3">{expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}</td>
      </tr>
      {expanded && (
        <tr className="bg-muted/20">
          <td colSpan={8} className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-2">
                <p className="font-semibold text-foreground text-sm">Contact Details</p>
                <p><span className="text-muted-foreground">Email:</span> {c.email}</p>
                {c.title && <p><span className="text-muted-foreground">Title:</span> {c.title}</p>}
                {c.subject_line_text && <p><span className="text-muted-foreground">Subject:</span> {c.subject_line_text}</p>}
                {c.skip_reason && <p><span className="text-muted-foreground">Skip reason:</span> {c.skip_reason}</p>}
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-foreground text-sm">Timeline</p>
                {c.email_sent_at && <p>📤 Sent {relativeTime(c.email_sent_at)}</p>}
                {c.opened_at && <p>👁️ Opened {relativeTime(c.opened_at)}</p>}
                {c.clicked_at && <p>🔗 Clicked {relativeTime(c.clicked_at)}</p>}
                {c.replied_at && <p>💬 Replied {relativeTime(c.replied_at)} {c.reply_sentiment && <Badge variant="secondary" className={c.reply_sentiment === 'positive' ? 'bg-emerald-500/15 text-emerald-700' : 'bg-destructive/15 text-destructive'}>{c.reply_sentiment}</Badge>}</p>}
                {c.bounced && <p>❌ Bounced</p>}
                {c.meeting_booked && <p>📅 Meeting booked</p>}
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-foreground text-sm">Research Data</p>
                {Object.entries(c.research_data || {}).length > 0 ? (
                  Object.entries(c.research_data).map(([k, v]) => (
                    <p key={k}><span className="text-muted-foreground capitalize">{k.replace(/_/g, ' ')}:</span> {String(v)}</p>
                  ))
                ) : (
                  <p className="text-muted-foreground">No research data</p>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

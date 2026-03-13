import type { DealStakeholder } from '@/lib/types';
import { relativeTime } from '@/lib/relativeTime';
import { useState } from 'react';
import { Star, DollarSign, Wrench, Shield, Megaphone, User, Crown } from 'lucide-react';

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  champion: { icon: <Star className="h-3 w-3" />, color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400', label: 'Champion' },
  economic_buyer: { icon: <DollarSign className="h-3 w-3" />, color: 'bg-purple-500/15 text-purple-700 dark:text-purple-400', label: 'Economic Buyer' },
  technical_buyer: { icon: <Wrench className="h-3 w-3" />, color: 'bg-blue-500/15 text-blue-700 dark:text-blue-400', label: 'Technical Buyer' },
  blocker: { icon: <Shield className="h-3 w-3" />, color: 'bg-destructive/15 text-destructive', label: 'Blocker' },
  influencer: { icon: <Megaphone className="h-3 w-3" />, color: 'bg-amber-500/15 text-amber-700 dark:text-amber-400', label: 'Influencer' },
  user: { icon: <User className="h-3 w-3" />, color: 'bg-muted text-muted-foreground', label: 'User' },
  executive: { icon: <Crown className="h-3 w-3" />, color: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400', label: 'Executive' },
};

const SENTIMENT_EMOJI: Record<string, string> = { positive: '😊', neutral: '😐', negative: '😟', unknown: '❓' };

const ENGAGEMENT_COLOR = (score: number) => {
  if (score >= 4) return 'bg-emerald-500';
  if (score === 3) return 'bg-amber-500';
  if (score === 2) return 'bg-orange-500';
  if (score === 1) return 'bg-destructive';
  return 'bg-muted-foreground/30';
};

interface Props {
  stakeholders: DealStakeholder[];
}

export function StakeholderCards({ stakeholders }: Props) {
  if (!stakeholders.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <User className="h-10 w-10 mb-3 opacity-40" />
        <p className="text-sm">No stakeholders mapped yet.</p>
        <p className="text-xs mt-1">ATLAS agents automatically detect stakeholders from emails and meetings.</p>
      </div>
    );
  }

  const champion = stakeholders.find((s) => s.stakeholder_type === 'champion');
  const economicBuyer = stakeholders.find((s) => s.stakeholder_type === 'economic_buyer');
  const avgEngagement = (stakeholders.reduce((s, st) => s + st.engagement_score, 0) / stakeholders.length).toFixed(1);

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        {stakeholders.length} stakeholder{stakeholders.length > 1 ? 's' : ''}
        {champion && <> · Champion: <span className="text-foreground font-medium">{champion.name}</span></>}
        {economicBuyer && <> · Economic Buyer: <span className="text-foreground font-medium">{economicBuyer.name}</span></>}
        <> · Avg engagement: <span className="text-foreground font-medium">{avgEngagement}/5</span></>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {stakeholders.map((s) => <StakeholderCard key={s.id} stakeholder={s} />)}
      </div>
    </div>
  );
}

function StakeholderCard({ stakeholder: s }: { stakeholder: DealStakeholder }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = TYPE_CONFIG[s.stakeholder_type] || TYPE_CONFIG.user;
  const lastDays = s.last_interaction ? Math.floor((Date.now() - new Date(s.last_interaction).getTime()) / 86400000) : null;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-foreground">{s.name}</p>
          <p className="text-xs text-muted-foreground">{s.role || s.title}</p>
        </div>
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold rounded-full px-2 py-0.5 ${cfg.color}`}>
          {cfg.icon} {cfg.label}
        </span>
      </div>

      {s.email && (
        <a href={`mailto:${s.email}`} className="text-xs text-primary hover:underline block truncate">{s.email}</a>
      )}

      <div className="flex items-center gap-3 text-xs">
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">Engagement:</span>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={`h-2 w-2 rounded-full ${i <= s.engagement_score ? ENGAGEMENT_COLOR(s.engagement_score) : 'bg-muted'}`} />
            ))}
          </div>
          <span className="text-muted-foreground">{s.engagement_score}/5</span>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>{SENTIMENT_EMOJI[s.sentiment]} {s.sentiment}</span>
        <span className={lastDays !== null && lastDays > 14 ? 'text-destructive' : ''}>
          Last: {s.last_interaction ? relativeTime(s.last_interaction) : 'Never'}
        </span>
        <span>{s.interaction_count} interactions</span>
      </div>

      {s.notes && (
        <div>
          <p className={`text-xs text-muted-foreground ${!expanded ? 'line-clamp-2' : ''}`}>{s.notes}</p>
          {s.notes.length > 100 && (
            <button onClick={() => setExpanded(!expanded)} className="text-xs text-primary mt-0.5">{expanded ? 'Show less' : 'Show more'}</button>
          )}
        </div>
      )}
    </div>
  );
}

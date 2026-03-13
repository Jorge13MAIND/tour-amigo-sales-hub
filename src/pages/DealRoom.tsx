import { useParams, Link } from 'react-router-dom';
import { useDealRoom, useDealStakeholders, useDealRoomFeed, useDealDocuments } from '@/hooks/useDealRooms';
import { ClosePlanTimeline } from '@/components/deal-room/ClosePlanTimeline';
import { StakeholderCards } from '@/components/deal-room/StakeholderCards';
import { ActivityFeed } from '@/components/deal-room/ActivityFeed';
import { RiskTracker } from '@/components/deal-room/RiskTracker';
import { CompetitiveIntel } from '@/components/deal-room/CompetitiveIntel';
import { DocumentList } from '@/components/deal-room/DocumentList';
import { MomentumBadge } from '@/components/deal-room/MomentumBadge';
import { formatCurrency } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, DollarSign, Target, Users, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import type { Deal } from '@/lib/types';

const TABS = ['Close Plan', 'Stakeholders', 'Activity', 'Risks', 'Intel', 'Docs'] as const;
type Tab = typeof TABS[number];

export default function DealRoom() {
  const { id } = useParams<{ id: string }>();
  const { data: room, isLoading } = useDealRoom(id);
  const { data: stakeholders } = useDealStakeholders(room?.deal_id);
  const { data: feed } = useDealRoomFeed(room?.deal_id);
  const { data: documents } = useDealDocuments(room?.deal_id);
  const [activeTab, setActiveTab] = useState<Tab>('Close Plan');

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-[1200px]">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-sm">Deal room not found.</p>
        <Link to="/deal-rooms" className="text-primary text-sm mt-2 hover:underline">← Back to Deal Rooms</Link>
      </div>
    );
  }

  const deal = room.deals as Deal | undefined;
  const riskScore = deal?.risk_score ?? 0;
  const riskColor = riskScore <= 3 ? 'text-emerald-600 dark:text-emerald-400' : riskScore <= 6 ? 'text-amber-600 dark:text-amber-400' : 'text-destructive';
  const riskLabel = riskScore <= 3 ? 'Low' : riskScore <= 6 ? 'Medium' : 'High';
  const probColor = (room.close_probability || 0) > 60 ? 'text-emerald-600 dark:text-emerald-400' : (room.close_probability || 0) > 30 ? 'text-amber-600 dark:text-amber-400' : 'text-destructive';

  const TYPE_COLORS: Record<string, string> = {
    enterprise: 'bg-purple-500/15 text-purple-700 dark:text-purple-400',
    mid_market: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
    standard: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="space-y-5 max-w-[1200px]">
      {/* Header */}
      <div className="space-y-4">
        <Link to="/deal-rooms" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Deal Rooms
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{room.deal_name}</h1>
              <span className={`text-[10px] font-bold rounded-full px-2.5 py-0.5 uppercase ${TYPE_COLORS[room.room_type] || TYPE_COLORS.standard}`}>
                {room.room_type.replace('_', '-')}
              </span>
              <MomentumBadge status={room.status} closePlan={room.close_plan || []} />
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {deal?.deal_stage_label} → Close by {room.target_close_date ? new Date(room.target_close_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}
            </p>
          </div>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <DollarSign className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{room.total_contract_value ? formatCurrency(room.total_contract_value) : '—'}</p>
            <p className="text-[10px] text-muted-foreground uppercase">TCV</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <Target className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
            <p className={`text-xl font-bold ${probColor}`}>{room.close_probability ?? '—'}%</p>
            <p className="text-[10px] text-muted-foreground uppercase">Probability</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <Users className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{deal?.number_of_users || '—'}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Users</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <AlertTriangle className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
            <p className={`text-xl font-bold ${riskColor}`}>{riskScore}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Risk · {riskLabel}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="min-h-[400px]">
        {activeTab === 'Close Plan' && <ClosePlanTimeline steps={room.close_plan || []} targetCloseDate={room.target_close_date} />}
        {activeTab === 'Stakeholders' && <StakeholderCards stakeholders={stakeholders || []} />}
        {activeTab === 'Activity' && <ActivityFeed feed={feed || []} />}
        {activeTab === 'Risks' && <RiskTracker risks={room.risks || []} />}
        {activeTab === 'Intel' && <CompetitiveIntel intel={room.competitive_intel} keyMetrics={room.key_metrics} pricingDetails={room.pricing_details} />}
        {activeTab === 'Docs' && <DocumentList documents={documents || []} />}
      </div>
    </div>
  );
}

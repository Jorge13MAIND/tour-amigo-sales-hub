import { useAppContext } from '@/contexts/AppContext';
import { useDeals } from '@/hooks/useDeals';
import { useTodaysTasks, useUpcomingTasks, useOverdueTaskCount } from '@/hooks/useTasks';
import { MetricCard } from '@/components/MetricCard';
import { PipelineFunnel } from '@/components/PipelineFunnel';
import { DealsAttentionTable } from '@/components/DealsAttentionTable';
import { TodaysTasks } from '@/components/TodaysTasks';
import { UpcomingTasks } from '@/components/UpcomingTasks';
import { StaleDealBanner } from '@/components/StaleDealBanner';
import { AgentPulseWidget } from '@/components/widgets/AgentPulseWidget';
import { FollowUpWidget } from '@/components/widgets/FollowUpWidget';
import { OutreachWidget } from '@/components/widgets/OutreachWidget';
import { AgentHealthWidget } from '@/components/widgets/AgentHealthWidget';
import { DealRoomsWidget } from '@/components/widgets/DealRoomsWidget';
import { formatCurrency } from '@/lib/format';
import { computeHealthScore } from '@/lib/healthScore';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, BarChart3, AlertTriangle, Activity } from 'lucide-react';

export default function Dashboard() {
  const { selectedPipeline } = useAppContext();
  const { data: deals, isLoading } = useDeals(selectedPipeline);
  const { data: tasks } = useTodaysTasks();
  const { data: upcomingTasks } = useUpcomingTasks();
  const { data: overdueCount } = useOverdueTaskCount();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  const allDeals = deals || [];
  const totalValue = allDeals.reduce((s, d) => s + (d.amount || 0), 0);
  const unquantified = allDeals.filter((d) => !d.has_amount).length;
  const needsAttention = allDeals.filter((d) => d.status === 'needs_attention' || d.status === 'at_risk').length;
  const healthScore = computeHealthScore(allDeals);
  const healthColor = healthScore >= 70 ? 'text-risk-low' : healthScore >= 40 ? 'text-risk-medium' : 'text-destructive';

  return (
    <div className="space-y-5 max-w-[1400px]">
      <StaleDealBanner deals={allDeals} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Pipeline Value"
          value={formatCurrency(totalValue)}
          subtitle={unquantified > 0 ? `${unquantified} deal${unquantified > 1 ? 's' : ''} unquantified` : undefined}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <MetricCard label="Active Deals" value={allDeals.length} icon={<BarChart3 className="h-4 w-4" />} />
        <MetricCard label="Needs Attention" value={needsAttention} icon={<AlertTriangle className="h-4 w-4" />} />
        <MetricCard
          label="Pipeline Health"
          value={<span className={healthColor}>{healthScore}</span>}
          subtitle="Score 0–100"
          icon={<Activity className="h-4 w-4" />}
        />
      </div>

      <PipelineFunnel deals={allDeals} />

      {/* ATLAS Engine Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <AgentPulseWidget />
        <FollowUpWidget />
        <OutreachWidget />
        <AgentHealthWidget />
        <DealRoomsWidget />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <DealsAttentionTable deals={allDeals} />
        </div>
        <div className="space-y-5">
          <TodaysTasks tasks={tasks || []} overdueCount={overdueCount || 0} />
          <UpcomingTasks tasks={upcomingTasks || []} />
        </div>
      </div>
    </div>
  );
}

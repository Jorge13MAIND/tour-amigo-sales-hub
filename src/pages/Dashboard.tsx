import { useAppContext } from '@/contexts/AppContext';
import { useDeals } from '@/hooks/useDeals';
import { useTodaysTasks } from '@/hooks/useTasks';
import { MetricCard } from '@/components/MetricCard';
import { PipelineFunnel } from '@/components/PipelineFunnel';
import { DealsAttentionTable } from '@/components/DealsAttentionTable';
import { TodaysTasks } from '@/components/TodaysTasks';
import { formatCurrency } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { selectedPipeline } = useAppContext();
  const { data: deals, isLoading } = useDeals(selectedPipeline);
  const { data: tasks } = useTodaysTasks();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  const allDeals = deals || [];
  const totalValue = allDeals.reduce((s, d) => s + (d.amount || 0), 0);
  const unquantified = allDeals.filter((d) => d.amount === null).length;
  const needsAttention = allDeals.filter((d) => d.status === 'needs_attention' || d.status === 'at_risk').length;
  const avgRisk = allDeals.length > 0
    ? (allDeals.reduce((s, d) => s + d.risk_score, 0) / allDeals.length).toFixed(1)
    : '0';

  return (
    <div className="space-y-4 max-w-[1400px]">
      <div className="grid grid-cols-4 gap-3">
        <MetricCard
          label="Pipeline Value"
          value={formatCurrency(totalValue)}
          subtitle={unquantified > 0 ? `${unquantified} deal${unquantified > 1 ? 's' : ''} unquantified` : undefined}
        />
        <MetricCard label="Active Deals" value={allDeals.length} />
        <MetricCard label="Needs Attention" value={needsAttention} />
        <MetricCard label="Avg Risk Score" value={avgRisk} />
      </div>

      <PipelineFunnel deals={allDeals} />

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <DealsAttentionTable deals={allDeals} />
        </div>
        <div>
          <TodaysTasks tasks={tasks || []} />
        </div>
      </div>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useDeals } from '@/hooks/useDeals';
import { RiskBadge } from '@/components/RiskBadge';
import { formatCurrency, daysSince } from '@/lib/format';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { Deal } from '@/lib/types';
import { STAGE_COLORS } from '@/lib/types';

const KNOWN_STAGES = ['Demo Scheduled', 'Additional Demo', 'Demo Completed', 'Proposal Sent', 'Negotiation'];

export default function Pipeline() {
  const { selectedPipeline, setSelectedDealId } = useAppContext();
  const { data: deals, isLoading } = useDeals(selectedPipeline);
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [amountFilter, setAmountFilter] = useState('all');
  const [competitorFilter, setCompetitorFilter] = useState('all');

  const filteredDeals = useMemo(() => {
    if (!deals) return [];
    return deals.filter((d) => {
      if (priorityFilter !== 'all' && d.priority?.toLowerCase() !== priorityFilter) return false;
      if (amountFilter === 'yes' && d.amount === null) return false;
      if (amountFilter === 'no' && d.amount !== null) return false;
      if (competitorFilter === 'yes' && !d.competitor) return false;
      if (competitorFilter === 'no' && d.competitor) return false;
      return true;
    });
  }, [deals, priorityFilter, amountFilter, competitorFilter]);

  // Determine columns from data
  const columns = useMemo(() => {
    const stageSet = new Set<string>();
    (deals || []).forEach((d) => stageSet.add(d.deal_stage_label));
    // Use known order for default pipeline, else use whatever is in data
    const ordered = KNOWN_STAGES.filter((s) => stageSet.has(s));
    stageSet.forEach((s) => { if (!ordered.includes(s)) ordered.push(s); });
    // If no data yet, show known stages
    return ordered.length > 0 ? ordered : KNOWN_STAGES;
  }, [deals]);

  if (isLoading) {
    return (
      <div className="flex gap-3">
        {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="flex-1 h-96 rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <FilterSelect label="Priority" value={priorityFilter} onChange={setPriorityFilter} options={[['all', 'All'], ['high', 'High'], ['medium', 'Medium'], ['low', 'Low']]} />
        <FilterSelect label="Has Amount" value={amountFilter} onChange={setAmountFilter} options={[['all', 'All'], ['yes', 'Yes'], ['no', 'No']]} />
        <FilterSelect label="Has Competitor" value={competitorFilter} onChange={setCompetitorFilter} options={[['all', 'All'], ['yes', 'Yes'], ['no', 'No']]} />
      </div>

      {/* Kanban */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {columns.map((stage) => {
          const stageDeals = filteredDeals
            .filter((d) => d.deal_stage_label === stage)
            .sort((a, b) => b.risk_score - a.risk_score);
          const color = STAGE_COLORS[stage] || '#666';

          return (
            <div key={stage} className="flex-1 min-w-[220px] max-w-[280px]">
              <div className="flex items-center gap-2 mb-2 px-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs font-medium text-foreground">{stage}</span>
                <span className="text-xs text-muted-foreground font-mono">{stageDeals.length}</span>
              </div>
              <div className="space-y-2 min-h-[200px]">
                {stageDeals.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                    No deals
                  </div>
                ) : (
                  stageDeals.map((deal) => (
                    <KanbanCard key={deal.id} deal={deal} onClick={() => setSelectedDealId(deal.id)} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KanbanCard({ deal, onClick }: { deal: Deal; onClick: () => void }) {
  const days = daysSince(deal.last_contacted);
  const priorityColor = deal.priority?.toLowerCase() === 'high' ? 'bg-destructive'
    : deal.priority?.toLowerCase() === 'medium' ? 'bg-brand-yellow'
    : 'bg-muted-foreground';

  return (
    <div className="rounded-lg border border-border bg-card p-3 cursor-pointer hover:border-primary/40 transition-colors" onClick={onClick}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground leading-tight">{deal.deal_name}</p>
        <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${priorityColor}`} />
      </div>
      <div className="flex items-center gap-2 mt-2">
        {deal.amount !== null ? (
          <span className="text-xs font-mono text-foreground">{formatCurrency(deal.amount)}</span>
        ) : (
          <span className="text-xs font-mono text-destructive/60">TBD</span>
        )}
        <RiskBadge score={deal.risk_score} />
      </div>
      <p className="text-[10px] text-muted-foreground mt-1.5">
        {days !== null ? `${days}d since contact` : 'No contact date'}
      </p>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[][] }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground">{label}:</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-7 w-[90px] text-xs border-border">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(([val, lbl]) => (
            <SelectItem key={val} value={val} className="text-xs">{lbl}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

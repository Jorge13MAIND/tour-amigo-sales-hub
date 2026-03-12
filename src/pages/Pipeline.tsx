import { useMemo, useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useDeals } from '@/hooks/useDeals';
import { RiskBadge } from '@/components/RiskBadge';
import { formatCurrency } from '@/lib/format';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { Deal } from '@/lib/types';
import { STAGE_COLORS } from '@/lib/types';
import { Shield } from 'lucide-react';

const KNOWN_STAGES = ['Demo Scheduled', 'Additional Demo', 'Demo Completed', 'Proposal Sent', 'Negotiation'];

const STATUS_BORDER: Record<string, string> = {
  on_track: 'border-l-risk-low',
  needs_attention: 'border-l-risk-medium',
  at_risk: 'border-l-destructive',
};

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
      if (amountFilter === 'yes' && !d.has_amount) return false;
      if (amountFilter === 'no' && d.has_amount) return false;
      if (competitorFilter === 'yes' && !d.has_competitor) return false;
      if (competitorFilter === 'no' && d.has_competitor) return false;
      return true;
    });
  }, [deals, priorityFilter, amountFilter, competitorFilter]);

  const columns = useMemo(() => {
    const stageSet = new Set<string>();
    (deals || []).forEach((d) => stageSet.add(d.deal_stage_label));
    const ordered = KNOWN_STAGES.filter((s) => stageSet.has(s));
    stageSet.forEach((s) => { if (!ordered.includes(s)) ordered.push(s); });
    return ordered.length > 0 ? ordered : KNOWN_STAGES;
  }, [deals]);

  if (isLoading) {
    return (
      <div className="flex gap-4">
        {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="flex-1 h-96 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex items-center gap-4 p-4 rounded-xl bg-card border shadow-sm">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filters</span>
        <div className="w-px h-5 bg-border" />
        <FilterSelect label="Priority" value={priorityFilter} onChange={setPriorityFilter} options={[['all', 'All'], ['high', 'High'], ['medium', 'Medium'], ['low', 'Low']]} />
        <FilterSelect label="Amount" value={amountFilter} onChange={setAmountFilter} options={[['all', 'All'], ['yes', 'Has amount'], ['no', 'No amount']]} />
        <FilterSelect label="Competitor" value={competitorFilter} onChange={setCompetitorFilter} options={[['all', 'All'], ['yes', 'Has competitor'], ['no', 'No competitor']]} />
      </div>

      {/* Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((stage) => {
          const stageDeals = filteredDeals
            .filter((d) => d.deal_stage_label === stage)
            .sort((a, b) => b.risk_score - a.risk_score);
          const color = STAGE_COLORS[stage] || '#888';

          return (
            <div key={stage} className="flex-1 min-w-[240px] max-w-[300px]">
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-sm font-semibold text-foreground">{stage}</span>
                <span className="text-xs text-muted-foreground font-mono bg-muted rounded-full px-2 py-0.5">{stageDeals.length}</span>
              </div>
              <div className="space-y-2.5 min-h-[200px]">
                {stageDeals.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground bg-card/50">
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
  const days = deal.days_since_contact;
  const daysColor = days === null ? 'text-muted-foreground' : days > 14 ? 'text-destructive' : days > 7 ? 'text-risk-medium' : 'text-risk-low';
  const priorityColor = deal.priority?.toLowerCase() === 'high' ? 'bg-destructive'
    : deal.priority?.toLowerCase() === 'medium' ? 'bg-brand-yellow'
    : 'bg-muted-foreground';
  const statusBorder = STATUS_BORDER[deal.status] || '';

  return (
    <div
      className={`rounded-xl border border-border bg-card p-4 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all shadow-sm border-l-[3px] ${statusBorder}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-card-foreground leading-tight">{deal.deal_name}</p>
        <div className="flex items-center gap-1.5 shrink-0">
          {deal.has_competitor && <Shield className="h-3 w-3 text-primary" />}
          <div className={`w-2.5 h-2.5 rounded-full ${priorityColor}`} />
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3">
        {deal.amount !== null ? (
          <span className="text-sm font-mono font-semibold text-card-foreground">{formatCurrency(deal.amount)}</span>
        ) : (
          <span className="text-sm font-mono text-muted-foreground italic">TBD</span>
        )}
        <RiskBadge score={deal.risk_score} />
      </div>
      <p className={`text-[11px] mt-2 font-medium ${daysColor}`}>
        {days !== null ? `${days}d since contact` : 'No contact date'}
      </p>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[][] }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground font-medium">{label}:</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 w-[120px] text-xs border-border bg-background rounded-lg">
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

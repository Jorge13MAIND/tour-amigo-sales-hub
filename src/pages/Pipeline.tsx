import { useMemo, useState, memo, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useDeals } from '@/hooks/useDeals';
import { useUpdateDeal } from '@/hooks/useDealMutations';
import { RiskBadge } from '@/components/RiskBadge';
import { formatCurrency } from '@/lib/format';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { Deal } from '@/lib/types';
import { STAGE_COLORS } from '@/lib/types';
import { Shield } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

const KNOWN_STAGES = ['Demo Scheduled', 'Additional Demo', 'Demo Completed', 'Proposal Sent', 'Negotiation'];

const STATUS_BORDER: Record<string, string> = {
  on_track: 'border-l-risk-low',
  needs_attention: 'border-l-risk-medium',
  at_risk: 'border-l-destructive',
};

export default function Pipeline() {
  const { selectedPipeline, setSelectedDealId } = useAppContext();
  const { data: deals, isLoading } = useDeals(selectedPipeline);
  const updateDeal = useUpdateDeal();
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [amountFilter, setAmountFilter] = useState('all');
  const [competitorFilter, setCompetitorFilter] = useState('all');
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

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

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const deal = filteredDeals.find((d) => d.id === event.active.id);
    setActiveDeal(deal || null);
  }, [filteredDeals]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDeal(null);
    const { active, over } = event;
    if (!over) return;

    const dealId = active.id as number;
    const targetStage = over.id as string;
    const deal = filteredDeals.find((d) => d.id === dealId);
    if (!deal || deal.deal_stage_label === targetStage) return;

    updateDeal.mutate({
      deal_id: dealId,
      fields: { deal_stage_label: targetStage },
    });
  }, [filteredDeals, updateDeal]);

  if (isLoading) {
    return (
      <div className="flex gap-4">
        {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="flex-1 h-96 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 p-4 rounded-xl bg-card border shadow-sm">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filters</span>
        <div className="w-px h-5 bg-border" />
        <FilterSelect label="Priority" value={priorityFilter} onChange={setPriorityFilter} options={[['all', 'All'], ['high', 'High'], ['medium', 'Medium'], ['low', 'Low']]} />
        <FilterSelect label="Amount" value={amountFilter} onChange={setAmountFilter} options={[['all', 'All'], ['yes', 'Has amount'], ['no', 'No amount']]} />
        <FilterSelect label="Competitor" value={competitorFilter} onChange={setCompetitorFilter} options={[['all', 'All'], ['yes', 'Has competitor'], ['no', 'No competitor']]} />
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((stage) => {
            const stageDeals = filteredDeals
              .filter((d) => d.deal_stage_label === stage)
              .sort((a, b) => b.risk_score - a.risk_score);

            return (
              <StageColumn key={stage} stage={stage} deals={stageDeals} onCardClick={setSelectedDealId} />
            );
          })}
        </div>

        <DragOverlay>
          {activeDeal && <KanbanCard deal={activeDeal} onClick={() => {}} isDragging />}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function StageColumn({ stage, deals, onCardClick }: { stage: string; deals: Deal[]; onCardClick: (id: number) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const color = STAGE_COLORS[stage] || '#888';

  return (
    <div ref={setNodeRef} className={`flex-1 min-w-[240px] max-w-[300px] transition-colors rounded-xl ${isOver ? 'bg-primary/5 ring-2 ring-primary/20' : ''}`}>
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-sm font-semibold text-foreground">{stage}</span>
        <span className="text-xs text-muted-foreground font-mono bg-muted rounded-full px-2 py-0.5">{deals.length}</span>
      </div>
      <div className="space-y-2.5 min-h-[200px] p-1">
        {deals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground bg-card/50">
            Drop deals here
          </div>
        ) : (
          deals.map((deal) => (
            <DraggableCard key={deal.id} deal={deal} onClick={() => onCardClick(deal.id)} />
          ))
        )}
      </div>
    </div>
  );
}

function DraggableCard({ deal, onClick }: { deal: Deal; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: deal.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <KanbanCard deal={deal} onClick={onClick} />
    </div>
  );
}

const KanbanCard = memo(function KanbanCard({ deal, onClick, isDragging }: { deal: Deal; onClick: () => void; isDragging?: boolean }) {
  const days = deal.days_since_contact;
  const daysColor = days === null ? 'text-muted-foreground' : days > 14 ? 'text-destructive' : days > 7 ? 'text-risk-medium' : 'text-risk-low';
  const priorityColor = deal.priority?.toLowerCase() === 'high' ? 'bg-destructive'
    : deal.priority?.toLowerCase() === 'medium' ? 'bg-brand-yellow'
    : 'bg-muted-foreground';
  const statusBorder = STATUS_BORDER[deal.status] || '';

  return (
    <div
      className={`rounded-xl border border-border bg-card p-4 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all shadow-sm border-l-[3px] ${statusBorder} ${isDragging ? 'shadow-lg rotate-2 scale-105' : ''}`}
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
});

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

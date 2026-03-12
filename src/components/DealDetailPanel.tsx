import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useAppContext } from '@/contexts/AppContext';
import { useDeal } from '@/hooks/useDeals';
import { useDealTasks } from '@/hooks/useTasks';
import { useDealDecisions } from '@/hooks/useDecisions';
import { RiskBadge } from './RiskBadge';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';
import { formatCurrency, formatDate, daysSince, relativeTime } from '@/lib/format';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DealDetailPanel() {
  const { selectedDealId, setSelectedDealId } = useAppContext();
  const { data: deal } = useDeal(selectedDealId);
  const { data: tasks } = useDealTasks(selectedDealId);
  const { data: decisions } = useDealDecisions(selectedDealId);

  return (
    <Sheet open={!!selectedDealId} onOpenChange={(open) => !open && setSelectedDealId(null)}>
      <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto bg-card border-border">
        {deal && (
          <>
            <SheetHeader className="pb-4">
              <div className="flex items-start gap-2">
                <SheetTitle className="text-lg font-semibold text-foreground flex-1">{deal.deal_name}</SheetTitle>
                <RiskBadge score={deal.risk_score} />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs rounded px-1.5 py-0.5 bg-primary/20 text-primary">{deal.deal_stage_label}</span>
                <PriorityBadge priority={deal.priority} />
              </div>
            </SheetHeader>

            <div className="space-y-4">
              {/* Financials */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Amount" value={deal.amount !== null ? formatCurrency(deal.amount) : 'TBD'} mono />
                <Field label="Close Date" value={formatDate(deal.close_date)} />
                <Field label="Users" value={deal.number_of_users || 'N/A'} />
                <Field label="Product Tier" value={deal.product_tier || 'N/A'} />
              </div>

              {/* Strategy */}
              <div className="space-y-3">
                <Field label="Next Step" value={deal.next_step || 'N/A'} full />
                <Field label="Roadblocks" value={deal.roadblocks || 'N/A'} full />
                <Field label="Competitor" value={deal.competitor || 'N/A'} full />
              </div>

              {/* Activity */}
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Last Contacted"
                  value={deal.last_contacted ? `${formatDate(deal.last_contacted)} (${daysSince(deal.last_contacted)}d ago)` : 'N/A'}
                />
                <Field label="Last Sync" value={relativeTime(deal.synced_at)} />
              </div>

              {deal.hubspot_url && (
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href={deal.hubspot_url} target="_blank" rel="noopener noreferrer">
                    Open in HubSpot <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </Button>
              )}

              {/* Tasks */}
              {tasks && tasks.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Tasks</p>
                  <div className="space-y-1.5">
                    {tasks.map((t) => (
                      <div key={t.id} className="flex items-center gap-2 text-sm py-1 border-b border-border last:border-0">
                        <StatusBadge status={t.status} />
                        <span className="flex-1 text-foreground">{t.title}</span>
                        <PriorityBadge priority={t.priority} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Decisions */}
              {decisions && decisions.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Decisions</p>
                  <div className="space-y-2">
                    {decisions.map((d) => (
                      <div key={d.id} className="text-sm border-b border-border pb-2 last:border-0">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={d.status} />
                          <span className="text-xs text-muted-foreground">{formatDate(d.created_at)}</span>
                        </div>
                        <p className="mt-1 text-foreground">{d.decision}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{d.reasoning}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, value, mono, full }: { label: string; value: string; mono?: boolean; full?: boolean }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={`text-sm text-foreground mt-0.5 ${mono ? 'font-mono' : ''} ${value === 'TBD' || value === 'N/A' ? 'text-muted-foreground' : ''}`}>
        {value}
      </p>
    </div>
  );
}

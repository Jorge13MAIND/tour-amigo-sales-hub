import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useAppContext } from '@/contexts/AppContext';
import { useDeal } from '@/hooks/useDeals';
import { useDealTasks } from '@/hooks/useTasks';
import { useDealDecisions } from '@/hooks/useDecisions';
import { RiskBadge } from './RiskBadge';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';
import { DataQualityBar } from './DataQualityBar';
import { DaysToCloseBadge } from './DaysToCloseBadge';
import { formatCurrency, formatDate, relativeTime } from '@/lib/format';
import { ExternalLink, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DealDetailPanel() {
  const { selectedDealId, setSelectedDealId } = useAppContext();
  const { data: deal } = useDeal(selectedDealId);
  const { data: tasks } = useDealTasks(selectedDealId);
  const { data: decisions } = useDealDecisions(selectedDealId);

  return (
    <Sheet open={!!selectedDealId} onOpenChange={(open) => !open && setSelectedDealId(null)}>
      <SheetContent className="w-[500px] sm:max-w-[500px] overflow-y-auto bg-card border-border">
        {deal && (
          <>
            <SheetHeader className="pb-5 border-b border-border">
              <div className="flex items-start gap-3">
                <SheetTitle className="text-lg font-bold text-card-foreground flex-1 leading-snug">{deal.deal_name}</SheetTitle>
                <RiskBadge score={deal.risk_score} />
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-xs font-semibold rounded-full px-2.5 py-1 bg-primary/15 text-primary">{deal.deal_stage_label}</span>
                <PriorityBadge priority={deal.priority} />
                {deal.days_in_stage !== null && (
                  <span className="text-xs text-muted-foreground font-mono">{deal.days_in_stage}d in stage</span>
                )}
                {deal.competitor && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-1 bg-primary/10 text-primary">
                    <Shield className="h-3 w-3" />
                    {deal.competitor}
                  </span>
                )}
              </div>
            </SheetHeader>

            <div className="space-y-5 pt-5">
              {/* Data Quality */}
              {deal.data_quality_score !== null && (
                <Section title="Data Quality">
                  <DataQualityBar deal={deal} />
                </Section>
              )}

              {/* Details */}
              <Section title="Deal Info">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Amount" value={deal.amount !== null ? formatCurrency(deal.amount) : 'TBD'} mono />
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Close Date</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm font-medium text-card-foreground">{formatDate(deal.close_date)}</span>
                      <DaysToCloseBadge days={deal.days_to_close} />
                    </div>
                  </div>
                  <Field label="Users" value={deal.number_of_users || 'N/A'} />
                  <Field label="Product Tier" value={deal.product_tier || 'N/A'} />
                </div>
              </Section>

              {/* Strategy */}
              <Section title="Strategy">
                <div className="space-y-3">
                  <Field label="Next Step" value={deal.next_step || 'N/A'} full />
                  <Field label="Roadblocks" value={deal.roadblocks || 'N/A'} full />
                </div>
              </Section>

              {/* Activity */}
              <Section title="Activity">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Last Contacted</p>
                    <p className="text-sm mt-0.5 font-medium text-card-foreground">
                      {deal.last_contacted ? formatDate(deal.last_contacted) : 'N/A'}
                    </p>
                    {deal.days_since_contact !== null && (
                      <p className={`text-xs font-mono mt-0.5 ${deal.days_since_contact > 14 ? 'text-destructive' : deal.days_since_contact > 7 ? 'text-risk-medium' : 'text-risk-low'}`}>
                        {deal.days_since_contact}d ago
                      </p>
                    )}
                  </div>
                  <Field label="Last Sync" value={relativeTime(deal.synced_at)} />
                </div>
              </Section>

              {deal.hubspot_url && (
                <Button variant="outline" size="sm" className="w-full rounded-lg" asChild>
                  <a href={deal.hubspot_url} target="_blank" rel="noopener noreferrer">
                    Open in HubSpot <ExternalLink className="ml-1.5 h-3 w-3" />
                  </a>
                </Button>
              )}

              {/* Tasks */}
              {tasks && tasks.length > 0 && (
                <Section title="Related Tasks">
                  <div className="space-y-2">
                    {tasks.map((t) => (
                      <div key={t.id} className="flex items-center gap-2 text-sm py-1.5 border-b border-border last:border-0">
                        <StatusBadge status={t.status} />
                        <span className="flex-1 text-card-foreground">{t.title}</span>
                        <PriorityBadge priority={t.priority} />
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Decisions */}
              {decisions && decisions.length > 0 && (
                <Section title="Decision History">
                  <div className="space-y-3">
                    {decisions.map((d) => (
                      <div key={d.id} className="text-sm border-b border-border pb-3 last:border-0">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={d.status} />
                          <span className="text-xs text-muted-foreground">{formatDate(d.created_at)}</span>
                        </div>
                        <p className="mt-1.5 text-card-foreground font-medium">{d.decision}</p>
                        <p className="text-xs text-muted-foreground mt-1">{d.reasoning}</p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-3">{title}</p>
      {children}
    </div>
  );
}

function Field({ label, value, mono, full }: { label: string; value: string; mono?: boolean; full?: boolean }) {
  const isMuted = value === 'TBD' || value === 'N/A';
  return (
    <div className={full ? 'col-span-2' : ''}>
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={`text-sm mt-0.5 ${mono ? 'font-mono font-semibold' : 'font-medium'} ${isMuted ? 'text-muted-foreground italic' : 'text-card-foreground'}`}>
        {value}
      </p>
    </div>
  );
}

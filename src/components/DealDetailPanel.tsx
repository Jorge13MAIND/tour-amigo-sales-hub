import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useAppContext } from '@/contexts/AppContext';
import { useDeal } from '@/hooks/useDeals';
import { useDealTasks } from '@/hooks/useTasks';
import { useDealDecisions } from '@/hooks/useDecisions';
import { useUpdateDeal, useCreateNote, useCreateTask, useUpdateTask, useDeleteTask, useUpdateDecision } from '@/hooks/useDealMutations';
import { RiskBadge } from './RiskBadge';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';
import { DataQualityBar } from './DataQualityBar';
import { DaysToCloseBadge } from './DaysToCloseBadge';
import { EditableField } from './EditableField';
import { AddNoteForm } from './AddNoteForm';
import { TaskForm } from './TaskForm';
import { formatCurrency, formatDate, relativeTime } from '@/lib/format';
import { ExternalLink, Shield, Check, Trash2, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const STAGE_OPTIONS = [
  { value: 'Demo Scheduled', label: 'Demo Scheduled' },
  { value: 'Additional Demo', label: 'Additional Demo' },
  { value: 'Demo Completed', label: 'Demo Completed' },
  { value: 'Proposal Sent', label: 'Proposal Sent' },
  { value: 'Negotiation', label: 'Negotiation' },
  { value: 'Commit', label: 'Commit' },
  { value: 'Closed Won', label: 'Closed Won' },
  { value: 'Closed Lost', label: 'Closed Lost' },
  { value: 'Follow Up Future', label: 'Follow Up Future' },
];

const PRIORITY_OPTIONS = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export function DealDetailPanel() {
  const { selectedDealId, setSelectedDealId } = useAppContext();
  const { data: deal } = useDeal(selectedDealId);
  const { data: tasks } = useDealTasks(selectedDealId);
  const { data: decisions } = useDealDecisions(selectedDealId);
  const updateDeal = useUpdateDeal();
  const createNote = useCreateNote();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const updateDecision = useUpdateDecision();
  const [showTaskForm, setShowTaskForm] = useState(false);

  const handleDealFieldSave = (field: string, value: string) => {
    if (!deal) return;
    const fields: Record<string, unknown> = {};
    if (field === 'amount') fields.amount = value ? Number(value) : null;
    else if (field === 'close_date') fields.close_date = value || null;
    else if (field === 'number_of_users') fields.number_of_users = value || null;
    else fields[field] = value || null;
    updateDeal.mutate({ deal_id: deal.id, fields });
  };

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
                <EditableField
                  type="select"
                  value={deal.deal_stage_label}
                  options={STAGE_OPTIONS}
                  onSave={(v) => handleDealFieldSave('deal_stage_label', v)}
                  displayClassName="text-xs font-semibold rounded-full px-2.5 py-1 bg-primary/15 text-primary cursor-pointer hover:bg-primary/25 transition-colors"
                />
                <EditableField
                  type="select"
                  value={deal.priority || 'medium'}
                  options={PRIORITY_OPTIONS}
                  onSave={(v) => handleDealFieldSave('priority', v)}
                  displayClassName="cursor-pointer"
                  renderDisplay={(v) => <PriorityBadge priority={v} />}
                />
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
              {deal.data_quality_score !== null && (
                <Section title="Data Quality">
                  <DataQualityBar deal={deal} />
                </Section>
              )}

              <Section title="Deal Info">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Amount</p>
                    <EditableField
                      type="number"
                      value={deal.amount !== null ? String(deal.amount) : ''}
                      onSave={(v) => handleDealFieldSave('amount', v)}
                      placeholder="Enter amount"
                      displayClassName="text-sm font-mono font-semibold text-card-foreground mt-0.5"
                      renderDisplay={(v) => <span>{v ? formatCurrency(Number(v)) : <span className="text-muted-foreground italic">TBD</span>}</span>}
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Close Date</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <EditableField
                        type="date"
                        value={deal.close_date || ''}
                        onSave={(v) => handleDealFieldSave('close_date', v)}
                        displayClassName="text-sm font-medium text-card-foreground"
                        renderDisplay={(v) => <span>{v ? formatDate(v) : <span className="text-muted-foreground italic">N/A</span>}</span>}
                      />
                      <DaysToCloseBadge days={deal.days_to_close} />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Users</p>
                    <EditableField
                      type="text"
                      value={deal.number_of_users || ''}
                      onSave={(v) => handleDealFieldSave('number_of_users', v)}
                      placeholder="N/A"
                      displayClassName="text-sm font-medium text-card-foreground mt-0.5"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Product Tier</p>
                    <EditableField
                      type="text"
                      value={deal.product_tier || ''}
                      onSave={(v) => handleDealFieldSave('product_tier', v)}
                      placeholder="N/A"
                      displayClassName="text-sm font-medium text-card-foreground mt-0.5"
                    />
                  </div>
                </div>
              </Section>

              <Section title="Strategy">
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Next Step</p>
                    <EditableField
                      type="textarea"
                      value={deal.next_step || ''}
                      onSave={(v) => handleDealFieldSave('next_step', v)}
                      placeholder="Define next step..."
                      displayClassName="text-sm font-medium text-card-foreground mt-0.5"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Roadblocks</p>
                    <EditableField
                      type="textarea"
                      value={deal.roadblocks || ''}
                      onSave={(v) => handleDealFieldSave('roadblocks', v)}
                      placeholder="No roadblocks"
                      displayClassName="text-sm font-medium text-card-foreground mt-0.5"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Competitor</p>
                    <EditableField
                      type="text"
                      value={deal.competitor || ''}
                      onSave={(v) => handleDealFieldSave('competitor', v)}
                      placeholder="None"
                      displayClassName="text-sm font-medium text-card-foreground mt-0.5"
                    />
                  </div>
                </div>
              </Section>

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
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Last Sync</p>
                    <p className="text-sm mt-0.5 font-medium text-card-foreground">{relativeTime(deal.synced_at)}</p>
                  </div>
                </div>
              </Section>

              {deal.hubspot_url && (
                <Button variant="outline" size="sm" className="w-full rounded-lg" asChild>
                  <a href={deal.hubspot_url} target="_blank" rel="noopener noreferrer">
                    Open in HubSpot <ExternalLink className="ml-1.5 h-3 w-3" />
                  </a>
                </Button>
              )}

              {/* Add Note */}
              <Section title="Add Note">
                <AddNoteForm onSubmit={(content) => createNote.mutate({ deal_id: deal.id, content })} isLoading={createNote.isPending} />
              </Section>

              {/* Tasks */}
              <Section title="Tasks">
                <div className="space-y-2">
                  {tasks && tasks.map((t) => (
                    <div key={t.id} className="flex items-center gap-2 text-sm py-1.5 border-b border-border last:border-0 group">
                      <button
                        onClick={() => updateTask.mutate({ task_id: t.id, fields: { status: t.status === 'completed' ? 'pending' : 'completed' } })}
                        className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                        title={t.status === 'completed' ? 'Mark pending' : 'Mark complete'}
                      >
                        <Check className={`h-4 w-4 ${t.status === 'completed' ? 'text-primary' : ''}`} />
                      </button>
                      <span className={`flex-1 text-card-foreground ${t.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>{t.title}</span>
                      <PriorityBadge priority={t.priority} />
                      <button
                        onClick={() => deleteTask.mutate({ task_id: t.id })}
                        className="shrink-0 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete task"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {showTaskForm ? (
                    <div className="pt-2">
                      <TaskForm
                        dealId={deal.id}
                        onSubmit={(vars) => { createTask.mutate(vars); setShowTaskForm(false); }}
                        onCancel={() => setShowTaskForm(false)}
                        isLoading={createTask.isPending}
                      />
                    </div>
                  ) : (
                    <Button variant="ghost" size="sm" className="w-full text-xs mt-1" onClick={() => setShowTaskForm(true)}>
                      <Plus className="h-3 w-3 mr-1" /> Add Task
                    </Button>
                  )}
                </div>
              </Section>

              {/* Decisions */}
              {decisions && decisions.length > 0 && (
                <Section title="Decision History">
                  <div className="space-y-3">
                    {decisions.map((d) => (
                      <div key={d.id} className="text-sm border-b border-border pb-3 last:border-0">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={d.status} />
                          <span className="text-xs text-muted-foreground">{formatDate(d.created_at)}</span>
                          {d.status === 'pending_review' && (
                            <div className="flex gap-1 ml-auto">
                              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-primary" onClick={() => updateDecision.mutate({ decision_id: d.id, fields: { status: 'approved' } })}>
                                <Check className="h-3 w-3 mr-1" /> Approve
                              </Button>
                              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-destructive" onClick={() => updateDecision.mutate({ decision_id: d.id, fields: { status: 'rejected' } })}>
                                <X className="h-3 w-3 mr-1" /> Reject
                              </Button>
                            </div>
                          )}
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

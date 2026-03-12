import type { Deal } from '@/lib/types';
import { formatCurrency, truncate, daysSince } from '@/lib/format';
import { RiskBadge } from './RiskBadge';
import { PriorityBadge } from './PriorityBadge';
import { useAppContext } from '@/contexts/AppContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle } from 'lucide-react';

interface DealsAttentionTableProps {
  deals: Deal[];
}

export function DealsAttentionTable({ deals }: DealsAttentionTableProps) {
  const { setSelectedDealId } = useAppContext();
  const attentionDeals = deals
    .filter((d) => d.status === 'needs_attention' || d.status === 'at_risk')
    .sort((a, b) => b.risk_score - a.risk_score);

  if (attentionDeals.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Deals Needing Attention</p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
          <span>✓</span> All deals are on track
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="px-5 pt-5 pb-3 flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-destructive" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Deals Needing Attention</p>
        <span className="ml-auto text-xs font-mono font-semibold text-destructive bg-destructive/10 rounded-full px-2 py-0.5">{attentionDeals.length}</span>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="border-border bg-muted/30">
            <TableHead className="text-xs font-semibold">Deal</TableHead>
            <TableHead className="text-xs font-semibold">Stage</TableHead>
            <TableHead className="text-xs font-semibold text-right">Amount</TableHead>
            <TableHead className="text-xs font-semibold text-center">Risk</TableHead>
            <TableHead className="text-xs font-semibold text-center">Silent</TableHead>
            <TableHead className="text-xs font-semibold">Next Step</TableHead>
            <TableHead className="text-xs font-semibold text-center">Priority</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attentionDeals.map((deal) => {
            const days = daysSince(deal.last_contacted);
            return (
              <TableRow key={deal.id} className="border-border hover:bg-accent/50 transition-colors">
                <TableCell>
                  <button
                    onClick={() => setSelectedDealId(deal.id)}
                    className="text-sm font-semibold text-primary hover:underline text-left"
                  >
                    {deal.deal_name}
                  </button>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{deal.deal_stage_label}</TableCell>
                <TableCell className="text-right">
                  {deal.amount !== null ? (
                    <span className="text-sm font-mono font-medium">{formatCurrency(deal.amount)}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">TBD</span>
                  )}
                </TableCell>
                <TableCell className="text-center"><RiskBadge score={deal.risk_score} /></TableCell>
                <TableCell className="text-center font-mono text-sm font-medium">
                  {days !== null ? <span className={days > 7 ? 'text-destructive' : ''}>{days}d</span> : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[200px]">{truncate(deal.next_step, 40)}</TableCell>
                <TableCell className="text-center"><PriorityBadge priority={deal.priority} /></TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

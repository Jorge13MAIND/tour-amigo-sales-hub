import type { Deal } from '@/lib/types';
import { formatCurrency, truncate, daysSince } from '@/lib/format';
import { RiskBadge } from './RiskBadge';
import { PriorityBadge } from './PriorityBadge';
import { useAppContext } from '@/contexts/AppContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
      <div className="rounded-lg border bg-card p-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Deals Needing Attention</p>
        <p className="text-sm text-muted-foreground">All deals are on track.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="p-4 pb-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Deals Needing Attention</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="border-border">
            <TableHead className="text-xs">Deal</TableHead>
            <TableHead className="text-xs">Stage</TableHead>
            <TableHead className="text-xs text-right">Amount</TableHead>
            <TableHead className="text-xs text-center">Risk</TableHead>
            <TableHead className="text-xs text-center">Days Silent</TableHead>
            <TableHead className="text-xs">Next Step</TableHead>
            <TableHead className="text-xs text-center">Priority</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attentionDeals.map((deal) => {
            const days = daysSince(deal.last_contacted);
            return (
              <TableRow key={deal.id} className="border-border">
                <TableCell>
                  <button
                    onClick={() => setSelectedDealId(deal.id)}
                    className="text-sm font-medium text-primary hover:underline text-left"
                  >
                    {deal.deal_name}
                  </button>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{deal.deal_stage_label}</TableCell>
                <TableCell className="text-right">
                  {deal.amount !== null ? (
                    <span className="text-sm font-mono">{formatCurrency(deal.amount)}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground font-mono">TBD</span>
                  )}
                </TableCell>
                <TableCell className="text-center"><RiskBadge score={deal.risk_score} /></TableCell>
                <TableCell className="text-center font-mono text-sm">
                  {days !== null ? days : <span className="text-muted-foreground">N/A</span>}
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

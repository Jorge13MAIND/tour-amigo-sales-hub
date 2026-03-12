import { useState, useMemo } from 'react';
import type { Deal } from '@/lib/types';
import { formatCurrency, truncate } from '@/lib/format';
import { RiskBadge } from './RiskBadge';
import { PriorityBadge } from './PriorityBadge';
import { DaysToCloseBadge } from './DaysToCloseBadge';
import { useAppContext } from '@/contexts/AppContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface DealsAttentionTableProps {
  deals: Deal[];
}

type SortKey = 'deal_name' | 'deal_stage_label' | 'amount' | 'risk_score' | 'days_since_contact' | 'days_to_close' | 'priority';
type SortDir = 'asc' | 'desc';

const PRIORITY_VAL: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

export function DealsAttentionTable({ deals }: DealsAttentionTableProps) {
  const { setSelectedDealId } = useAppContext();
  const [sortKey, setSortKey] = useState<SortKey>('risk_score');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const attentionDeals = useMemo(() => {
    const filtered = deals.filter((d) => d.status === 'needs_attention' || d.status === 'at_risk');
    return filtered.sort((a, b) => {
      let av: number, bv: number;
      switch (sortKey) {
        case 'deal_name': return sortDir === 'asc' ? a.deal_name.localeCompare(b.deal_name) : b.deal_name.localeCompare(a.deal_name);
        case 'deal_stage_label': return sortDir === 'asc' ? a.deal_stage_label.localeCompare(b.deal_stage_label) : b.deal_stage_label.localeCompare(a.deal_stage_label);
        case 'amount': av = a.amount ?? -1; bv = b.amount ?? -1; break;
        case 'risk_score': av = a.risk_score; bv = b.risk_score; break;
        case 'days_since_contact': av = a.days_since_contact ?? 9999; bv = b.days_since_contact ?? 9999; break;
        case 'days_to_close': av = a.days_to_close ?? 9999; bv = b.days_to_close ?? 9999; break;
        case 'priority': av = PRIORITY_VAL[a.priority?.toLowerCase() || ''] ?? 4; bv = PRIORITY_VAL[b.priority?.toLowerCase() || ''] ?? 4; break;
        default: av = 0; bv = 0;
      }
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }, [deals, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir(key === 'deal_name' || key === 'deal_stage_label' ? 'asc' : 'desc'); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 opacity-30" />;
    return sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

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
            {([
              ['deal_name', 'Deal', ''],
              ['deal_stage_label', 'Stage', ''],
              ['amount', 'Amount', 'text-right'],
              ['risk_score', 'Risk', 'text-center'],
              ['days_since_contact', 'Silent', 'text-center'],
              ['days_to_close', 'Close', 'text-center'],
              ['priority', 'Priority', 'text-center'],
            ] as [SortKey, string, string][]).map(([key, label, align]) => (
              <TableHead key={key} className={`text-xs font-semibold ${align}`}>
                <button onClick={() => toggleSort(key)} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                  {label} <SortIcon col={key} />
                </button>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {attentionDeals.map((deal) => {
            const days = deal.days_since_contact;
            const daysColor = days === null ? 'text-muted-foreground' : days > 14 ? 'text-destructive' : days > 7 ? 'text-risk-medium' : 'text-risk-low';
            return (
              <TableRow key={deal.id} className="border-border hover:bg-accent/50 transition-colors">
                <TableCell>
                  <button onClick={() => setSelectedDealId(deal.id)} className="text-sm font-semibold text-primary hover:underline text-left">
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
                  {days !== null ? <span className={daysColor}>{days}d</span> : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="text-center"><DaysToCloseBadge days={deal.days_to_close} /></TableCell>
                <TableCell className="text-center"><PriorityBadge priority={deal.priority} /></TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

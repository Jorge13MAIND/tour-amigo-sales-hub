import { useState, useMemo } from 'react';
import { useDecisions } from '@/hooks/useDecisions';
import { useAppContext } from '@/contexts/AppContext';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate } from '@/lib/format';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

export default function Decisions() {
  const { data: decisions, isLoading } = useDecisions();
  const { setSelectedDealId } = useAppContext();
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const types = useMemo(() => {
    if (!decisions) return [];
    return [...new Set(decisions.map((d) => d.decision_type))];
  }, [decisions]);

  const filtered = useMemo(() => {
    if (!decisions) return [];
    return decisions.filter((d) => {
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      if (typeFilter !== 'all' && d.decision_type !== typeFilter) return false;
      return true;
    });
  }, [decisions, statusFilter, typeFilter]);

  if (isLoading) return <Skeleton className="h-96 rounded-lg" />;

  return (
    <div className="space-y-3 max-w-[1400px]">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Status:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-7 w-[150px] text-xs border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All</SelectItem>
              <SelectItem value="pending_review" className="text-xs">Pending Review</SelectItem>
              <SelectItem value="reviewed" className="text-xs">Reviewed</SelectItem>
              <SelectItem value="outcome_confirmed" className="text-xs">Confirmed</SelectItem>
              <SelectItem value="outcome_different" className="text-xs">Different Outcome</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Type:</span>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-7 w-[150px] text-xs border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All</SelectItem>
              {types.map((t) => (
                <SelectItem key={t} value={t} className="text-xs">{t.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="text-xs">Date</TableHead>
              <TableHead className="text-xs">Deal</TableHead>
              <TableHead className="text-xs">Type</TableHead>
              <TableHead className="text-xs">Decision</TableHead>
              <TableHead className="text-xs">Expected Outcome</TableHead>
              <TableHead className="text-xs">Review Date</TableHead>
              <TableHead className="text-xs">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">No decisions found.</TableCell></TableRow>
            ) : (
              filtered.map((d) => (
                <TableRow key={d.id} className="border-border">
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(d.created_at)}</TableCell>
                  <TableCell>
                    <button onClick={() => d.deal_id && setSelectedDealId(d.deal_id)} className="text-sm text-primary hover:underline">
                      {d.deal_name}
                    </button>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs rounded px-1.5 py-0.5 bg-primary/15 text-primary capitalize">{d.decision_type.replace(/_/g, ' ')}</span>
                  </TableCell>
                  <TableCell className="text-sm max-w-[250px]">{d.decision}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px]">{d.expected_outcome || 'N/A'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(d.review_date)}</TableCell>
                  <TableCell><StatusBadge status={d.status} /></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

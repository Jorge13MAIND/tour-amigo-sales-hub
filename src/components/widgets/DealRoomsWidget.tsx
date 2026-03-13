import { useDealRoomCounts } from '@/hooks/useDealRooms';
import { Link } from 'react-router-dom';
import { Building2, AlertTriangle, Rss, ArrowRight } from 'lucide-react';
import type { DealRoom } from '@/lib/types';

export function DealRoomsWidget() {
  const { data, isLoading } = useDealRoomCounts();

  if (isLoading) {
    return <div className="rounded-xl border border-border bg-card p-5 h-52 animate-pulse" />;
  }

  const rooms = (data?.rooms || []) as Pick<DealRoom, 'id' | 'room_type' | 'status' | 'risks' | 'target_close_date' | 'close_probability' | 'deal_name'>[];
  const enterprise = rooms.filter((r) => r.room_type === 'enterprise').length;
  const midMarket = rooms.filter((r) => r.room_type === 'mid_market').length;

  const closestRooms = [...rooms]
    .filter((r) => r.target_close_date)
    .sort((a, b) => (a.target_close_date || '').localeCompare(b.target_close_date || ''))
    .slice(0, 2);

  const criticalRisks = rooms.reduce((acc, r) => {
    const risks = (r.risks as Array<{ severity: string; status: string }>) || [];
    return acc + risks.filter((risk) => (risk.severity === 'critical' || risk.severity === 'high') && risk.status === 'open').length;
  }, 0);

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Deal Rooms</h3>
      </div>

      <div className="space-y-1 text-sm">
        <p className="text-muted-foreground">Active: <span className="text-foreground font-medium">{rooms.length}</span></p>
        {enterprise > 0 && <p className="text-muted-foreground text-xs">Enterprise: {enterprise} · Mid-Market: {midMarket}</p>}
      </div>

      {closestRooms.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Closest to close:</p>
          {closestRooms.map((r) => (
            <p key={r.id} className="text-xs text-foreground flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {r.deal_name}
              <span className="text-muted-foreground ml-auto">
                {r.target_close_date ? new Date(r.target_close_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
              </span>
              <span className="text-muted-foreground">{r.close_probability}%</span>
            </p>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {criticalRisks > 0 && (
          <span className="flex items-center gap-1 text-destructive"><AlertTriangle className="h-3 w-3" /> {criticalRisks} critical risks</span>
        )}
        {(data?.feedTodayCount || 0) > 0 && (
          <span className="flex items-center gap-1"><Rss className="h-3 w-3" /> {data?.feedTodayCount} today</span>
        )}
      </div>

      <Link to="/deal-rooms" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
        View all <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

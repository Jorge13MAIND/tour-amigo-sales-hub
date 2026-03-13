import { useState } from 'react';
import { useDealRooms, useDealsWithoutRooms } from '@/hooks/useDealRooms';
import { DealRoomCard } from '@/components/deal-room/DealRoomCard';
import { Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/format';

type RoomTypeFilter = 'all' | 'enterprise' | 'mid_market' | 'standard';
type StatusFilter = 'all' | 'active' | 'won' | 'lost' | 'paused';
type SortKey = 'close_date' | 'contract_value' | 'probability';

interface RoomMeta {
  stakeholders: Record<number, number>;
  feedCounts: Record<number, number>;
  docCounts: Record<number, number>;
  lastFeed: Record<number, string>;
}

export default function DealRoomList() {
  const [typeFilter, setTypeFilter] = useState<RoomTypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('close_date');
  const [othersOpen, setOthersOpen] = useState(false);

  const { data: rooms, isLoading } = useDealRooms();
  const { data: dealsWithoutRooms } = useDealsWithoutRooms();

  // Get counts per room — returns serializable data, not functions
  const { data: roomMeta } = useQuery<RoomMeta>({
    queryKey: ['deal-room-meta'],
    queryFn: async () => {
      const [stk, feed, docs] = await Promise.all([
        supabase.from('deal_stakeholders').select('deal_id'),
        supabase.from('deal_room_feed').select('deal_id, created_at').gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
        supabase.from('deal_documents').select('deal_id'),
      ]);

      const stakeholders: Record<number, number> = {};
      (stk.data || []).forEach((r) => { stakeholders[r.deal_id] = (stakeholders[r.deal_id] || 0) + 1; });

      const feedCounts: Record<number, number> = {};
      const lastFeed: Record<number, string> = {};
      (feed.data || []).forEach((r) => {
        feedCounts[r.deal_id] = (feedCounts[r.deal_id] || 0) + 1;
        if (!lastFeed[r.deal_id] || r.created_at > lastFeed[r.deal_id]) lastFeed[r.deal_id] = r.created_at;
      });

      const docCounts: Record<number, number> = {};
      (docs.data || []).forEach((r) => { docCounts[r.deal_id] = (docCounts[r.deal_id] || 0) + 1; });

      return { stakeholders, feedCounts, docCounts, lastFeed };
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-[1400px]">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      </div>
    );
  }

  let filtered = (rooms || []).filter((r) => {
    if (typeFilter !== 'all' && r.room_type !== typeFilter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    return true;
  });

  filtered = [...filtered].sort((a, b) => {
    if (sortKey === 'contract_value') return (b.total_contract_value || 0) - (a.total_contract_value || 0);
    if (sortKey === 'probability') return (b.close_probability || 0) - (a.close_probability || 0);
    return (a.target_close_date || '').localeCompare(b.target_close_date || '');
  });

  const activeCount = (rooms || []).filter((r) => r.status === 'active').length;

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Deal Rooms</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{activeCount} active room{activeCount !== 1 ? 's' : ''}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-1.5">
          {(['all', 'enterprise', 'mid_market', 'standard'] as const).map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${typeFilter === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}>
              {t === 'all' ? 'All Types' : t.replace('_', '-').replace(/\b\w/g, (c) => c.toUpperCase())}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {(['all', 'active', 'won', 'lost', 'paused'] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${statusFilter === s ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}>
              {s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="text-xs px-3 py-1.5 rounded-full border border-border bg-card text-foreground">
          <option value="close_date">Close date (soonest)</option>
          <option value="contract_value">Contract value (highest)</option>
          <option value="probability">Probability (highest)</option>
        </select>
      </div>

      {/* Room cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Building2 className="h-12 w-12 mb-4 opacity-40" />
          <p className="text-sm font-medium">No deal rooms configured yet.</p>
          <p className="text-xs mt-1 text-center max-w-sm">ATLAS agents automatically create rooms for enterprise and mid-market deals as they progress through the pipeline.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((room) => (
            <DealRoomCard
              key={room.id}
              room={room}
              stakeholderCount={roomMeta?.stakeholders[room.deal_id] || 0}
              feedCount={roomMeta?.feedCounts[room.deal_id] || 0}
              docCount={roomMeta?.docCounts[room.deal_id] || 0}
              lastFeedAt={roomMeta?.lastFeed[room.deal_id] || null}
            />
          ))}
        </div>
      )}

      {/* Deals without rooms */}
      {dealsWithoutRooms && dealsWithoutRooms.length > 0 && (
        <div className="rounded-xl border border-border bg-card">
          <button onClick={() => setOthersOpen(!othersOpen)} className="w-full flex items-center justify-between p-4 text-sm font-medium text-foreground">
            <span>Other Active Deals ({dealsWithoutRooms.length})</span>
            {othersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {othersOpen && (
            <div className="border-t border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground border-b border-border">
                    <th className="text-left p-3 font-medium">Deal</th>
                    <th className="text-left p-3 font-medium">Stage</th>
                    <th className="text-right p-3 font-medium">Amount</th>
                    <th className="text-right p-3 font-medium">Days Silent</th>
                    <th className="text-right p-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {dealsWithoutRooms.map((d) => (
                    <tr key={d.id} className="border-b border-border/50 last:border-0">
                      <td className="p-3 font-medium text-foreground">{d.deal_name}</td>
                      <td className="p-3 text-muted-foreground">{d.deal_stage_label}</td>
                      <td className="p-3 text-right text-foreground">{d.amount ? formatCurrency(d.amount) : '—'}</td>
                      <td className="p-3 text-right text-muted-foreground">{d.days_since_contact ?? '—'}</td>
                      <td className="p-3 text-right"><span className="text-[10px] text-muted-foreground/60">No room yet</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

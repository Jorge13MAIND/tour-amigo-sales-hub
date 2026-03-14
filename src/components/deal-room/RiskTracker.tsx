import type { DealRisk } from '@/lib/types';
import { AlertTriangle } from 'lucide-react';
import { useUpdateDealRoom } from '@/hooks/useDealMutations';
import { Button } from '@/components/ui/button';

const SEVERITY_STYLES: Record<string, { dot: string; label: string; border: string }> = {
  critical: { dot: '🔴', label: 'CRITICAL', border: 'border-l-red-500' },
  high: { dot: '🟠', label: 'HIGH', border: 'border-l-orange-500' },
  medium: { dot: '🟡', label: 'MEDIUM', border: 'border-l-amber-400' },
  low: { dot: '🟢', label: 'LOW', border: 'border-l-emerald-500' },
};

const STATUS_STYLES: Record<string, string> = {
  open: 'border border-destructive text-destructive',
  mitigated: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  escalated: 'bg-destructive text-destructive-foreground',
};

const STATUS_CYCLE: Record<string, string> = {
  open: 'mitigated',
  mitigated: 'escalated',
  escalated: 'open',
};

const SEVERITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

interface Props {
  risks: DealRisk[];
  roomId?: string;
}

export function RiskTracker({ risks, roomId }: Props) {
  const updateRoom = useUpdateDealRoom();

  const toggleStatus = (index: number) => {
    if (!roomId) return;
    const updated = risks.map((r, i) => i === index ? { ...r, status: STATUS_CYCLE[r.status] || 'open' } : r) as DealRisk[];
    updateRoom.mutate({ room_id: roomId, fields: { risks: updated } });
  };

  if (!risks.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <AlertTriangle className="h-10 w-10 mb-3 opacity-40" />
        <p className="text-sm">No risks identified yet.</p>
        <p className="text-xs mt-1">ATLAS agents will flag risks as they emerge from deal activity.</p>
      </div>
    );
  }

  const sorted = [...risks].map((r, origIdx) => ({ ...r, _idx: origIdx })).sort((a, b) => {
    const statusDiff = (a.status === 'open' ? 0 : 1) - (b.status === 'open' ? 0 : 1);
    if (statusDiff !== 0) return statusDiff;
    return (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9);
  });

  const openCount = risks.filter((r) => r.status === 'open').length;
  const criticalOpen = risks.filter((r) => r.status === 'open' && r.severity === 'critical').length;
  const mitigated = risks.filter((r) => r.status === 'mitigated').length;

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        {risks.length} risk{risks.length > 1 ? 's' : ''} · {openCount} open
        {criticalOpen > 0 && <span className="text-destructive"> ({criticalOpen} critical)</span>}
        {mitigated > 0 && ` · ${mitigated} mitigated`}
      </div>

      <div className="space-y-3">
        {sorted.map((risk) => {
          const sev = SEVERITY_STYLES[risk.severity] || SEVERITY_STYLES.medium;
          return (
            <div key={risk._idx} className={`rounded-xl border border-border bg-card p-4 border-l-4 ${sev.border} space-y-2`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span>{sev.dot}</span>
                  <span className="text-xs font-bold text-muted-foreground">{sev.label}</span>
                </div>
                {roomId ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-6 px-2 text-[10px] font-bold uppercase rounded-full ${STATUS_STYLES[risk.status] || ''}`}
                    onClick={() => toggleStatus(risk._idx)}
                  >
                    {risk.status} →
                  </Button>
                ) : (
                  <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 uppercase ${STATUS_STYLES[risk.status] || ''}`}>
                    {risk.status}
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-foreground">{risk.risk}</p>
              {risk.mitigation && <p className="text-sm text-muted-foreground">{risk.mitigation}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

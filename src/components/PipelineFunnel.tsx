import type { Deal } from '@/lib/types';
import { STAGE_COLORS } from '@/lib/types';
import { formatCurrency } from '@/lib/format';
import { useMemo } from 'react';

interface PipelineFunnelProps {
  deals: Deal[];
}

export function PipelineFunnel({ deals }: PipelineFunnelProps) {
  const stages = useMemo(() => {
    const stageMap = new Map<string, { count: number; value: number }>();
    deals.forEach((d) => {
      const label = d.deal_stage_label;
      const existing = stageMap.get(label) || { count: 0, value: 0 };
      existing.count += 1;
      existing.value += d.amount || 0;
      stageMap.set(label, existing);
    });
    // Order by known stages, then any others
    const knownOrder = ['Demo Scheduled', 'Additional Demo', 'Demo Completed', 'Proposal Sent', 'Negotiation'];
    const ordered: { label: string; count: number; value: number }[] = [];
    knownOrder.forEach((s) => {
      const data = stageMap.get(s);
      ordered.push({ label: s, count: data?.count || 0, value: data?.value || 0 });
      stageMap.delete(s);
    });
    // Append any remaining stages
    stageMap.forEach((data, label) => {
      ordered.push({ label, count: data.count, value: data.value });
    });
    return ordered;
  }, [deals]);

  const totalDeals = stages.reduce((s, st) => s + st.count, 0);
  if (totalDeals === 0) {
    return <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">No active deals in pipeline.</div>;
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Pipeline Funnel</p>
      <div className="flex h-12 rounded overflow-hidden">
        {stages.map((stage) => {
          if (stage.count === 0) return null;
          const width = Math.max((stage.count / totalDeals) * 100, 8);
          const color = STAGE_COLORS[stage.label] || '#666';
          return (
            <div
              key={stage.label}
              className="flex flex-col items-center justify-center text-xs font-medium px-2 min-w-[60px]"
              style={{ width: `${width}%`, backgroundColor: color, color: '#fff' }}
              title={`${stage.label}: ${stage.count} deals, ${formatCurrency(stage.value)}`}
            >
              <span className="font-mono font-semibold">{stage.count}</span>
              <span className="text-[10px] opacity-80 font-mono">{formatCurrency(stage.value)}</span>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 mt-2">
        {stages.map((stage) => (
          <div key={stage.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STAGE_COLORS[stage.label] || '#666' }} />
            {stage.label}
          </div>
        ))}
      </div>
    </div>
  );
}

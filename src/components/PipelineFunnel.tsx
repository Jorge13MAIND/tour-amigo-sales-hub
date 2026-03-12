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
    const knownOrder = ['Demo Scheduled', 'Additional Demo', 'Demo Completed', 'Proposal Sent', 'Negotiation'];
    const ordered: { label: string; count: number; value: number }[] = [];
    knownOrder.forEach((s) => {
      const data = stageMap.get(s);
      ordered.push({ label: s, count: data?.count || 0, value: data?.value || 0 });
      stageMap.delete(s);
    });
    stageMap.forEach((data, label) => {
      ordered.push({ label, count: data.count, value: data.value });
    });
    return ordered;
  }, [deals]);

  const totalDeals = stages.reduce((s, st) => s + st.count, 0);
  if (totalDeals === 0) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">No active deals in pipeline.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Pipeline Funnel</p>
      <div className="flex h-14 rounded-xl overflow-hidden gap-0.5">
        {stages.map((stage) => {
          if (stage.count === 0) return null;
          const width = Math.max((stage.count / totalDeals) * 100, 10);
          const color = STAGE_COLORS[stage.label] || '#888';
          return (
            <div
              key={stage.label}
              className="flex flex-col items-center justify-center text-xs font-semibold px-3 min-w-[70px] first:rounded-l-lg last:rounded-r-lg transition-all"
              style={{ width: `${width}%`, backgroundColor: color, color: '#fff' }}
              title={`${stage.label}: ${stage.count} deals, ${formatCurrency(stage.value)}`}
            >
              <span className="font-mono text-sm">{stage.count}</span>
              <span className="text-[10px] opacity-90 font-mono">{formatCurrency(stage.value)}</span>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-4 mt-3">
        {stages.map((stage) => (
          <div key={stage.label} className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STAGE_COLORS[stage.label] || '#888' }} />
            {stage.label}
            <span className="font-mono text-foreground">{stage.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

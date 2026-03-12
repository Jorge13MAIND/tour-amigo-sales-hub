import type { Deal } from '@/lib/types';

interface DataQualityBarProps {
  deal: Deal;
}

export function DataQualityBar({ deal }: DataQualityBarProps) {
  const score = deal.data_quality_score ?? 0;
  const color = score >= 70 ? 'bg-risk-low' : score >= 40 ? 'bg-risk-medium' : 'bg-destructive';
  const textColor = score >= 70 ? 'text-risk-low' : score >= 40 ? 'text-risk-medium' : 'text-destructive';

  const missing: string[] = [];
  if (!deal.has_amount) missing.push('No amount');
  if (!deal.has_competitor) missing.push('No competitor');
  if (!deal.has_next_step) missing.push('No next step');
  if (!deal.priority) missing.push('No priority');
  if (!deal.close_date) missing.push('No close date');
  if (!deal.product_tier) missing.push('No product tier');

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
        </div>
        <span className={`text-sm font-mono font-semibold ${textColor}`}>{score}%</span>
      </div>
      {missing.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {missing.map((m) => (
            <span key={m} className="text-[10px] rounded-full px-2 py-0.5 bg-destructive/10 text-destructive font-medium">
              {m}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

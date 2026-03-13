import type { CompetitiveIntel as CompIntel } from '@/lib/types';
import { formatSnakeCase, formatMetricValue, formatPricingValue } from '@/lib/dealRoomUtils';
import { Trophy, BarChart3, DollarSign, Lightbulb } from 'lucide-react';

interface Props {
  intel: CompIntel | null;
  keyMetrics: Record<string, unknown> | null;
  pricingDetails: Record<string, unknown> | null;
}

export function CompetitiveIntel({ intel, keyMetrics, pricingDetails }: Props) {
  const hasIntel = intel && (intel.competitors || intel.differentiators || intel.status_quo_risk);
  const hasMetrics = keyMetrics && Object.keys(keyMetrics).length > 0;
  const hasPricing = pricingDetails && Object.keys(pricingDetails).length > 0;

  if (!hasIntel && !hasMetrics && !hasPricing) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Lightbulb className="h-10 w-10 mb-3 opacity-40" />
        <p className="text-sm">No competitive intelligence available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Competitive Landscape */}
      {hasIntel && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <h3 className="font-semibold text-foreground text-sm">Competitive Position</h3>
          </div>
          {intel.competitors && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Competitors</p>
              <p className="text-sm text-foreground">{intel.competitors}</p>
            </div>
          )}
          {intel.differentiators && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Our Differentiators</p>
              <ul className="space-y-1">
                {intel.differentiators.split(',').map((d, i) => (
                  <li key={i} className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span> {d.trim()}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {intel.status_quo_risk && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Status Quo Risk</p>
              <p className="text-sm text-foreground">{intel.status_quo_risk}</p>
            </div>
          )}
        </div>
      )}

      {/* Key Metrics */}
      {hasMetrics && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-500" />
            <h3 className="font-semibold text-foreground text-sm">Key Metrics</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(keyMetrics!).map(([key, value]) => (
              <div key={key} className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-lg font-bold text-foreground">{formatMetricValue(key, value)}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{formatSnakeCase(key)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pricing */}
      {hasPricing && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-500" />
            <h3 className="font-semibold text-foreground text-sm">Pricing</h3>
          </div>
          <div className="space-y-2">
            {Object.entries(pricingDetails!).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm border-b border-border/50 pb-1.5 last:border-0">
                <span className="text-muted-foreground">{formatSnakeCase(key)}</span>
                <span className="font-medium text-foreground">{formatPricingValue(key, value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

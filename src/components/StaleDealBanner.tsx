import { useState } from 'react';
import type { Deal } from '@/lib/types';
import { AlertTriangle, X } from 'lucide-react';

interface StaleDealBannerProps {
  deals: Deal[];
  onViewStale?: () => void;
}

export function StaleDealBanner({ deals, onViewStale }: StaleDealBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const staleDeals = deals.filter((d) => d.days_since_contact !== null && d.days_since_contact > 21);

  if (dismissed || staleDeals.length === 0) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-risk-medium/10 border border-risk-medium/20">
      <AlertTriangle className="h-4 w-4 text-risk-medium shrink-0" />
      <p className="text-sm font-medium text-foreground flex-1">
        <span className="font-bold text-risk-medium">{staleDeals.length} deal{staleDeals.length > 1 ? 's' : ''}</span>
        {' '}haven't been contacted in 3+ weeks
      </p>
      {onViewStale && (
        <button onClick={onViewStale} className="text-xs font-semibold text-risk-medium hover:underline shrink-0">
          View
        </button>
      )}
      <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground shrink-0">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

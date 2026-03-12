import { cn } from '@/lib/utils';

interface RiskBadgeProps {
  score: number;
  className?: string;
}

export function RiskBadge({ score, className }: RiskBadgeProps) {
  const level = score <= 3 ? 'low' : score <= 6 ? 'medium' : 'high';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-mono font-semibold',
        level === 'low' && 'bg-risk-low/15 text-risk-low',
        level === 'medium' && 'bg-risk-medium/15 text-risk-medium',
        level === 'high' && 'bg-risk-high/15 text-risk-high',
        className,
      )}
    >
      {score}
    </span>
  );
}

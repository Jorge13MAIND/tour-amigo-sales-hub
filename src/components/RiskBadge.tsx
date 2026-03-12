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
        'inline-flex items-center rounded px-1.5 py-0.5 text-xs font-mono font-medium',
        level === 'low' && 'bg-risk-low/20 text-risk-low',
        level === 'medium' && 'bg-risk-medium/20 text-risk-medium',
        level === 'high' && 'bg-risk-high/20 text-risk-high',
        className,
      )}
    >
      {score}
    </span>
  );
}

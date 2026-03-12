import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending_review: 'bg-brand-yellow/20 text-brand-yellow',
  reviewed: 'bg-risk-low/20 text-risk-low',
  outcome_confirmed: 'bg-primary/20 text-primary',
  outcome_different: 'bg-destructive/20 text-destructive',
  pending: 'bg-brand-yellow/20 text-brand-yellow',
  done: 'bg-risk-low/20 text-risk-low',
  skipped: 'bg-muted text-muted-foreground',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const label = status.replace(/_/g, ' ');
  return (
    <span className={cn('inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium capitalize', STATUS_STYLES[status] || 'bg-muted text-muted-foreground', className)}>
      {label}
    </span>
  );
}

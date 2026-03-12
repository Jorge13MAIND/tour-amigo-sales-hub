import { cn } from '@/lib/utils';

interface DaysToCloseBadgeProps {
  days: number | null;
  className?: string;
}

export function DaysToCloseBadge({ days, className }: DaysToCloseBadgeProps) {
  if (days === null) {
    return <span className={cn('text-xs text-muted-foreground', className)}>—</span>;
  }

  if (days < 0) {
    return (
      <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase bg-destructive/15 text-destructive', className)}>
        Overdue
      </span>
    );
  }

  const color = days > 30 ? 'text-risk-low' : days >= 7 ? 'text-risk-medium' : 'text-destructive';

  return (
    <span className={cn('text-sm font-mono font-medium', color, className)}>
      {days}d
    </span>
  );
}

import { cn } from '@/lib/utils';

interface PriorityBadgeProps {
  priority: string | null;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  if (!priority) return <span className="text-xs text-muted-foreground">N/A</span>;
  const p = priority.toLowerCase();
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium',
        (p === 'high' || p === 'urgent') && 'bg-destructive/20 text-destructive',
        p === 'medium' && 'bg-brand-yellow/20 text-brand-yellow',
        p === 'low' && 'bg-muted text-muted-foreground',
        className,
      )}
    >
      {priority}
    </span>
  );
}

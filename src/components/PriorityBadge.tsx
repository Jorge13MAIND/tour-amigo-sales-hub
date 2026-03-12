import { cn } from '@/lib/utils';

interface PriorityBadgeProps {
  priority: string | null;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  if (!priority) return <span className="text-xs text-muted-foreground italic">—</span>;
  const p = priority.toLowerCase();
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize',
        (p === 'high' || p === 'urgent') && 'bg-destructive/15 text-destructive',
        p === 'medium' && 'bg-brand-yellow/15 text-brand-yellow',
        p === 'low' && 'bg-muted text-muted-foreground',
        className,
      )}
    >
      {priority}
    </span>
  );
}

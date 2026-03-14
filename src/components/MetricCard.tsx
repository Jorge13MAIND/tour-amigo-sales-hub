import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function MetricCard({ label, value, subtitle, icon, className }: MetricCardProps) {
  return (
    <div className={cn('rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow', className)}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <p className="mt-2 text-3xl font-bold font-mono text-card-foreground tracking-tight">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

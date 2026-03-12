import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: ReactNode;
  subtitle?: string;
  className?: string;
}

export function MetricCard({ label, value, subtitle, className }: MetricCardProps) {
  return (
    <div className={cn('rounded-lg border bg-card p-4', className)}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-2xl font-semibold font-mono text-foreground">{value}</p>
      {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

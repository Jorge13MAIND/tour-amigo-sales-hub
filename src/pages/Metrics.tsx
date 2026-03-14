import { useMemo } from 'react';
import { useDailyMetrics } from '@/hooks/useDailyMetrics';
import { formatShortDate, formatCurrency } from '@/lib/format';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { STAGE_COLORS } from '@/lib/types';

const TOOLTIP_STYLE = {
  contentStyle: { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 },
  labelStyle: { color: 'hsl(var(--muted-foreground))', fontSize: 11 },
};

const AXIS_TICK = { fontSize: 11, fill: 'hsl(220 10% 46%)' };
const GRID_STROKE = 'hsl(var(--border))';

export default function Metrics() {
  const { data: metrics, isLoading } = useDailyMetrics();

  const stageKeys = useMemo(() => {
    if (!metrics) return [];
    const keys = new Set<string>();
    metrics.forEach((m) => {
      if (m.deals_by_stage) Object.keys(m.deals_by_stage).forEach((k) => keys.add(k));
    });
    return Array.from(keys);
  }, [metrics]);

  if (isLoading) return <Skeleton className="h-96 rounded-lg" />;

  if (!metrics || metrics.length < 2) {
    return (
      <div className="flex items-center justify-center h-64 rounded-lg border bg-card">
        <p className="text-sm text-muted-foreground">Metrics will appear after 2 days of data collection.</p>
      </div>
    );
  }

  const chartData = metrics.map((m) => ({
    date: formatShortDate(m.date),
    pipelineValue: m.total_pipeline_value,
    activeDeals: m.total_active_deals,
    atRisk: m.deals_at_risk,
    ...(m.deals_by_stage || {}),
  }));

  return (
    <div className="space-y-6 max-w-[1400px]">
      <ChartCard title="Pipeline Value Over Time">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
            <XAxis dataKey="date" tick={AXIS_TICK} />
            <YAxis tick={AXIS_TICK} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [formatCurrency(v), 'Value']} />
            <Line type="monotone" dataKey="pipelineValue" stroke="#66B7FF" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Active Deals Over Time">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
            <XAxis dataKey="date" tick={AXIS_TICK} />
            <YAxis tick={AXIS_TICK} />
            <Tooltip {...TOOLTIP_STYLE} />
            <Line type="monotone" dataKey="activeDeals" stroke="#FFC127" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Deals at Risk Over Time">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
            <XAxis dataKey="date" tick={AXIS_TICK} />
            <YAxis tick={AXIS_TICK} />
            <Tooltip {...TOOLTIP_STYLE} />
            <Line type="monotone" dataKey="atRisk" stroke="#E0035D" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {stageKeys.length > 0 && (
        <ChartCard title="Stage Distribution Over Time">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis dataKey="date" tick={AXIS_TICK} />
              <YAxis tick={AXIS_TICK} />
              <Tooltip {...TOOLTIP_STYLE} />
              {stageKeys.map((key) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stackId="stages"
                  fill={STAGE_COLORS[key] || '#888'}
                  stroke={STAGE_COLORS[key] || '#888'}
                  fillOpacity={0.7}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-4 mt-3">
            {stageKeys.map((key) => (
              <div key={key} className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STAGE_COLORS[key] || '#888' }} />
                {key}
              </div>
            ))}
          </div>
        </ChartCard>
      )}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">{title}</p>
      {children}
    </div>
  );
}

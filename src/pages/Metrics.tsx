import { useDailyMetrics } from '@/hooks/useDailyMetrics';
import { formatShortDate, formatCurrency } from '@/lib/format';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

export default function Metrics() {
  const { data: metrics, isLoading } = useDailyMetrics();

  if (isLoading) return <Skeleton className="h-96 rounded-lg" />;

  if (!metrics || metrics.length < 7) {
    return (
      <div className="flex items-center justify-center h-64 rounded-lg border bg-card">
        <p className="text-sm text-muted-foreground">Metrics will appear after 7 days of data collection.</p>
      </div>
    );
  }

  const chartData = metrics.map((m) => ({
    date: formatShortDate(m.date),
    pipelineValue: m.total_pipeline_value,
    activeDeals: m.total_active_deals,
    atRisk: m.deals_at_risk,
  }));

  return (
    <div className="space-y-6 max-w-[1400px]">
      <ChartCard title="Pipeline Value Over Time">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 4% 16%)" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(0 0% 55%)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(0 0% 55%)' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ backgroundColor: 'hsl(0 0% 7%)', border: '1px solid hsl(240 4% 16%)', borderRadius: 6 }}
              labelStyle={{ color: 'hsl(0 0% 55%)', fontSize: 11 }}
              formatter={(v: number) => [formatCurrency(v), 'Value']}
            />
            <Line type="monotone" dataKey="pipelineValue" stroke="#66B7FF" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Active Deals Over Time">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 4% 16%)" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(0 0% 55%)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(0 0% 55%)' }} />
            <Tooltip
              contentStyle={{ backgroundColor: 'hsl(0 0% 7%)', border: '1px solid hsl(240 4% 16%)', borderRadius: 6 }}
              labelStyle={{ color: 'hsl(0 0% 55%)', fontSize: 11 }}
            />
            <Line type="monotone" dataKey="activeDeals" stroke="#FFC127" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Deals at Risk Over Time">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 4% 16%)" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(0 0% 55%)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(0 0% 55%)' }} />
            <Tooltip
              contentStyle={{ backgroundColor: 'hsl(0 0% 7%)', border: '1px solid hsl(240 4% 16%)', borderRadius: 6 }}
              labelStyle={{ color: 'hsl(0 0% 55%)', fontSize: 11 }}
            />
            <Line type="monotone" dataKey="atRisk" stroke="#E0035D" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">{title}</p>
      {children}
    </div>
  );
}

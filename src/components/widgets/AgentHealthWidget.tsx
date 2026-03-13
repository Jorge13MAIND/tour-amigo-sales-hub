import { Heart } from 'lucide-react';
import { useAgentHealth } from '@/hooks/useAgentActivity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AGENT_CONFIG, WEEKLY_AGENTS, WEEKLY_AGENT_STALE_HOURS, DAILY_AGENT_STALE_HOURS, DEAD_AGENT_HOURS } from '@/lib/types';
import type { AgentName } from '@/lib/types';

function getHealthStatus(agentName: string, lastRun: string) {
  const hoursAgo = (Date.now() - new Date(lastRun).getTime()) / 3600000;
  const isWeekly = WEEKLY_AGENTS.includes(agentName as AgentName);
  const staleThreshold = isWeekly ? WEEKLY_AGENT_STALE_HOURS : DAILY_AGENT_STALE_HOURS;

  if (hoursAgo > (isWeekly ? WEEKLY_AGENT_STALE_HOURS * 1.5 : DEAD_AGENT_HOURS)) {
    return { dot: 'bg-red-500', label: 'Dead' };
  }
  if (hoursAgo > staleThreshold) {
    return { dot: 'bg-amber-500', label: 'Stale' };
  }
  return { dot: 'bg-emerald-500', label: 'OK' };
}

function formatAgo(dateStr: string): string {
  const hoursAgo = (Date.now() - new Date(dateStr).getTime()) / 3600000;
  if (hoursAgo < 1) return `${Math.round(hoursAgo * 60)}m ago`;
  if (hoursAgo < 24) return `${Math.round(hoursAgo)}h ago`;
  return `${Math.round(hoursAgo / 24)}d ago`;
}

export function AgentHealthWidget() {
  const { data: health } = useAgentHealth();
  const agents = health || [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Heart className="h-4 w-4 text-red-500" />
          Agent Health
        </CardTitle>
      </CardHeader>
      <CardContent>
        {agents.length === 0 ? (
          <p className="text-xs text-muted-foreground">No agent data yet</p>
        ) : (
          <div className="space-y-1.5">
            {agents.map((agent) => {
              const status = getHealthStatus(agent.agent_name, agent.last_run);
              const config = AGENT_CONFIG[agent.agent_name as AgentName];
              return (
                <div key={agent.agent_name} className="flex items-center gap-2 text-xs">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${status.dot}`} />
                  <span className="text-foreground flex-1 truncate">
                    {config?.label || agent.agent_name}
                  </span>
                  <span className="text-muted-foreground whitespace-nowrap text-[10px]">
                    {formatAgo(agent.last_run)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

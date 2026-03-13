import { Bot } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAgentActivity, useTodayAgentStats } from '@/hooks/useAgentActivity';
import { AgentIcon } from '@/components/AgentIcon';
import { relativeTime } from '@/lib/relativeTime';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AGENT_CONFIG } from '@/lib/types';
import type { AgentName } from '@/lib/types';

export function AgentPulseWidget() {
  const { data: stats } = useTodayAgentStats();
  const { data: recent } = useAgentActivity({ timeRange: 'today' });
  const last5 = (recent || []).slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          Agent Pulse
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs text-muted-foreground space-y-0.5">
          <p>Today: <span className="font-semibold text-foreground">{stats?.total || 0}</span> actions</p>
          <p className="pl-3">Auto-executed: {stats?.autoExecuted || 0}</p>
          <p className="pl-3">Pending approval: {stats?.pendingApproval || 0}</p>
        </div>
        {last5.length > 0 && (
          <div className="space-y-2 pt-1 border-t border-border">
            <p className="text-[10px] text-muted-foreground uppercase font-semibold">Recent</p>
            {last5.map((a) => (
              <div key={a.id} className="flex items-center gap-2">
                <AgentIcon agent={a.agent_name} size={12} />
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-foreground truncate block">
                    {AGENT_CONFIG[a.agent_name as AgentName]?.label}: {a.action_type.replace(/_/g, ' ')}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{relativeTime(a.created_at)}</span>
              </div>
            ))}
          </div>
        )}
        <Link to="/agents" className="text-xs text-primary hover:underline block pt-1">View all →</Link>
      </CardContent>
    </Card>
  );
}

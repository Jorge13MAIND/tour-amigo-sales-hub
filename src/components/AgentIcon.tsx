import {
  Sun, Cog, ClipboardList, Mail, Target, BarChart, Search, TrendingUp
} from 'lucide-react';
import type { AgentName } from '@/lib/types';
import { AGENT_CONFIG } from '@/lib/types';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Sun, Cog, ClipboardList, Mail, Target, BarChart, Search, TrendingUp,
};

interface AgentIconProps {
  agent: AgentName;
  size?: number;
}

export function AgentIcon({ agent, size = 16 }: AgentIconProps) {
  const config = AGENT_CONFIG[agent];
  const IconComponent = ICON_MAP[config?.icon] || Cog;
  const colorClass = config?.color || 'text-muted-foreground';

  return (
    <div className={`flex items-center justify-center rounded-full bg-muted p-1.5 ${colorClass}`}>
      <IconComponent className={`h-${size === 16 ? 4 : 5} w-${size === 16 ? 4 : 5}`} />
    </div>
  );
}

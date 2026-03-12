import { RefreshCw, AlertTriangle } from 'lucide-react';
import { useSyncStatus, useRefreshAll } from '@/hooks/useDeals';
import { useAppContext } from '@/contexts/AppContext';
import { relativeTime } from '@/lib/format';
import { PIPELINE_LABELS, type PipelineKey } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';

export function HeaderBar() {
  const { data: syncTime } = useSyncStatus();
  const refreshAll = useRefreshAll();
  const { selectedPipeline, setSelectedPipeline } = useAppContext();

  const isStale = syncTime ? (Date.now() - new Date(syncTime).getTime()) > 2 * 60 * 60 * 1000 : false;

  return (
    <header className="h-12 flex items-center justify-between border-b border-border px-4 bg-background">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="text-muted-foreground" />
        <Select value={selectedPipeline} onValueChange={(v) => setSelectedPipeline(v as PipelineKey)}>
          <SelectTrigger className="w-[140px] h-8 text-xs border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PIPELINE_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key} className="text-xs">{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-1.5 text-xs ${isStale ? 'text-destructive' : 'text-muted-foreground'}`}>
          {isStale && <AlertTriangle className="h-3 w-3" />}
          <span>Last synced: {syncTime ? relativeTime(syncTime) : 'N/A'}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={refreshAll}>
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>
    </header>
  );
}

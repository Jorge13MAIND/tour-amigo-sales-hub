import { RefreshCw, AlertTriangle } from 'lucide-react';
import { useSyncStatus, useRefreshAll } from '@/hooks/useDeals';
import { useAppContext } from '@/contexts/AppContext';
import { relativeTime } from '@/lib/format';
import { PIPELINE_LABELS, type PipelineKey } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { NotificationCenter } from '@/components/NotificationCenter';

export function HeaderBar() {
  const { data: syncTime } = useSyncStatus();
  const refreshAll = useRefreshAll();
  const { selectedPipeline, setSelectedPipeline } = useAppContext();

  const isStale = syncTime ? (Date.now() - new Date(syncTime).getTime()) > 2 * 60 * 60 * 1000 : false;

  return (
    <header className="h-[52px] flex items-center justify-between px-6 bg-white/70 backdrop-blur-xl backdrop-saturate-150 border-b border-black/[0.06] sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
        <div className="w-px h-6 bg-border" />
        <Select value={selectedPipeline} onValueChange={(v) => setSelectedPipeline(v as PipelineKey)}>
          <SelectTrigger className="w-[140px] h-9 text-sm border-border bg-background font-medium">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PIPELINE_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key} className="text-sm">{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-1.5 text-xs font-medium ${isStale ? 'text-destructive' : 'text-muted-foreground'}`}>
          {isStale && <AlertTriangle className="h-3.5 w-3.5" />}
          <span>Synced {syncTime ? relativeTime(syncTime) : '—'}</span>
        </div>
        <NotificationCenter />
        <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={refreshAll} title="Refresh data">
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>
    </header>
  );
}

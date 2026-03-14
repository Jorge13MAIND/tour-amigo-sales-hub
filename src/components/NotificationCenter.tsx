import { Bell, Check, CheckCheck } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useNotifications, useUnreadCount, useMarkNotificationRead, useMarkAllRead } from '@/hooks/useNotifications';
import { AGENT_CONFIG, type AgentName } from '@/lib/types';
import { relativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';

export function NotificationCenter() {
  const { data: notifications } = useNotifications();
  const { data: unreadCount } = useUnreadCount();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllRead();

  const items = notifications || [];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg relative">
          <Bell className="h-3.5 w-3.5" />
          {(unreadCount ?? 0) > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground animate-pulse">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
          {(unreadCount ?? 0) > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => markAll.mutate()}>
              <CheckCheck className="h-3 w-3 mr-1" /> Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {items.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Check className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
              <p className="text-sm">All caught up</p>
            </div>
          ) : (
            items.map((n) => {
              const agent = AGENT_CONFIG[n.agent_name as AgentName];
              const isHighPriority = n.priority === 'high' || n.priority === 'critical';
              const borderColor = n.priority === 'critical' ? 'border-l-destructive' : n.priority === 'high' ? 'border-l-orange-500' : 'border-l-transparent';

              return (
                <div
                  key={n.id}
                  className={cn(
                    'p-3 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors border-l-2',
                    borderColor,
                    !n.read && 'bg-primary/5'
                  )}
                  onClick={() => { if (!n.read) markRead.mutate(n.id); }}
                >
                  <div className="flex gap-2.5">
                    <div className={cn('mt-0.5 text-xs', agent?.color || 'text-muted-foreground')}>●</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn('text-sm', !n.read ? 'font-semibold text-foreground' : 'text-foreground/80')}>
                          {n.title}
                        </p>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">{relativeTime(n.created_at)}</span>
                      </div>
                      {n.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>}
                      <p className="text-[10px] text-muted-foreground/60 mt-1">{agent?.label || n.agent_name}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

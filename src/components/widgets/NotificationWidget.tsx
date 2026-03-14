import { Bell } from 'lucide-react';
import { useUnreadCount, useNotifications } from '@/hooks/useNotifications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function NotificationWidget() {
  const { data: unreadCount } = useUnreadCount();
  const { data: notifications } = useNotifications();

  const latest = (notifications || []).slice(0, 3);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          Notifications
          {(unreadCount ?? 0) > 0 && (
            <span className="text-[10px] font-bold rounded-full px-1.5 py-0.5 bg-destructive text-destructive-foreground">
              {unreadCount}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {latest.length === 0 ? (
          <p className="text-xs text-muted-foreground">No notifications</p>
        ) : (
          latest.map((n) => (
            <p key={n.id} className="text-xs text-muted-foreground truncate">
              <span className={n.read ? '' : 'font-semibold text-foreground'}>{n.title}</span>
            </p>
          ))
        )}
      </CardContent>
    </Card>
  );
}

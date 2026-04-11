import { Target, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useOutreachStats } from '@/hooks/useOutreachContacts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export function OutreachWidget() {
  const { data: stats } = useOutreachStats();

  const totalSent = stats?.totalSent ?? 0;
  const todaySent = stats?.todaySent ?? 0;
  const replyRate = stats?.replyRate ?? 0;
  const totalReplied = stats?.totalReplied ?? 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Target className="h-4 w-4 text-orange-500" />
          Outreach
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold text-foreground">{totalSent}</span>
          <span className="text-xs text-muted-foreground">emails sent</span>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1"><Send className="h-3 w-3" /> Today</span>
            <span className="font-semibold text-foreground">{todaySent} / 50</span>
          </div>
          <Progress value={Math.min((todaySent / 50) * 100, 100)} className="h-2" />
        </div>

        <div className="text-xs text-muted-foreground space-y-0.5">
          <p>Reply rate: <span className="font-semibold text-foreground">{(replyRate * 100).toFixed(1)}%</span> ({totalReplied} replies)</p>
        </div>

        <Link to="/outreach" className="text-xs text-primary hover:underline block pt-1">View dashboard →</Link>
      </CardContent>
    </Card>
  );
}

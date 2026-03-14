import { Target, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useOutreachStats } from '@/hooks/useOutreachContacts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export function OutreachWidget() {
  const { data: stats } = useOutreachStats();

  const todaySent = stats?.todaySent ?? 0;
  const weekReplies = stats?.weekReplies ?? 0;
  const weekPositive = stats?.weekPositive ?? 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Target className="h-4 w-4 text-orange-500" />
          Outreach Today
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1"><Send className="h-3 w-3" /> Enrolled</span>
            <span className="font-semibold text-foreground">{todaySent} / 50</span>
          </div>
          <Progress value={Math.min((todaySent / 50) * 100, 100)} className="h-2" />
        </div>

        <div className="text-xs text-muted-foreground space-y-0.5">
          <p>This week: <span className="font-semibold text-foreground">{weekReplies}</span> replies (<span className="font-semibold text-emerald-600 dark:text-emerald-400">{weekPositive}</span> positive)</p>
        </div>

        <Link to="/outreach" className="text-xs text-primary hover:underline block pt-1">View dashboard →</Link>
      </CardContent>
    </Card>
  );
}

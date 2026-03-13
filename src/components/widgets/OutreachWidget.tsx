import { Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAgentActivity } from '@/hooks/useAgentActivity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export function OutreachWidget() {
  const { data: activities } = useAgentActivity({ timeRange: '7d' });

  const all = activities || [];
  const prospectsFound = all.filter((a) => a.action_type === 'prospect_found').length;
  const emailsSent = all.filter((a) => a.action_type === 'follow_up_sent' || a.action_type === 'email_drafted' || a.action_type === 'cold_email_sent').length;
  const total = Math.max(prospectsFound, emailsSent, 1);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Target className="h-4 w-4 text-orange-500" />
          Outreach This Week
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs text-muted-foreground space-y-0.5">
          <p>Prospects found: <span className="font-semibold text-foreground">{prospectsFound}</span></p>
          <p>Emails sent: <span className="font-semibold text-foreground">{emailsSent}</span></p>
        </div>

        <div>
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>Sent vs found</span>
            <span className="text-foreground font-medium">{emailsSent}/{prospectsFound || '—'}</span>
          </div>
          <Progress value={prospectsFound > 0 ? (emailsSent / prospectsFound) * 100 : 0} className="h-2" />
        </div>

        <Link to="/agents" className="text-xs text-primary hover:underline block pt-1">View details →</Link>
      </CardContent>
    </Card>
  );
}

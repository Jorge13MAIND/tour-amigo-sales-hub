import { ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFollowUpPlans } from '@/hooks/useFollowUpPlans';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const TYPE_LABELS: Record<string, string> = {
  post_demo: 'Post-demo',
  stale_reengagement: 'Stale re-engage',
  cold_outreach: 'Cold outreach',
  close_date_recovery: 'Close date recovery',
};

export function FollowUpWidget() {
  const { data: plans } = useFollowUpPlans({ status: 'active' });
  const active = plans || [];

  const emailsDue = active.reduce((count, plan) => {
    const steps = Array.isArray(plan.steps) ? plan.steps : [];
    return count + steps.filter((s) => s.status === 'pending').length;
  }, 0);

  // Group by type
  const byType: Record<string, number> = {};
  for (const plan of active) {
    const t = plan.plan_type;
    byType[t] = (byType[t] || 0) + 1;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary" />
          Follow-Up Plans
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs text-muted-foreground space-y-0.5">
          <p>Active plans: <span className="font-semibold text-foreground">{active.length}</span></p>
          <p className="pl-3">Emails pending: {emailsDue}</p>
        </div>

        {Object.keys(byType).length > 0 && (
          <div className="space-y-1.5 pt-1 border-t border-border">
            <p className="text-[10px] text-muted-foreground uppercase font-semibold">By type</p>
            {Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
              <div key={type} className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span className="text-muted-foreground">{TYPE_LABELS[type] || type}</span>
                    <span className="text-foreground font-medium">{count}</span>
                  </div>
                  <Progress value={(count / active.length) * 100} className="h-1.5" />
                </div>
              </div>
            ))}
          </div>
        )}
        <Link to="/follow-ups" className="text-xs text-primary hover:underline block pt-1">View all →</Link>
      </CardContent>
    </Card>
  );
}

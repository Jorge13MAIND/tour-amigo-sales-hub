import type { Task } from '@/lib/types';
import { PriorityBadge } from './PriorityBadge';
import { useAppContext } from '@/contexts/AppContext';
import { CheckCircle2 } from 'lucide-react';

interface TodaysTasksProps {
  tasks: Task[];
}

export function TodaysTasks({ tasks }: TodaysTasksProps) {
  const { setSelectedDealId } = useAppContext();

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Today's Tasks</p>
        {tasks.length > 0 && <span className="text-xs font-mono font-semibold bg-primary/10 text-primary rounded-full px-2 py-0.5">{tasks.length}</span>}
      </div>
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
          <CheckCircle2 className="h-8 w-8 text-risk-low opacity-60" />
          <p className="text-sm">All clear for today</p>
        </div>
      ) : (
        <div className="space-y-1">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
              <PriorityBadge priority={task.priority} className="mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-card-foreground leading-snug">{task.title}</p>
                {task.deals && (
                  <button
                    onClick={() => task.deal_id && setSelectedDealId(task.deal_id)}
                    className="text-xs text-primary hover:underline mt-0.5"
                  >
                    {(task.deals as any).deal_name}
                  </button>
                )}
              </div>
              <span className="text-[10px] rounded-full px-2 py-0.5 bg-muted text-muted-foreground capitalize font-medium shrink-0">{task.source.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

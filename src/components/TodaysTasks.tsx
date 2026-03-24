import type { Task } from '@/lib/types';
import { PriorityBadge } from './PriorityBadge';
import { useAppContext } from '@/contexts/AppContext';
import { Coffee } from 'lucide-react';

interface TodaysTasksProps {
  tasks: Task[];
  overdueCount?: number;
}

export function TodaysTasks({ tasks, overdueCount = 0 }: TodaysTasksProps) {
  const { setSelectedDealId } = useAppContext();

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Today's Tasks</p>
          {overdueCount > 0 && (
            <span className="text-[10px] font-bold rounded-full px-1.5 py-0.5 bg-destructive text-destructive-foreground">
              {overdueCount} overdue
            </span>
          )}
        </div>
        {tasks.length > 0 && <span className="text-xs font-mono font-semibold bg-primary/10 text-primary rounded-full px-2 py-0.5">{tasks.length}</span>}
      </div>
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
          <Coffee className="h-8 w-8 opacity-40" />
          <div className="text-center">
            <p className="text-sm font-medium">No tasks for today</p>
            <p className="text-xs mt-1 max-w-[200px]">Morning routine generates tasks. Run it in Claude to populate this section.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {tasks.map((task) => {
            const isOverdue = task.due_date && new Date(task.due_date) < new Date(new Date().toISOString().split('T')[0]);
            return (
              <div key={task.id} className={`flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors ${isOverdue ? 'bg-destructive/5' : ''}`}>
                <PriorityBadge priority={task.priority} className="mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-card-foreground leading-snug">{task.title}</p>
                  {task.deals && (
                    <button
                      onClick={() => task.deal_id && setSelectedDealId(task.deal_id)}
                      className="text-xs text-primary hover:underline mt-0.5"
                    >
                      {task.deals.deal_name}
                    </button>
                  )}
                </div>
                <span className="text-[10px] rounded-full px-2 py-0.5 bg-muted text-muted-foreground capitalize font-medium shrink-0">{task.source.replace('_', ' ')}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

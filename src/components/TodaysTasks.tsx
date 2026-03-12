import type { Task } from '@/lib/types';
import { PriorityBadge } from './PriorityBadge';
import { useAppContext } from '@/contexts/AppContext';

interface TodaysTasksProps {
  tasks: Task[];
}

export function TodaysTasks({ tasks }: TodaysTasksProps) {
  const { setSelectedDealId } = useAppContext();

  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Today's Tasks</p>
      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No pending tasks for today.</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
              <PriorityBadge priority={task.priority} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{task.title}</p>
                {task.deals && (
                  <button
                    onClick={() => task.deal_id && setSelectedDealId(task.deal_id)}
                    className="text-xs text-primary hover:underline"
                  >
                    {(task.deals as any).deal_name}
                  </button>
                )}
              </div>
              <span className="text-[10px] rounded px-1.5 py-0.5 bg-muted text-muted-foreground capitalize">{task.source.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

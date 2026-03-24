import type { Task } from '@/lib/types';
import { PriorityBadge } from './PriorityBadge';
import { useAppContext } from '@/contexts/AppContext';
import { formatDate } from '@/lib/format';

interface UpcomingTasksProps {
  tasks: Task[];
}

export function UpcomingTasks({ tasks }: UpcomingTasksProps) {
  const { setSelectedDealId } = useAppContext();

  if (tasks.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Upcoming (next 7 days)</p>
      <div className="space-y-0.5">
        {tasks.map((task) => (
          <div key={task.id} className="flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-accent/50 transition-colors text-sm">
            <span className="text-xs font-mono text-muted-foreground shrink-0 w-16">{formatDate(task.due_date)?.replace(/, \d{4}/, '')}</span>
            <span className="flex-1 min-w-0 truncate text-card-foreground">{task.title}</span>
            {task.deals && (
              <button
                onClick={() => task.deal_id && setSelectedDealId(task.deal_id)}
                className="text-xs text-primary hover:underline shrink-0 truncate max-w-[100px]"
              >
                {task.deals.deal_name}
              </button>
            )}
            <PriorityBadge priority={task.priority} />
          </div>
        ))}
      </div>
    </div>
  );
}

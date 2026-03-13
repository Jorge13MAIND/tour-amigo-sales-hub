import { useState } from 'react';
import { Lightbulb, TrendingUp, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { useImprovementTasks } from '@/hooks/useImprovementTasks';
import { usePlaybooks } from '@/hooks/usePlaybooks';
import { relativeTime } from '@/lib/relativeTime';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { Task, Playbook } from '@/lib/types';

const PRIORITY_STYLES: Record<string, string> = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
};

const STATUS_STYLES: Record<string, { label: string; classes: string }> = {
  pending: { label: 'Pending', classes: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  completed: { label: 'Done', classes: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
};

function getWeekGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays < 7) return 'This Week';
  if (diffDays < 14) return 'Last Week';
  return 'Earlier';
}

function groupByWeek(tasks: Task[]): Record<string, Task[]> {
  const groups: Record<string, Task[]> = {};
  for (const task of tasks) {
    const group = getWeekGroup(task.created_at);
    if (!groups[group]) groups[group] = [];
    groups[group].push(task);
  }
  return groups;
}

function ImprovementCard({ task }: { task: Task }) {
  const priorityStyle = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium;
  const statusStyle = STATUS_STYLES[task.status] || STATUS_STYLES.pending;

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <Lightbulb className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <span className="text-sm font-semibold text-foreground">{task.title}</span>
              <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${priorityStyle}`}>
                {task.priority}
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
              {relativeTime(task.created_at)}
            </span>
          </div>
          {task.description && (
            <p className="text-sm text-muted-foreground leading-relaxed mt-1">{task.description}</p>
          )}
          <div className="mt-2">
            <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${statusStyle.classes}`}>
              {statusStyle.label}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

function PlaybookCard({ playbook }: { playbook: Playbook }) {
  return (
    <Card className="p-3 bg-muted/30">
      <div className="flex items-start gap-2">
        <BookOpen className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-foreground">{playbook.name}</span>
            <div className="flex items-center gap-2 shrink-0">
              {playbook.active ? (
                <span className="text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-full px-1.5 py-0.5">Active</span>
              ) : (
                <span className="text-[9px] bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 rounded-full px-1.5 py-0.5">Inactive</span>
              )}
            </div>
          </div>
          {playbook.description && (
            <p className="text-xs text-muted-foreground mt-0.5">{playbook.description}</p>
          )}
          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground/70">
            <span>Used {playbook.times_used}x</span>
            {playbook.success_rate != null && <span>Success: {Math.round(playbook.success_rate)}%</span>}
            <span className="capitalize">{playbook.autonomy_level}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function Improvements() {
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [playbooksOpen, setPlaybooksOpen] = useState(false);

  const { data: tasks, isLoading } = useImprovementTasks({
    priority: priorityFilter,
    status: statusFilter,
  });
  const { data: playbooks } = usePlaybooks();

  const grouped = groupByWeek(tasks || []);
  const weekOrder = ['This Week', 'Last Week', 'Earlier'];

  return (
    <div className="space-y-5 max-w-[1000px]">
      <div>
        <h1 className="text-xl font-bold text-foreground">Continuous Improvement</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Powered by weekly analysis</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[140px] h-9 text-sm">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-9 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : !(tasks?.length) ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <TrendingUp className="h-10 w-10" />
          <p className="text-sm text-center max-w-xs">
            No improvement suggestions yet. The ATLAS Improvement Scanner runs every Friday at 3pm and analyzes what worked and what didn't.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {weekOrder.map((week) => {
            const items = grouped[week];
            if (!items?.length) return null;
            return (
              <div key={week}>
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{week}</h2>
                <div className="space-y-3">
                  {items.map((task) => (
                    <ImprovementCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Playbooks Section */}
      {playbooks && playbooks.length > 0 && (
        <Collapsible open={playbooksOpen} onOpenChange={setPlaybooksOpen} className="border-t border-border pt-4">
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors w-full">
            <BookOpen className="h-4 w-4" />
            Playbooks ({playbooks.length})
            {playbooksOpen ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-2">
            {playbooks.map((pb) => (
              <PlaybookCard key={pb.id} playbook={pb} />
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface TaskFormProps {
  dealId: number | null;
  onSubmit: (task: { deal_id: number | null; title: string; priority: string; due_date?: string }) => void;
  onCancel?: () => void;
  isPending?: boolean;
  isLoading?: boolean;
}

export function TaskForm({ dealId, onSubmit, onCancel, isPending, isLoading }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const busy = isPending || isLoading;

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSubmit({ deal_id: dealId, title: title.trim(), priority, due_date: dueDate || undefined });
    setTitle('');
    setPriority('medium');
    setDueDate('');
  };

  return (
    <div className="space-y-2 rounded-lg border border-border p-3 bg-background">
      <Input
        placeholder="Task title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="h-8 text-xs"
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        autoFocus
      />
      <div className="flex gap-2">
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="h-8 text-xs flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="high" className="text-xs">High</SelectItem>
            <SelectItem value="medium" className="text-xs">Medium</SelectItem>
            <SelectItem value="low" className="text-xs">Low</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="h-8 text-xs flex-1"
        />
      </div>
      <div className="flex gap-2 justify-end">
        {onCancel && <Button variant="ghost" size="sm" onClick={onCancel} className="text-xs h-7">Cancel</Button>}
        <Button size="sm" onClick={handleSubmit} disabled={!title.trim() || busy} className="text-xs h-7">
          {busy ? 'Creating...' : 'Create'}
        </Button>
      </div>
    </div>
  );
}

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

async function callProxy(action: string, payload: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('hubspot-proxy', {
    body: { action, payload },
  });
  if (error) throw new Error(error.message || 'Edge function error');
  if (data?.error) throw new Error(data.error);
  return data;
}

export function useUpdateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { deal_id: number; fields: Record<string, unknown> }) =>
      callProxy('update_deal', vars),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deals'] });
      qc.invalidateQueries({ queryKey: ['deal'] });
      toast({ title: 'Deal updated', description: 'Changes synced to HubSpot.' });
    },
    onError: (err: Error) => {
      toast({ title: 'Update failed', description: err.message, variant: 'destructive' });
    },
  });
}

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { deal_id: number; content: string }) =>
      callProxy('create_note', vars),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deal-room-feed'] });
      toast({ title: 'Note added' });
    },
    onError: (err: Error) => {
      toast({ title: 'Note failed', description: err.message, variant: 'destructive' });
    },
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { deal_id: number | null; title: string; priority: string; due_date?: string; description?: string }) =>
      callProxy('create_task', vars),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deal-tasks'] });
      qc.invalidateQueries({ queryKey: ['tasks-today'] });
      qc.invalidateQueries({ queryKey: ['tasks-upcoming'] });
      toast({ title: 'Task created' });
    },
    onError: (err: Error) => {
      toast({ title: 'Task creation failed', description: err.message, variant: 'destructive' });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { task_id: string; fields: Record<string, unknown> }) =>
      callProxy('update_task', vars),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deal-tasks'] });
      qc.invalidateQueries({ queryKey: ['tasks-today'] });
      toast({ title: 'Task updated' });
    },
    onError: (err: Error) => {
      toast({ title: 'Task update failed', description: err.message, variant: 'destructive' });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { task_id: string }) =>
      callProxy('delete_task', vars),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deal-tasks'] });
      qc.invalidateQueries({ queryKey: ['tasks-today'] });
      toast({ title: 'Task deleted' });
    },
    onError: (err: Error) => {
      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' });
    },
  });
}

export function useUpdateDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { decision_id: string; fields: Record<string, unknown> }) =>
      callProxy('update_decision', vars),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deal-decisions'] });
      qc.invalidateQueries({ queryKey: ['decisions'] });
      toast({ title: 'Decision updated' });
    },
    onError: (err: Error) => {
      toast({ title: 'Decision update failed', description: err.message, variant: 'destructive' });
    },
  });
}

export function useUpdateDealRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { room_id: string; fields: Record<string, unknown> }) =>
      callProxy('update_deal_room', vars),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deal-room'] });
      qc.invalidateQueries({ queryKey: ['deal-rooms'] });
      toast({ title: 'Deal room updated' });
    },
    onError: (err: Error) => {
      toast({ title: 'Update failed', description: err.message, variant: 'destructive' });
    },
  });
}

export function useUpsertStakeholder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { stakeholder: Record<string, unknown> }) =>
      callProxy('upsert_stakeholder', vars),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deal-stakeholders'] });
      toast({ title: 'Stakeholder saved' });
    },
    onError: (err: Error) => {
      toast({ title: 'Stakeholder save failed', description: err.message, variant: 'destructive' });
    },
  });
}

export function useDeleteStakeholder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { stakeholder_id: string }) =>
      callProxy('delete_stakeholder', vars),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deal-stakeholders'] });
      toast({ title: 'Stakeholder removed' });
    },
    onError: (err: Error) => {
      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' });
    },
  });
}

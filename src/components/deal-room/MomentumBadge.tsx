interface Props {
  status: 'active' | 'won' | 'lost' | 'paused';
  closePlan: { date: string; status: string }[];
}

export function MomentumBadge({ status, closePlan }: Props) {
  if (status !== 'active' || !closePlan.length) return null;

  // Check if recent steps are being completed on time
  const today = new Date().toISOString().split('T')[0];
  const pastSteps = closePlan.filter((s) => s.date <= today);
  const completedPast = pastSteps.filter((s) => s.status === 'completed').length;

  if (pastSteps.length === 0) return null;

  const completionRate = completedPast / pastSteps.length;
  const isAccelerating = completionRate >= 0.7;

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold rounded-full px-2.5 py-1 ${
      isAccelerating
        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
        : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
    }`}>
      {isAccelerating ? '🚀 ACCELERATING' : '⏸️ STALLED'}
    </span>
  );
}

import type { AgentResult } from '@/lib/types';

const RESULT_STYLES: Record<string, { label: string; classes: string }> = {
  success: { label: 'Success', classes: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
  auto_executed: { label: 'Auto-Executed', classes: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
  needs_approval: { label: 'Needs Approval', classes: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  failed: { label: 'Failed', classes: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
  skipped: { label: 'Skipped', classes: 'bg-gray-100 text-gray-600 dark:bg-gray-800/40 dark:text-gray-400' },
};

export function ResultBadge({ result }: { result: AgentResult | null }) {
  const style = RESULT_STYLES[result || ''] || RESULT_STYLES.skipped;
  return (
    <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 whitespace-nowrap ${style.classes}`}>
      {style.label}
    </span>
  );
}

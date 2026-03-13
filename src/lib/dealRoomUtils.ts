import type { ClosePlanStep } from './types';

export type ComputedStepStatus = 'completed' | 'today' | 'upcoming' | 'pending';

export function computeStepStatus(step: ClosePlanStep): ComputedStepStatus {
  if (step.status === 'completed') return 'completed';

  const today = new Date().toISOString().split('T')[0];
  const stepDate = step.date;

  if (stepDate < today) return 'completed';
  if (stepDate === today) return 'today';

  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const dayAfter = new Date(Date.now() + 172800000).toISOString().split('T')[0];
  if (stepDate === tomorrow || stepDate === dayAfter) return 'upcoming';
  return 'pending';
}

export function formatSnakeCase(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bArr\b/, 'ARR')
    .replace(/\bY1\b/, 'Y1')
    .replace(/\bSap\b/, 'SAP');
}

const CURRENCY_KEYS = ['arr', 'value', 'fee', 'paid', 'subscription', 'concession', 'monthly'];

export function formatMetricValue(key: string, value: unknown): string {
  if (typeof value === 'number') {
    const isCurrency = CURRENCY_KEYS.some((k) => key.toLowerCase().includes(k));
    if (isCurrency) {
      return value >= 1000
        ? `$${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K`
        : `$${value.toLocaleString()}`;
    }
    return value.toLocaleString();
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value ?? '—');
}

export function formatPricingValue(key: string, value: unknown): string {
  if (typeof value === 'number') {
    const formatted = `$${value.toLocaleString()}`;
    if (key.includes('per_pax') || key.includes('booking_fee')) return `${formatted}/pax`;
    if (key.includes('per_user')) return `${formatted}/user/mo`;
    if (key.includes('monthly') || key.includes('concession_monthly')) return `${formatted}/mo`;
    return formatted;
  }
  return String(value ?? '—');
}

export function daysRemaining(targetDate: string | null): number | null {
  if (!targetDate) return null;
  const diff = new Date(targetDate).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

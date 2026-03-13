import { describe, it, expect } from 'vitest';
import { computeStepStatus, formatSnakeCase, formatMetricValue, formatPricingValue, daysRemaining } from '@/lib/dealRoomUtils';

describe('computeStepStatus', () => {
  it('returns completed for manually completed steps', () => {
    expect(computeStepStatus({ day: 'D-10', date: '2099-12-31', focus: '', actions: '', owner: '', deliverable: '', risk: '', status: 'completed' })).toBe('completed');
  });

  it('returns completed for past dates', () => {
    expect(computeStepStatus({ day: 'D-10', date: '2020-01-01', focus: '', actions: '', owner: '', deliverable: '', risk: '', status: 'pending' })).toBe('completed');
  });

  it('returns today for today\'s date', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(computeStepStatus({ day: 'D-8', date: today, focus: '', actions: '', owner: '', deliverable: '', risk: '', status: 'upcoming' })).toBe('today');
  });

  it('returns upcoming for tomorrow', () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    expect(computeStepStatus({ day: 'D-7', date: tomorrow, focus: '', actions: '', owner: '', deliverable: '', risk: '', status: 'pending' })).toBe('upcoming');
  });

  it('returns pending for far future dates', () => {
    expect(computeStepStatus({ day: 'D-1', date: '2099-12-31', focus: '', actions: '', owner: '', deliverable: '', risk: '', status: 'pending' })).toBe('pending');
  });
});

describe('formatSnakeCase', () => {
  it('converts snake_case to Title Case', () => {
    expect(formatSnakeCase('deep_dive_paid')).toBe('Deep Dive Paid');
    expect(formatSnakeCase('total_y1_value')).toBe('Total Y1 Value');
  });
});

describe('formatMetricValue', () => {
  it('formats currency values with $ prefix', () => {
    expect(formatMetricValue('arr', 85000)).toBe('$85K');
    expect(formatMetricValue('total_value', 114000)).toBe('$114K');
  });

  it('formats non-currency numbers plainly', () => {
    expect(formatMetricValue('users', 45)).toBe('45');
  });

  it('handles booleans', () => {
    expect(formatMetricValue('contract_signed', true)).toBe('Yes');
    expect(formatMetricValue('contract_signed', false)).toBe('No');
  });
});

describe('formatPricingValue', () => {
  it('adds /pax for booking fee', () => {
    expect(formatPricingValue('booking_fee', 10)).toBe('$10/pax');
  });

  it('adds /user/mo for per_user', () => {
    expect(formatPricingValue('per_user_monthly', 159)).toBe('$159/user/mo');
  });

  it('adds /mo for monthly values', () => {
    expect(formatPricingValue('monthly_subscription', 7155)).toBe('$7,155/mo');
  });
});

describe('daysRemaining', () => {
  it('returns null for null input', () => {
    expect(daysRemaining(null)).toBe(null);
  });

  it('returns negative for past dates', () => {
    const result = daysRemaining('2020-01-01');
    expect(result).toBeLessThan(0);
  });

  it('returns positive for future dates', () => {
    const result = daysRemaining('2099-12-31');
    expect(result).toBeGreaterThan(0);
  });
});

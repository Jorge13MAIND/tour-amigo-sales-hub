import type { Deal } from '@/lib/types';

/**
 * Computes a pipeline health score 0-100 from active deals.
 * - 30% avg data quality
 * - 30% deals contacted within 14 days
 * - 20% deals with next steps defined
 * - 20% proposal-stage deals with amounts filled
 */
export function computeHealthScore(deals: Deal[]): number {
  if (deals.length === 0) return 0;

  const avgQuality = deals.reduce((s, d) => s + (d.data_quality_score ?? 0), 0) / deals.length;
  const recentContact = deals.filter((d) => d.days_since_contact !== null && d.days_since_contact < 14).length / deals.length * 100;
  const hasNextStep = deals.filter((d) => d.has_next_step).length / deals.length * 100;

  const proposalDeals = deals.filter((d) => d.deal_stage_label === 'Proposal Sent');
  const proposalWithAmount = proposalDeals.length > 0
    ? proposalDeals.filter((d) => d.has_amount).length / proposalDeals.length * 100
    : 100; // no penalty if no proposal deals

  return Math.round(
    avgQuality * 0.3 +
    recentContact * 0.3 +
    hasNextStep * 0.2 +
    proposalWithAmount * 0.2
  );
}

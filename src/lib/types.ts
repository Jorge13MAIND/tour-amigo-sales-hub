export interface Deal {
  id: number;
  deal_name: string;
  deal_stage: string;
  deal_stage_label: string;
  amount: number | null;
  close_date: string | null;
  priority: string | null;
  next_step: string | null;
  pipeline: string;
  competitor: string | null;
  product_tier: string | null;
  number_of_users: string | null;
  roadblocks: string | null;
  last_contacted: string | null;
  risk_score: number;
  status: string;
  hubspot_url: string | null;
  updated_at: string | null;
  synced_at: string | null;
  // Computed columns
  days_since_contact: number | null;
  days_to_close: number | null;
  days_in_stage: number | null;
  data_quality_score: number | null;
  has_amount: boolean | null;
  has_competitor: boolean | null;
  has_next_step: boolean | null;
}

export interface DailyMetric {
  id: string;
  date: string;
  total_active_deals: number;
  total_pipeline_value: number;
  deals_at_risk: number;
  deals_by_stage: Record<string, number>;
  avg_days_to_close: number;
  win_rate: number;
  created_at: string;
}

export interface Task {
  id: string;
  deal_id: number | null;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  source: string;
  due_date: string | null;
  created_at: string;
  completed_at: string | null;
  deals?: Deal;
}

export interface Decision {
  id: string;
  deal_id: number | null;
  deal_name: string;
  decision_type: string;
  decision: string;
  reasoning: string;
  expected_outcome: string | null;
  review_date: string | null;
  status: string;
  actual_outcome: string | null;
  created_at: string;
}

export type PipelineKey = 'default' | '96925713' | '781108352';

export const PIPELINE_LABELS: Record<PipelineKey, string> = {
  default: 'Sales',
  '96925713': 'Reseller',
  '781108352': 'Lite',
};

export const EXCLUDED_STAGES = ['266180272', '168848473', '168848474'];

export const STAGE_COLORS: Record<string, string> = {
  'Demo Scheduled': '#14b8a6',
  'Additional Demo': '#0d9488',
  'Demo Completed': '#66B7FF',
  'Proposal Sent': '#a855f7',
  'Negotiation': '#E0035D',
};

export const PRIORITY_ORDER: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

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

export type AgentName =
  | 'morning-brief'
  | 'task-processor'
  | 'weekly-report'
  | 'calendar-prep'
  | 'inbound-processor'
  | 'outreach-engine'
  | 'improvement-scan'
  | 'deal-monitor';

export type AgentResult = 'success' | 'auto_executed' | 'needs_approval' | 'failed' | 'skipped';

export interface AgentActivity {
  id: string;
  agent_name: AgentName;
  action_type: string;
  deal_id: number | null;
  deal_name: string | null;
  description: string;
  result: AgentResult | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export type FollowUpStepStatus = 'pending' | 'sent' | 'skipped' | 'completed';

export interface FollowUpStep {
  step_number: number;
  action: string;
  template: string;
  delay_days: number;
  status: FollowUpStepStatus;
  sent_at: string | null;
  variables: Record<string, string>;
}

export interface FollowUpPlan {
  id: string;
  deal_id: number;
  deal_name: string;
  plan_type: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  steps: FollowUpStep[];
  trigger_reason: string | null;
  playbook_used: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Playbook {
  id: string;
  name: string;
  trigger_condition: Record<string, unknown>;
  steps: Record<string, unknown>[];
  autonomy_level: string;
  active: boolean;
  description: string | null;
  success_rate: number | null;
  times_used: number;
  created_at: string;
}

export const AGENT_CONFIG: Record<AgentName, { icon: string; color: string; label: string }> = {
  'morning-brief': { icon: 'Sun', color: 'text-amber-500', label: 'Morning Brief' },
  'task-processor': { icon: 'Cog', color: 'text-blue-500', label: 'Task Processor' },
  'calendar-prep': { icon: 'ClipboardList', color: 'text-purple-500', label: 'Calendar Prep' },
  'inbound-processor': { icon: 'Mail', color: 'text-emerald-500', label: 'Inbound Processor' },
  'outreach-engine': { icon: 'Target', color: 'text-orange-500', label: 'Outreach Engine' },
  'improvement-scan': { icon: 'BarChart', color: 'text-teal-500', label: 'Improvement Scan' },
  'deal-monitor': { icon: 'Search', color: 'text-slate-500', label: 'Deal Monitor' },
  'weekly-report': { icon: 'TrendingUp', color: 'text-indigo-500', label: 'Weekly Report' },
};

/** Agents that run weekly — use longer staleness threshold */
export const WEEKLY_AGENTS: AgentName[] = ['improvement-scan', 'weekly-report'];
export const WEEKLY_AGENT_STALE_HOURS = 192; // 8 days
export const DAILY_AGENT_STALE_HOURS = 25;
export const DEAD_AGENT_HOURS = 72;

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

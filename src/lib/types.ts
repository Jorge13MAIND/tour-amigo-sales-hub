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
  prospects_found: number | null;
  cold_emails_sent: number | null;
  outreach_response_rate: number | null;
  active_follow_up_plans: number | null;
  agent_actions_today: number | null;
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
  | 'deal-monitor'
  | 'deal-room-sync'
  | 'outreach-eod'
  | 'command-center';

export type AgentResult = 'success' | 'auto_executed' | 'needs_approval' | 'approved' | 'rejected' | 'failed' | 'skipped';

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
  'deal-room-sync': { icon: 'Building2', color: 'text-cyan-500', label: 'Deal Room Sync' },
  'outreach-eod': { icon: 'BarChart3', color: 'text-rose-500', label: 'Outreach EOD' },
  'command-center': { icon: 'ShieldCheck', color: 'text-violet-500', label: 'Command Center' },
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

// ── v3 Deal Rooms ──

export interface ClosePlanStep {
  day: string;
  date: string;
  focus: string;
  actions: string;
  owner: string;
  deliverable: string;
  risk: string;
  status: string;
}

export interface DealRisk {
  risk: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  mitigation: string;
  status: 'open' | 'mitigated' | 'escalated';
}

export interface CompetitiveIntel {
  competitors: string;
  differentiators: string;
  status_quo_risk: string;
}

export interface DealRoom {
  id: string;
  deal_id: number;
  deal_name: string;
  room_type: 'enterprise' | 'mid_market' | 'standard';
  status: 'active' | 'won' | 'lost' | 'paused';
  close_plan: ClosePlanStep[];
  risks: DealRisk[];
  competitive_intel: CompetitiveIntel | null;
  key_metrics: Record<string, unknown> | null;
  target_close_date: string | null;
  close_probability: number | null;
  total_contract_value: number | null;
  pricing_details: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deals?: Deal;
}

export interface DealStakeholder {
  id: string;
  deal_id: number;
  name: string;
  role: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  stakeholder_type: 'champion' | 'economic_buyer' | 'technical_buyer' | 'blocker' | 'influencer' | 'user' | 'executive';
  engagement_score: number;
  last_interaction: string | null;
  interaction_count: number;
  sentiment: 'positive' | 'neutral' | 'negative' | 'unknown';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type FeedSource = 'email' | 'calendar' | 'slack' | 'drive' | 'hubspot' | 'agent' | 'transcript' | 'manual';

export interface DealRoomFeedItem {
  id: string;
  deal_id: number;
  source: FeedSource;
  event_type: string;
  title: string;
  summary: string | null;
  raw_data: Record<string, unknown> | null;
  stakeholder_name: string | null;
  stakeholder_email: string | null;
  sentiment: 'positive' | 'neutral' | 'negative' | 'unknown' | null;
  action_required: boolean;
  action_description: string | null;
  external_url: string | null;
  external_id: string | null;
  created_at: string;
}

export type DocType = 'transcript' | 'proposal' | 'contract' | 'presentation' | 'sow' | 'email_thread' | 'drive_file' | 'meeting_notes' | 'other';

export interface DealDocument {
  id: string;
  deal_id: number;
  doc_type: DocType;
  title: string;
  source: string;
  external_url: string | null;
  external_id: string | null;
  content_summary: string | null;
  key_points: string[] | null;
  stakeholders_mentioned: string[] | null;
  action_items: string[] | null;
  processed: boolean;
  created_at: string;
}

// ── Outreach ──

export interface OutreachContact {
  id: string;
  hubspot_contact_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  title: string | null;
  tier: 'tier_1' | 'tier_2' | 'tier_3' | null;
  icp_score: number;
  research_data: Record<string, unknown>;
  skip_reason: string | null;
  status: 'pending' | 'researched' | 'enrolled' | 'replied' | 'bounced' | 'skipped' | 'converted';
  email_angle: string | null;
  subject_line_text: string | null;
  email_sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  replied_at: string | null;
  reply_sentiment: 'positive' | 'negative' | null;
  bounced: boolean;
  meeting_booked: boolean;
  hubspot_deal_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AtlasNotification {
  id: string;
  agent_name: string;
  notification_type: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  title: string;
  body: string | null;
  metadata: Record<string, unknown>;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface OutreachMetric {
  id: string;
  period_type: 'daily' | 'weekly' | 'monthly';
  period_start: string;
  period_end: string;
  emails_sent: number;
  emails_delivered: number;
  emails_bounced: number;
  emails_opened: number;
  unique_opens: number;
  emails_clicked: number;
  emails_replied: number;
  positive_replies: number;
  negative_replies: number;
  neutral_replies: number;
  meetings_booked: number;
  deals_created: number;
  delivery_rate: number | null;
  bounce_rate: number | null;
  open_rate: number | null;
  click_rate: number | null;
  reply_rate: number | null;
  positive_reply_rate: number | null;
  meeting_rate: number | null;
  conversion_rate: number | null;
  by_tier: Record<string, unknown> | null;
  by_email_angle: Record<string, unknown> | null;
  by_title: Record<string, unknown> | null;
  by_region: Record<string, unknown> | null;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  deal_id: number | null;
  scope: 'deal' | 'global';
  role: 'user' | 'assistant' | 'system';
  content: string;
  context_used: Record<string, unknown> | null;
  actions_triggered: Record<string, unknown> | null;
  model: string | null;
  tokens_used: number | null;
  created_at: string;
}

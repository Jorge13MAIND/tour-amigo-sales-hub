import { describe, it, expect } from 'vitest';
import type { DealRoom, DealStakeholder, DealRoomFeedItem, DealDocument, ChatMessage, ClosePlanStep, DealRisk, CompetitiveIntel } from '@/lib/types';

describe('v3 Type Definitions', () => {
  it('DealRoom type has all required fields', () => {
    const room: DealRoom = {
      id: 'test-id',
      deal_id: 123,
      deal_name: 'Test Deal',
      room_type: 'enterprise',
      status: 'active',
      close_plan: [],
      risks: [],
      competitive_intel: null,
      key_metrics: null,
      target_close_date: '2026-05-31',
      close_probability: 75,
      total_contract_value: 100000,
      pricing_details: null,
      notes: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };
    expect(room.room_type).toBe('enterprise');
    expect(room.status).toBe('active');
  });

  it('ClosePlanStep type has correct structure', () => {
    const step: ClosePlanStep = {
      day: 'D-10',
      date: '2026-03-13',
      focus: 'Murray Alignment',
      actions: 'Brief Murray on A21 status',
      owner: 'Jorge',
      deliverable: 'Murray prep sheet',
      risk: 'Murray may not prioritize',
      status: 'completed',
    };
    expect(step.day).toBe('D-10');
    expect(step.date).toBe('2026-03-13');
  });

  it('DealRisk type has correct severity values', () => {
    const risk: DealRisk = {
      risk: 'Demo not ready',
      severity: 'critical',
      mitigation: 'Complete demo environment by D-8',
      status: 'open',
    };
    expect(risk.severity).toBe('critical');
    expect(risk.status).toBe('open');
  });

  it('DealStakeholder type has engagement_score', () => {
    const stakeholder: DealStakeholder = {
      id: 'test',
      deal_id: 123,
      name: 'Noelia',
      role: 'VP Operations',
      title: null,
      email: 'noelia@test.com',
      phone: null,
      stakeholder_type: 'champion',
      engagement_score: 4,
      last_interaction: '2026-03-10T00:00:00Z',
      interaction_count: 12,
      sentiment: 'positive',
      notes: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };
    expect(stakeholder.stakeholder_type).toBe('champion');
    expect(stakeholder.engagement_score).toBe(4);
  });

  it('DealRoomFeedItem type supports all sources', () => {
    const sources: DealRoomFeedItem['source'][] = ['email', 'calendar', 'slack', 'drive', 'hubspot', 'agent', 'transcript', 'manual'];
    sources.forEach((source) => {
      const item: DealRoomFeedItem = {
        id: 'test',
        deal_id: 123,
        source,
        event_type: 'test_event',
        title: 'Test',
        summary: null,
        raw_data: null,
        stakeholder_name: null,
        stakeholder_email: null,
        sentiment: null,
        action_required: false,
        action_description: null,
        external_url: null,
        external_id: null,
        created_at: '2026-01-01T00:00:00Z',
      };
      expect(item.source).toBe(source);
    });
  });

  it('ChatMessage supports deal and global scope', () => {
    const dealMsg: ChatMessage = {
      id: 'test',
      deal_id: 123,
      scope: 'deal',
      role: 'user',
      content: 'What risks?',
      context_used: null,
      actions_triggered: null,
      model: 'claude-haiku-4.5',
      tokens_used: 100,
      created_at: '2026-01-01T00:00:00Z',
    };
    expect(dealMsg.scope).toBe('deal');

    const globalMsg: ChatMessage = {
      ...dealMsg,
      deal_id: null,
      scope: 'global',
    };
    expect(globalMsg.deal_id).toBeNull();
  });

  it('DealDocument type supports all doc types', () => {
    const docTypes: DealDocument['doc_type'][] = ['transcript', 'proposal', 'contract', 'presentation', 'sow', 'email_thread', 'drive_file', 'meeting_notes', 'other'];
    docTypes.forEach((doc_type) => {
      const doc: DealDocument = {
        id: 'test',
        deal_id: 123,
        doc_type,
        title: 'Test Doc',
        source: 'drive',
        external_url: null,
        external_id: null,
        content_summary: null,
        key_points: ['point 1'],
        stakeholders_mentioned: ['Noelia'],
        action_items: [],
        processed: true,
        created_at: '2026-01-01T00:00:00Z',
      };
      expect(doc.doc_type).toBe(doc_type);
    });
  });

  it('CompetitiveIntel has correct structure', () => {
    const intel: CompetitiveIntel = {
      competitors: 'None direct',
      differentiators: 'SAP integration, Operational automation',
      status_quo_risk: 'Manual processes cannot scale',
    };
    expect(intel.competitors).toBe('None direct');
  });
});

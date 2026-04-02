import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS: restrict to known origins (CC dev + production domains)
const ALLOWED_ORIGINS = [
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:3000',
  'http://localhost:5173',
  'https://atlastacc.netlify.app',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const isAllowed = ALLOWED_ORIGINS.includes(origin)
    || origin.endsWith('.lovable.app')
    || origin.endsWith('.lovable.dev')
    || origin.endsWith('.netlify.app');
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'null',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin',
  };
}

const HUBSPOT_API = 'https://api.hubapi.com';

// Map local field names to HubSpot property names
const DEAL_PROPERTY_MAP: Record<string, string> = {
  deal_stage: 'dealstage',
  amount: 'amount',
  close_date: 'closedate',
  priority: 'hs_priority',
  next_step: 'hs_next_step',
  roadblocks: 'description',
  competitor: 'competitor',
  product_tier: 'product_tier',
  number_of_users: 'number_of_users',
};

// Stage label to HubSpot stage ID mapping
const STAGE_LABEL_TO_ID: Record<string, string> = {
  'Demo Scheduled': '962694179',
  'Additional Demo': '168848470',
  'Demo Completed': 'closedwon',
  'Proposal Sent': 'closedlost',
  'Negotiation': '169206147',
  'Commit': '168848472',
  'Closed Won': '168848473',
  'Closed Lost': '168848474',
  'Follow Up Future': '266180272',
};

function getSupabase() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}

function getHubSpotToken(): string {
  const token = Deno.env.get('HUBSPOT_ACCESS_TOKEN') || Deno.env.get('HUBSPOT_TOKEN') || Deno.env.get('HUBSPOT_API_KEY');
  if (!token) throw new Error('HubSpot token not found. Set HUBSPOT_ACCESS_TOKEN in Supabase secrets.');
  return token;
}

async function hubspotFetch(path: string, options: RequestInit = {}) {
  const token = getHubSpotToken();
  const res = await fetch(`${HUBSPOT_API}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HubSpot API error [${res.status}]: ${body}`);
  }
  return res.status === 204 ? null : res.json();
}

// --- Action Handlers ---

async function updateDeal(payload: {
  deal_id: number;
  fields: Record<string, unknown>;
}) {
  const { deal_id, fields } = payload;
  const supabase = getSupabase();

  const hubspotProps: Record<string, unknown> = {};
  const localUpdates: Record<string, unknown> = {};

  // Handle deal_stage_label -> convert to deal_stage ID for HubSpot
  if (fields.deal_stage_label && typeof fields.deal_stage_label === 'string') {
    const stageId = STAGE_LABEL_TO_ID[fields.deal_stage_label];
    if (stageId) {
      hubspotProps['dealstage'] = stageId;
      localUpdates['deal_stage'] = stageId;
      localUpdates['deal_stage_label'] = fields.deal_stage_label;
    }
    delete fields.deal_stage_label;
  }

  for (const [key, value] of Object.entries(fields)) {
    localUpdates[key] = value;
    const hsKey = DEAL_PROPERTY_MAP[key];
    if (hsKey) {
      if (key === 'close_date' && value) {
        hubspotProps[hsKey] = new Date(value as string).setUTCHours(0, 0, 0, 0);
      } else {
        hubspotProps[hsKey] = value;
      }
    }
  }

  // Push to HubSpot
  if (Object.keys(hubspotProps).length > 0) {
    await hubspotFetch(`/crm/v3/objects/deals/${deal_id}`, {
      method: 'PATCH',
      body: JSON.stringify({ properties: hubspotProps }),
    });
  }

  // Update local Supabase table
  localUpdates['updated_at'] = new Date().toISOString();
  const { error } = await supabase
    .from('deals')
    .update(localUpdates)
    .eq('id', deal_id);
  if (error) throw new Error(`Supabase update failed: ${error.message}`);

  // Log to agent_activity
  await supabase.from('agent_activity').insert({
    agent_name: 'command-center',
    action_type: 'deal_updated',
    deal_id,
    description: `Deal ${deal_id} updated via Command Center: ${Object.keys({...fields, ...(hubspotProps.dealstage ? {deal_stage: hubspotProps.dealstage} : {})}).join(', ')}`,
    result: 'auto_executed',
    metadata: { fields: localUpdates },
  });

  return { success: true, deal_id };
}

async function createNote(payload: {
  deal_id: number;
  content: string;
}) {
  const { deal_id, content } = payload;
  const supabase = getSupabase();
  const timestamp = new Date().toISOString();

  try {
    await hubspotFetch('/crm/v3/objects/notes', {
      method: 'POST',
      body: JSON.stringify({
        properties: {
          hs_note_body: content,
          hs_timestamp: timestamp,
        },
        associations: [{
          to: { id: deal_id },
          types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 214 }],
        }],
      }),
    });
  } catch (e) {
    console.error('HubSpot note creation failed, saving locally only:', e);
  }

  const { error } = await supabase.from('deal_room_feed').insert({
    deal_id,
    source: 'manual',
    event_type: 'note_added',
    title: 'Note added',
    summary: content,
    sentiment: 'neutral',
    action_required: false,
    created_at: timestamp,
  });
  if (error) throw new Error(`Feed insert failed: ${error.message}`);

  return { success: true };
}

async function createTask(payload: {
  deal_id: number | null;
  title: string;
  description?: string;
  priority: string;
  due_date?: string;
}) {
  const supabase = getSupabase();
  const { error, data } = await supabase.from('tasks').insert({
    deal_id: payload.deal_id,
    title: payload.title,
    description: payload.description || null,
    priority: payload.priority,
    status: 'pending',
    source: 'manual',
    due_date: payload.due_date || null,
  }).select().single();
  if (error) throw new Error(`Task creation failed: ${error.message}`);
  return { success: true, task: data };
}

async function updateTask(payload: {
  task_id: string;
  fields: Record<string, unknown>;
}) {
  const supabase = getSupabase();
  const updates = { ...payload.fields };
  if (updates.status === 'completed') {
    updates.completed_at = new Date().toISOString();
  }
  const { error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', payload.task_id);
  if (error) throw new Error(`Task update failed: ${error.message}`);
  return { success: true };
}

async function deleteTask(payload: { task_id: string }) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', payload.task_id);
  if (error) throw new Error(`Task delete failed: ${error.message}`);
  return { success: true };
}

async function updateDecision(payload: {
  decision_id: string;
  fields: Record<string, unknown>;
}) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('decisions')
    .update(payload.fields)
    .eq('id', payload.decision_id);
  if (error) throw new Error(`Decision update failed: ${error.message}`);
  return { success: true };
}

async function updateDealRoom(payload: {
  room_id: string;
  fields: Record<string, unknown>;
}) {
  const supabase = getSupabase();
  const updates = { ...payload.fields, updated_at: new Date().toISOString() };
  const { error } = await supabase
    .from('deal_rooms')
    .update(updates)
    .eq('id', payload.room_id);
  if (error) throw new Error(`Deal room update failed: ${error.message}`);
  return { success: true };
}

async function upsertStakeholder(payload: {
  stakeholder: Record<string, unknown>;
}) {
  const supabase = getSupabase();
  const data = { ...payload.stakeholder, updated_at: new Date().toISOString() };
  const { error, data: result } = await supabase
    .from('deal_stakeholders')
    .upsert(data)
    .select()
    .single();
  if (error) throw new Error(`Stakeholder upsert failed: ${error.message}`);
  return { success: true, stakeholder: result };
}

async function deleteStakeholder(payload: { stakeholder_id: string }) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('deal_stakeholders')
    .delete()
    .eq('id', payload.stakeholder_id);
  if (error) throw new Error(`Stakeholder delete failed: ${error.message}`);
  return { success: true };
}

async function markNotificationRead(payload: { notification_id: string }) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('atlas_notifications')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('id', payload.notification_id);
  if (error) throw new Error(`Mark read failed: ${error.message}`);
  return { success: true };
}

async function markAllNotificationsRead() {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('atlas_notifications')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('read', false);
  if (error) throw new Error(`Mark all read failed: ${error.message}`);
  return { success: true };
}

// --- Main Handler ---

// deno-lint-ignore no-explicit-any
const ACTIONS: Record<string, (payload: any) => Promise<any>> = {
  update_deal: updateDeal,
  create_note: createNote,
  create_task: createTask,
  update_task: updateTask,
  delete_task: deleteTask,
  update_decision: updateDecision,
  update_deal_room: updateDealRoom,
  upsert_stakeholder: upsertStakeholder,
  delete_stakeholder: deleteStakeholder,
  mark_notification_read: markNotificationRead,
  mark_all_notifications_read: markAllNotificationsRead,
};

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: cors });
  }

  try {
    const body = await req.json();
    const action = body.action;
    // Support both { action, payload: {...} } and { action, ...rest } formats
    const payload = body.payload || ((() => { const { action: _, ...rest } = body; return rest; })());

    if (!action || typeof action !== 'string' || !ACTIONS[action]) {
      return new Response(
        JSON.stringify({ error: `Unknown action: ${action}` }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const result = await ACTIONS[action](payload);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('hubspot-proxy error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }
});

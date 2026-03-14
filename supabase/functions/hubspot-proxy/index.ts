import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

// ─── Action Handlers ───

async function updateDeal(payload: {
  deal_id: number;
  fields: Record<string, unknown>;
}) {
  const { deal_id, fields } = payload;
  const supabase = getSupabase();

  // Build HubSpot properties
  const hubspotProps: Record<string, unknown> = {};
  const localUpdates: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(fields)) {
    localUpdates[key] = value;
    const hsKey = DEAL_PROPERTY_MAP[key];
    if (hsKey) {
      // Format dates for HubSpot (midnight UTC)
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

  return { success: true, deal_id };
}

async function createNote(payload: {
  deal_id: number;
  content: string;
}) {
  const { deal_id, content } = payload;
  const supabase = getSupabase();
  const timestamp = new Date().toISOString();

  // Create note in HubSpot
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

  // Insert into deal_room_feed
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

// ─── Main Handler ───

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
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, payload } = await req.json();

    if (!action || !ACTIONS[action]) {
      return new Response(
        JSON.stringify({ error: `Unknown action: ${action}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await ACTIONS[action](payload);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('hubspot-proxy error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

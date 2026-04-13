import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Atlas Proxy v5 — Unified API gateway for ATLAS agents
// v5: Added hubspot_batch_contacts for engagement intelligence (Phase 2)
// v4: Added shared secret auth, request timeouts, error sanitization

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const HUBSPOT_API = "https://api.hubapi.com";
const SLACK_API = "https://slack.com/api";

// --- SECURITY: Shared secret auth ---
const ATLAS_SECRET = Deno.env.get("ATLAS_PROXY_SECRET");

function verifyAuth(req: Request): boolean {
  // If no secret is configured, deny all requests (fail-closed)
  if (!ATLAS_SECRET) {
    console.error("ATLAS_PROXY_SECRET not set. Denying request.");
    return false;
  }
  const provided = req.headers.get("x-atlas-secret");
  if (!provided) return false;
  // Constant-time comparison to prevent timing attacks
  if (provided.length !== ATLAS_SECRET.length) return false;
  let mismatch = 0;
  for (let i = 0; i < provided.length; i++) {
    mismatch |= provided.charCodeAt(i) ^ ATLAS_SECRET.charCodeAt(i);
  }
  return mismatch === 0;
}

// --- Timeout wrapper for all external API calls ---
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 30000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

// --- Auth helpers ---

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

function getHubSpotToken(): string {
  const token = Deno.env.get("HUBSPOT_ACCESS_TOKEN") || Deno.env.get("HUBSPOT_TOKEN");
  if (!token) throw new Error("HUBSPOT_ACCESS_TOKEN not set");
  return token;
}

function getSlackToken(): string {
  const token = Deno.env.get("SLACK_BOT_TOKEN");
  if (!token) throw new Error("SLACK_BOT_TOKEN not set");
  return token;
}

let cachedGoogleToken: string | null = null;
let tokenExpiresAt = 0;

async function getGoogleToken(): Promise<string> {
  if (cachedGoogleToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedGoogleToken;
  }
  const refreshToken = Deno.env.get("GOOGLE_REFRESH_TOKEN");
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
  if (refreshToken && clientId && clientSecret) {
    try {
      const res = await fetchWithTimeout("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
      });
      const data = await res.json();
      if (data.access_token) {
        cachedGoogleToken = data.access_token;
        tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;
        return cachedGoogleToken!;
      }
      console.error("Google refresh failed");
    } catch (e) {
      console.error("Google refresh error");
    }
  }
  const staticToken = Deno.env.get("GOOGLE_ACCESS_TOKEN");
  if (staticToken) return staticToken;
  throw new Error("Google auth not configured");
}

// --- Slack Actions ---

async function slackSendMessage(payload: { channel: string; text: string; blocks?: any[] }) {
  const token = getSlackToken();
  const body: any = { channel: payload.channel, text: payload.text };
  if (payload.blocks) body.blocks = payload.blocks;
  const res = await fetchWithTimeout(`${SLACK_API}/chat.postMessage`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) throw new Error("Slack send failed");
  return { success: true, ts: data.ts, channel: data.channel };
}

async function slackSearchMessages(payload: { query: string; count?: number }) {
  const token = getSlackToken();
  const params = new URLSearchParams({ query: payload.query, count: String(payload.count || 20) });
  const res = await fetchWithTimeout(`${SLACK_API}/search.messages?${params}`, {
    headers: { "Authorization": `Bearer ${token}` },
  });
  const data = await res.json();
  if (!data.ok) throw new Error("Slack search failed");
  return { success: true, messages: data.messages };
}

// --- HubSpot Actions ---

async function hubspotFetch(path: string, options: RequestInit = {}) {
  const token = getHubSpotToken();
  const res = await fetchWithTimeout(`${HUBSPOT_API}${path}`, {
    ...options,
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json", ...options.headers },
  });
  if (!res.ok) {
    // Log full error server-side, return sanitized error to client
    const body = await res.text();
    console.error(`HubSpot API error [${res.status}]: ${body}`);
    throw new Error(`HubSpot API error [${res.status}]`);
  }
  return res.status === 204 ? null : res.json();
}

async function hubspotGetDeals(payload: { properties?: string[]; limit?: number; after?: string }) {
  const props = (payload.properties || ["dealname", "dealstage", "amount", "closedate", "hs_priority", "hs_next_step", "pipeline"]).join(",");
  const params = new URLSearchParams({ limit: String(payload.limit || 100), properties: props });
  if (payload.after) params.set("after", payload.after);
  const data = await hubspotFetch(`/crm/v3/objects/deals?${params}`);
  return { success: true, deals: data.results, paging: data.paging };
}

async function hubspotGetDeal(payload: { deal_id: string; properties?: string[] }) {
  const props = (payload.properties || ["dealname", "dealstage", "amount", "closedate", "hs_priority", "hs_next_step", "pipeline", "competitor_on_deal", "product_tier", "number_of_users", "hubspot_owner_id"]).join(",");
  const data = await hubspotFetch(`/crm/v3/objects/deals/${payload.deal_id}?properties=${props}`);
  return { success: true, deal: data };
}

async function hubspotSearchDeals(payload: { filters: any[]; properties?: string[]; limit?: number; sorts?: any[] }) {
  const body: any = {
    filterGroups: [{ filters: payload.filters }],
    properties: payload.properties || ["dealname", "dealstage", "amount", "closedate", "hs_priority", "hs_next_step", "pipeline", "hubspot_owner_id"],
    limit: payload.limit || 100,
  };
  if (payload.sorts) body.sorts = payload.sorts;
  const data = await hubspotFetch("/crm/v3/objects/deals/search", { method: "POST", body: JSON.stringify(body) });
  return { success: true, deals: data.results, total: data.total };
}

async function hubspotSearchContacts(payload: { filters: any[]; properties?: string[]; limit?: number }) {
  const data = await hubspotFetch("/crm/v3/objects/contacts/search", {
    method: "POST",
    body: JSON.stringify({
      filterGroups: [{ filters: payload.filters }],
      properties: payload.properties || ["firstname", "lastname", "email", "company", "jobtitle", "phone", "hubspot_owner_id"],
      limit: payload.limit || 100,
    }),
  });
  return { success: true, contacts: data.results, total: data.total };
}

async function hubspotGetContacts(payload: { properties?: string[]; limit?: number; after?: string }) {
  const props = (payload.properties || ["firstname", "lastname", "email", "company", "jobtitle", "num_associated_deals"]).join(",");
  const params = new URLSearchParams({ limit: String(payload.limit || 100), properties: props });
  if (payload.after) params.set("after", payload.after);
  const data = await hubspotFetch(`/crm/v3/objects/contacts?${params}`);
  return { success: true, contacts: data.results, paging: data.paging };
}

async function hubspotUpdateDeal(payload: { deal_id: string; properties: Record<string, any> }) {
  const data = await hubspotFetch(`/crm/v3/objects/deals/${payload.deal_id}`, {
    method: "PATCH", body: JSON.stringify({ properties: payload.properties }),
  });
  return { success: true, deal: data };
}

async function hubspotUpdateContact(payload: { contact_id: string; properties: Record<string, any> }) {
  const data = await hubspotFetch(`/crm/v3/objects/contacts/${payload.contact_id}`, {
    method: "PATCH", body: JSON.stringify({ properties: payload.properties }),
  });
  return { success: true, contact: data };
}

async function hubspotCreateNote(payload: { deal_id: string; content: string }) {
  const data = await hubspotFetch("/crm/v3/objects/notes", {
    method: "POST",
    body: JSON.stringify({
      properties: { hs_note_body: payload.content, hs_timestamp: new Date().toISOString() },
      associations: [{ to: { id: payload.deal_id }, types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 214 }] }],
    }),
  });
  return { success: true, note: data };
}

async function hubspotCreateDeal(payload: { properties: Record<string, any> }) {
  const data = await hubspotFetch("/crm/v3/objects/deals", {
    method: "POST", body: JSON.stringify({ properties: payload.properties }),
  });
  return { success: true, deal: data };
}

async function hubspotBatchContacts(payload: { contact_ids: string[]; properties?: string[] }) {
  const props = payload.properties || [
    "email", "firstname", "lastname",
    "hs_sales_email_last_opened", "hs_sales_email_last_clicked",
    "hs_sequences_is_enrolled",
  ];
  const allResults: any[] = [];
  const ids = payload.contact_ids || [];
  // Guard: cap at 500 to prevent Edge Function timeout (5 batches x 30s max)
  if (ids.length > 500) {
    throw new Error("hubspot_batch_contacts: max 500 contact_ids per call");
  }
  // HubSpot batch read supports max 100 per request
  for (let i = 0; i < ids.length; i += 100) {
    const batch = ids.slice(i, i + 100);
    const data = await hubspotFetch("/crm/v3/objects/contacts/batch/read", {
      method: "POST",
      body: JSON.stringify({
        properties: props,
        inputs: batch.map((id: string) => ({ id })),
      }),
    });
    if (data?.results) allResults.push(...data.results);
  }
  return { success: true, contacts: allResults, total: allResults.length };
}

// --- Gmail Actions ---

function buildRawEmail(to: string, subject: string, body: string, from?: string): string {
  const fromAddr = from || "jorgepittaluga@touramigo.com";
  const rawEmail = `From: ${fromAddr}\r\nTo: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${body}`;
  return btoa(unescape(encodeURIComponent(rawEmail))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function gmailListMessages(payload: { query?: string; max_results?: number }) {
  try {
    const token = await getGoogleToken();
    const params = new URLSearchParams({ maxResults: String(payload.max_results || 20) });
    if (payload.query) params.set("q", payload.query);
    const res = await fetchWithTimeout(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${params}`, {
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Gmail API error [${res.status}]`);
    const data = await res.json();
    return { success: true, messages: data.messages || [], resultSizeEstimate: data.resultSizeEstimate };
  } catch (e) {
    return { success: false, error: "Gmail operation failed" };
  }
}

async function gmailGetMessage(payload: { message_id: string; format?: string }) {
  try {
    const token = await getGoogleToken();
    const format = payload.format || "metadata";
    const res = await fetchWithTimeout(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${payload.message_id}?format=${format}&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`, {
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Gmail API error [${res.status}]`);
    return { success: true, message: await res.json() };
  } catch (e) {
    return { success: false, error: "Gmail operation failed" };
  }
}

async function gmailCreateDraft(payload: { to: string; subject: string; body: string; thread_id?: string }) {
  try {
    const token = await getGoogleToken();
    const raw = buildRawEmail(payload.to, payload.subject, payload.body);
    const message: any = { raw };
    if (payload.thread_id) message.threadId = payload.thread_id;
    const res = await fetchWithTimeout("https://gmail.googleapis.com/gmail/v1/users/me/drafts", {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) throw new Error(`Gmail API error [${res.status}]`);
    return { success: true, draft: await res.json() };
  } catch (e) {
    return { success: false, error: "Gmail draft creation failed" };
  }
}

async function gmailSendMessage(payload: { to: string; subject: string; body: string; thread_id?: string }) {
  try {
    const token = await getGoogleToken();
    const raw = buildRawEmail(payload.to, payload.subject, payload.body);
    const message: any = { raw };
    if (payload.thread_id) message.threadId = payload.thread_id;
    const res = await fetchWithTimeout("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });
    if (!res.ok) throw new Error(`Gmail API error [${res.status}]`);
    return { success: true, message: await res.json() };
  } catch (e) {
    return { success: false, error: "Gmail send failed" };
  }
}

// --- Calendar Actions ---

async function calendarListEvents(payload: { time_min?: string; time_max?: string; max_results?: number; query?: string }) {
  try {
    const token = await getGoogleToken();
    const now = new Date();
    const params = new URLSearchParams({
      timeMin: payload.time_min || now.toISOString(),
      timeMax: payload.time_max || new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      maxResults: String(payload.max_results || 20),
      singleEvents: "true",
      orderBy: "startTime",
    });
    if (payload.query) params.set("q", payload.query);
    const res = await fetchWithTimeout(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, {
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Calendar API error [${res.status}]`);
    return { success: true, events: (await res.json()).items || [] };
  } catch (e) {
    return { success: false, error: "Calendar operation failed" };
  }
}

// --- Web Search ---

async function webSearch(payload: { query: string; max_results?: number }) {
  try {
    const q = encodeURIComponent(payload.query);
    const res = await fetchWithTimeout(`https://html.duckduckgo.com/html/?q=${q}`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ATLASBot/1.0)" },
    });
    const html = await res.text();
    const results: { title: string; snippet: string; url: string }[] = [];
    const regex = /<a rel="nofollow" class="result__a" href="([^"]+)">(.+?)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>(.+?)<\/a>/g;
    let match;
    const max = payload.max_results || 5;
    while ((match = regex.exec(html)) !== null && results.length < max) {
      results.push({
        url: match[1].replace(/\/l\/\?uddg=/, "").split("&")[0],
        title: match[2].replace(/<[^>]+>/g, ""),
        snippet: match[3].replace(/<[^>]+>/g, ""),
      });
    }
    return { success: true, results, count: results.length };
  } catch (e) {
    return { success: false, error: "Web search failed" };
  }
}

// --- Supabase Direct Actions ---

function parseOrder(order: string): { column: string; ascending: boolean } {
  const parts = order.split(".");
  return { column: parts[0], ascending: parts[1]?.toLowerCase() === "asc" };
}

async function supabaseQuery(payload: { table: string; select?: string; filters?: Record<string, any>; limit?: number; order?: string }) {
  const supabase = getSupabase();
  let query = supabase.from(payload.table).select(payload.select || "*");
  if (payload.filters) {
    for (const [key, value] of Object.entries(payload.filters)) {
      query = query.eq(key, value);
    }
  }
  if (payload.order) {
    const { column, ascending } = parseOrder(payload.order);
    query = query.order(column, { ascending });
  }
  if (payload.limit) query = query.limit(payload.limit);
  const { data, error } = await query;
  if (error) throw new Error("Supabase query failed");
  return { success: true, data, count: data?.length || 0 };
}

async function supabaseInsert(payload: { table: string; data: Record<string, any> | Record<string, any>[] }) {
  const supabase = getSupabase();
  const { data, error } = await supabase.from(payload.table).insert(payload.data).select();
  if (error) throw new Error("Supabase insert failed");
  return { success: true, data };
}

async function supabaseUpdate(payload: { table: string; data: Record<string, any>; match: Record<string, any> }) {
  const supabase = getSupabase();
  let query = supabase.from(payload.table).update(payload.data);
  for (const [key, value] of Object.entries(payload.match)) {
    query = query.eq(key, value);
  }
  const { data, error } = await query.select();
  if (error) throw new Error("Supabase update failed");
  return { success: true, data };
}

async function supabaseDelete(payload: { table: string; match: Record<string, any> }) {
  const supabase = getSupabase();
  let query = supabase.from(payload.table).delete();
  for (const [key, value] of Object.entries(payload.match)) {
    query = query.eq(key, value);
  }
  const { data, error } = await query.select();
  if (error) throw new Error("Supabase delete failed");
  return { success: true, data };
}

// --- Health Check ---

async function healthCheck(_payload: any) {
  const checks: Record<string, string> = {};
  try { getHubSpotToken(); checks.hubspot = "ok"; } catch { checks.hubspot = "missing_token"; }
  try { getSlackToken(); checks.slack = "ok"; } catch { checks.slack = "missing_token"; }
  try { await getGoogleToken(); checks.google = "ok"; } catch (e) {
    checks.google = String(e).includes("not configured") ? "missing_credentials" : "error";
  }
  try {
    const sb = getSupabase();
    const { error } = await sb.from("agent_activity").select("id").limit(1);
    checks.supabase = error ? "error" : "ok";
  } catch { checks.supabase = "error"; }
  const allOk = Object.values(checks).every(v => v === "ok");
  return { success: true, status: allOk ? "all_systems_go" : "degraded", checks, timestamp: new Date().toISOString() };
}

// --- Main Router ---

const ACTIONS: Record<string, (payload: any) => Promise<any>> = {
  health_check: healthCheck,
  slack_send_message: slackSendMessage,
  slack_search: slackSearchMessages,
  hubspot_get_deals: hubspotGetDeals,
  hubspot_get_deal: hubspotGetDeal,
  hubspot_search_deals: hubspotSearchDeals,
  hubspot_search_contacts: hubspotSearchContacts,
  hubspot_get_contacts: hubspotGetContacts,
  hubspot_update_deal: hubspotUpdateDeal,
  hubspot_update_contact: hubspotUpdateContact,
  hubspot_create_note: hubspotCreateNote,
  hubspot_create_deal: hubspotCreateDeal,
  hubspot_batch_contacts: hubspotBatchContacts,
  gmail_list: gmailListMessages,
  gmail_get: gmailGetMessage,
  gmail_draft: gmailCreateDraft,
  gmail_send: gmailSendMessage,
  calendar_events: calendarListEvents,
  web_search: webSearch,
  supabase_query: supabaseQuery,
  supabase_insert: supabaseInsert,
  supabase_update: supabaseUpdate,
  supabase_delete: supabaseDelete,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-atlas-secret",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  // SECURITY: Verify shared secret on every request
  if (!verifyAuth(req)) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const { action, ...payload } = body;
    if (!action || !ACTIONS[action]) {
      return new Response(
        JSON.stringify({ error: `Unknown action: ${action}` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const result = await ACTIONS[action](payload);
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log full error server-side, return sanitized message to client
    console.error("atlas-proxy error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

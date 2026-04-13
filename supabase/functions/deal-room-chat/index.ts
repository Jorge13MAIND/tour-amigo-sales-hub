import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const SYSTEM_PROMPT = `You are ATLAS AI, Jorge Pittaluga's strategic sales brain for Tour Amigo. You think like a senior sales operator with full context on every deal, contact, and competitive dynamic.

## WHO JORGE IS
Head of Sales, solo operator, 5-10 hours/week for Tour Amigo. Also runs MAIND (AI coaching) and Tekcel (AI implementation consulting). Based in CDMX (UTC-6). Decides fast ("dale", "si"). Hates generic AI output, CRM admin, flattery openers, em dashes, bullet points in short emails, and mentioning call durations. Wants answers first, reasoning second. Prefers 2-3 options with tradeoffs over open-ended questions.

## TOUR AMIGO
B2B SaaS for multi-day tour operators. Purpose-built for complex itineraries (not day tours). 4 portal types: B2B Agent, B2C Passenger, Tour Guide, Supplier. Two-way bookable API. White-label with full brand control. 98% retention, 50+ operators, 16K+ tours, 750K+ departures, 99.7% uptime.

Key value props by ICP:
- Tour Operators: 75-80% tour building time reduction (5-6h to 15-20min), 400-500 hours saved/year ($24-30K value)
- DMCs: B2B Agent Portal with self-service booking, custom commission/pricing per partner
- Enterprise: Custom white-label sites, four portal types, two-way bookable API
- Distribution partners: Operator inventory access, zero build cost

Known limitations: No bed bank/hotel API (critical gap for A+R), no GDS integration, FIT/Travel Any Day TBD, mobile app TBD.

Pricing: Lite $29/mo + 1.5%, Pro $99-399/user/mo, Custom dev $1,650/day. Multi-year discounts: Y1 30%, Y2 20%, Y3 10%. Enterprise: $20K scoping fee credited on signing.

## COMPETITIVE POSITIONING
- TourPlan: Legacy incumbent. Strong ops, weak distribution/UX. Main threat in Omniche deal.
- Kaptio: Salesforce-based. Expensive lock-in. Main threat in A+R deal. Sold 70% to VEX Partners (Iceland PE) — roadmap now serves investors, not operators.
- Peak15: Single-use focus, slow dev velocity. TA wins on multi-vertical coverage.
- WeTravel: Emerging from payments into multi-day. At ATE. Not serious today, watch in 12-18 months.
- Real competitor: Spreadsheets + manual processes (inertia, no switching cost).

Position: Only platform purpose-built for multi-day complexity from ground up. One login, one source of truth, one team to call.

## JORGE'S EMAIL VOICE
- Sign "Best, Jorge" (NEVER "Best regards" or "Kind regards")
- First names always. No flattery openers. No em dashes. No call duration mentions.
- Under 5 sentences for scheduling. "I would love to" and "Happy to" naturally.
- Short replies: prose, not bullet points.
- Post-demo: structured like project plan (deliverables + asks), not sales pitch.
- Murray: ultra-brief, lead with ask or update, just "Jorge" sign-off.
- Spanish for LATAM, English for everyone else. Never mix.

## KEY TEAM
- Murray Decker (CEO): Direct, reads everything carefully, catches AI output. Every deliverable to Murray is an implicit argument for Jorge's value. Cost reduction is a theme.
- Toby Hughes (CMO): Collaborative. ATE outreach coordination. AI champion.
- Aaron Moore (COO): Technical, operations. Killed HEX deal.
- Cat Smith (Client Solutions): Technical truth-teller in demos.
- Camille Callejo (Onboarding): Post-sale handoff.
- Carla Virgos: Antarctica21 account manager.

## ENTERPRISE DEALS (know these deeply)
- Antarctica21 ($85K, Negotiation): Noelia Greco is champion. On-site Santiago Mar 23-25. SAP integration required. Contract signed, $12K Deep Dive paid.
- Alexander+Roberts (~$1M/5yr, Proposal Sent): Scott Avera (President) + Seth Radner (IT Dir). Bed bank gap is critical blocker. Custom white-label built.
- Omniche (~40 users, Demo Scheduled): Bobby Hale (GM). Replacing TourPlan. Paid scoping model ($20K AUD). Bobby presented to owners — very positive.
- Travel Curious (Demo Completed): Amir Azulay (CEO). Strategic partner potential (400+ global partners). Investment question pending Murray.
- Lotus Group (~60M GBP, Proposal Sent): James Jones replied positively Mar 12. 14 days no follow-up. URGENT.
- Kilroy (ON HOLD): Martin Bisp. "Middle East killing us." Respect the pause.
- Dragonpass: 30M+ member platform. Distribution channel opportunity.

## HOW TO RESPOND
- Lead with the answer. No preamble.
- Reference specific deal data from context.
- Suggest next actions with contact names and deadlines.
- Match Jorge's language (Spanish if he writes Spanish).
- Never use em dashes, flattery openers, or "Just following up."
- When drafting emails, use Jorge's actual voice patterns.
- For enterprise deals, think strategically (champion vs blocker, competitive positioning, closing timeline).
- If you see a blind spot or risk, flag it proactively.

IMPORTANT: You have access to real-time deal data, Gmail, Calendar, and notification data provided in context. Use ALL of it.

ACTION SYSTEM: You can execute actions by including JSON blocks in your response. The system will parse and execute them.

Available actions (include as JSON at the END of your response if the user asks you to DO something):

1. Create a task:
\`\`\`action
{"type": "create_task", "title": "...", "description": "...", "priority": "high", "deal_name": "...", "source": "atlas-ai"}
\`\`\`

2. Create a notification (flag something for Jorge):
\`\`\`action
{"type": "create_notification", "title": "...", "body": "...", "priority": "high", "notification_type": "action_required"}
\`\`\`

3. Update a deal's next step:
\`\`\`action
{"type": "update_deal", "deal_id": 12345, "next_step": "..."}
\`\`\`

4. Mark a notification as read:
\`\`\`action
{"type": "mark_read", "notification_id": "uuid-here"}
\`\`\`

5. Draft an email (creates Gmail draft for Jorge to review):
\`\`\`action
{"type": "draft_email", "to": "email@example.com", "subject": "...", "body": "..."}
\`\`\`

6. Search Gmail for context on a deal or contact:
\`\`\`action
{"type": "search_gmail", "query": "from:contact@company.com newer_than:14d"}
\`\`\`

Rules for actions:
- ALWAYS explain what you're doing BEFORE the action block
- For anything that affects external systems (sending emails, calling contacts), DO NOT execute — instead create a task for Jorge to approve
- For internal data updates (tasks, notifications, deal next steps), execute directly
- You can include multiple action blocks in one response`;

async function getDealContext(dealId: number) {
  const [room, stakeholders, feed, docs, deal] = await Promise.all([
    supabase.from("deal_rooms").select("*").eq("deal_id", dealId).single(),
    supabase.from("deal_stakeholders").select("*").eq("deal_id", dealId),
    supabase.from("deal_room_feed").select("*").eq("deal_id", dealId).order("created_at", { ascending: false }).limit(20),
    supabase.from("deal_documents").select("*").eq("deal_id", dealId).limit(10),
    supabase.from("deals").select("*").eq("id", dealId).single(),
  ]);

  return {
    deal: deal.data,
    room: room.data,
    stakeholders: stakeholders.data || [],
    recent_activity: feed.data || [],
    documents: docs.data || [],
  };
}

async function getGlobalContext() {
  const ATLAS_PROXY = `${SUPABASE_URL}/functions/v1/atlas-proxy`;

  // Supabase data
  const [deals, metrics, activity, followUps, notifications, improvements] = await Promise.all([
    supabase.from("deals").select("id,deal_name,deal_stage_label,amount,risk_score,days_since_contact,close_date,next_step,competitor,status").not("deal_stage", "in", "(168848473,168848474,266180272)"),
    supabase.from("daily_metrics").select("*").order("date", { ascending: false }).limit(7),
    supabase.from("agent_activity").select("*").order("created_at", { ascending: false }).limit(10),
    supabase.from("follow_up_plans").select("*").eq("status", "active"),
    supabase.from("atlas_notifications").select("*").eq("read", false).order("created_at", { ascending: false }).limit(15),
    supabase.from("atlas_improvements").select("*").order("created_at", { ascending: false }).limit(7),
  ]);

  // Gmail + Calendar via atlas-proxy (best-effort, don't block if fails)
  let gmail = null;
  let calendar = null;
  try {
    const [gmailResp, calResp] = await Promise.all([
      fetch(ATLAS_PROXY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "gmail_list", query: "is:unread newer_than:2d", max_results: 10 }),
      }).then(r => r.json()).catch(() => null),
      fetch(ATLAS_PROXY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "calendar_events", max_results: 10 }),
      }).then(r => r.json()).catch(() => null),
    ]);
    if (gmailResp?.success) gmail = gmailResp.data;
    if (calResp?.success) calendar = calResp.data;
  } catch (e) {
    // Gmail/Calendar unavailable — continue with Supabase data only
  }

  const context: Record<string, unknown> = {
    active_deals: deals.data || [],
    recent_metrics: metrics.data || [],
    recent_agent_activity: activity.data || [],
    active_follow_ups: followUps.data || [],
    unread_notifications: notifications.data || [],
    self_improvements: improvements.data || [],
  };

  if (gmail) context.recent_emails = gmail;
  if (calendar) context.todays_meetings = calendar;

  return context;
}

async function callClaude(messages: Array<{role: string; content: string}>, context: string, modelKey: string = "sonnet") {
  const MODEL_MAP: Record<string, { id: string; maxTokens: number }> = {
    opus: { id: "claude-opus-4-0-20250115", maxTokens: 8192 },
    sonnet: { id: "claude-sonnet-4-20250514", maxTokens: 4096 },
  };
  const { id: modelId, maxTokens } = MODEL_MAP[modelKey] || MODEL_MAP.sonnet;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: maxTokens,
      system: SYSTEM_PROMPT + "\n\nCONTEXT DATA:\n" + context,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || "No response generated.";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
      },
    });
  }

  try {
    const { message, deal_id, scope = "global", history = [], model = "sonnet", conversation_id: reqConversationId } = await req.json();
    const conversationId = reqConversationId || crypto.randomUUID();

    if (!message) {
      return new Response(JSON.stringify({ error: "message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const actualScope = deal_id ? "deal" : "global";
    let context: string;

    if (deal_id) {
      const ctx = await getDealContext(deal_id);
      context = JSON.stringify(ctx, null, 2);
    } else {
      const ctx = await getGlobalContext();
      context = JSON.stringify(ctx, null, 2);
    }

    const messages = [
      ...history.slice(-10).map((h: any) => ({ role: h.role, content: h.content })),
      { role: "user", content: message },
    ];

    const reply = await callClaude(messages, context, model);

    // Parse and execute actions from Claude's response
    // SECURITY: Allowed action types. draft_email creates Gmail drafts (not sent directly).
    const ALLOWED_ACTIONS = new Set(["create_task", "create_notification", "update_deal", "mark_read", "search_gmail", "draft_email"]);
    // Rate limit: max 3 actions per chat message
    const MAX_ACTIONS_PER_MESSAGE = 3;

    const actionRegex = /```action\n([\s\S]*?)```/g;
    let match;
    const executedActions: string[] = [];
    let actionCount = 0;

    while ((match = actionRegex.exec(reply)) !== null) {
      if (actionCount >= MAX_ACTIONS_PER_MESSAGE) {
        executedActions.push("Action limit reached (max 3 per message)");
        break;
      }
      try {
        const action = JSON.parse(match[1].trim());

        // SECURITY: Block any action type not in allowlist
        if (!ALLOWED_ACTIONS.has(action.type)) {
          console.error(`Blocked disallowed action type: ${action.type}`);
          executedActions.push(`Action blocked: ${action.type} not allowed`);
          continue;
        }

        actionCount++;

        if (action.type === "create_task") {
          await supabase.from("tasks").insert({
            title: String(action.title || "").slice(0, 200),
            description: String(action.description || "").slice(0, 1000),
            priority: ["low", "normal", "high", "critical"].includes(action.priority) ? action.priority : "medium",
            status: "pending",
            source: "atlas-ai",
          });
          executedActions.push(`Task created: ${action.title}`);
        }

        if (action.type === "create_notification") {
          await supabase.from("atlas_notifications").insert({
            agent_name: "atlas-ai",
            notification_type: action.notification_type || "info",
            priority: ["low", "normal", "high", "critical"].includes(action.priority) ? action.priority : "normal",
            title: String(action.title || "").slice(0, 200),
            body: String(action.body || "").slice(0, 1000),
            read: false,
            category: "info",
          });
          executedActions.push(`Notification created: ${action.title}`);
        }

        if (action.type === "update_deal" && action.deal_id) {
          // SECURITY: Only allow updating next_step field from chat
          const sanitizedNextStep = String(action.next_step || "").slice(0, 500);
          await supabase.from("deals").update({ next_step: sanitizedNextStep }).eq("id", Number(action.deal_id));
          executedActions.push(`Deal updated: ${action.deal_id}`);
        }

        if (action.type === "mark_read" && action.notification_id) {
          await supabase.from("atlas_notifications").update({ read: true, read_at: new Date().toISOString() }).eq("id", action.notification_id);
          executedActions.push(`Notification marked read`);
        }

        if (action.type === "search_gmail" && action.query) {
          const ATLAS_SECRET = Deno.env.get("ATLAS_PROXY_SECRET") || "";
          const ATLAS_PROXY = `${SUPABASE_URL}/functions/v1/atlas-proxy`;
          const searchResp = await fetch(ATLAS_PROXY, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-atlas-secret": ATLAS_SECRET },
            body: JSON.stringify({ action: "gmail_list", query: String(action.query).slice(0, 200), max_results: 5 }),
          }).then(r => r.json()).catch(() => ({ success: false }));
          if (searchResp.success) {
            executedActions.push(`Gmail search: ${searchResp.data?.length || 0} results found`);
          }
        }

        if (action.type === "draft_email" && action.to && action.subject && action.body) {
          const ATLAS_SECRET = Deno.env.get("ATLAS_PROXY_SECRET") || "";
          const ATLAS_PROXY = `${SUPABASE_URL}/functions/v1/atlas-proxy`;
          const draftResp = await fetch(ATLAS_PROXY, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-atlas-secret": ATLAS_SECRET },
            body: JSON.stringify({
              action: "gmail_draft",
              to: String(action.to).slice(0, 200),
              subject: String(action.subject).slice(0, 200),
              body: String(action.body).slice(0, 5000),
              thread_id: action.thread_id || undefined,
            }),
          }).then(r => r.json()).catch(() => ({ success: false }));
          if (draftResp.success) {
            executedActions.push(`Draft created: ${action.subject}`);
          } else {
            executedActions.push(`Draft failed: ${action.subject}`);
          }
        }
      } catch (e) {
        // Skip malformed action blocks silently
      }
    }

    // Clean action blocks from the reply shown to user
    const cleanReply = reply.replace(/```action\n[\s\S]*?```/g, '').trim();

    const conversationTitle = message.slice(0, 60);
    const modelLabel = model === "opus" ? "claude-opus-4" : "claude-sonnet-4";

    await supabase.from("chat_messages").insert([
      { deal_id: deal_id || null, scope: actualScope, role: "user", content: message, model: modelLabel, conversation_id: conversationId, conversation_title: conversationTitle },
      { deal_id: deal_id || null, scope: actualScope, role: "assistant", content: cleanReply, model: modelLabel, conversation_id: conversationId, conversation_title: conversationTitle, context_used: { scope: actualScope, deal_id, actions_executed: executedActions } },
    ]);

    return new Response(JSON.stringify({ reply: cleanReply, scope: actualScope, deal_id, actions_executed: executedActions, conversation_id: conversationId }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (error) {
    console.error("deal-room-chat error:", error);
    return new Response(JSON.stringify({ error: "Chat operation failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});

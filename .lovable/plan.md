

# Plan: Full CRM Editing with HubSpot Two-Way Sync

## Current State
- All data is **read-only** from Supabase tables synced from HubSpot
- The HubSpot private app token is stored as a **Supabase secret** (not a Lovable secret), accessible from Edge Functions via `Deno.env.get('HUBSPOT_TOKEN')` or similar
- No Edge Functions exist in this project yet (the `deal-room-chat` function is deployed directly on Supabase)
- No mutation hooks exist anywhere in the codebase

## Architecture

```text
┌─────────────┐     POST       ┌──────────────────┐     PATCH/POST    ┌──────────┐
│  Frontend   │ ──────────────→│  Edge Function    │ ────────────────→ │ HubSpot  │
│ (optimistic │                │  hubspot-proxy    │                   │   API    │
│  update)    │                │                   │                   │          │
│             │ ←── 200 ──────│  + Updates local  │ ←── 200 ────────│          │
│  invalidate │                │    Supabase table  │                   │          │
│  queries    │                └──────────────────┘                   └──────────┘
└─────────────┘
```

**Single Edge Function** (`hubspot-proxy`) handles all mutation types via an `action` field, keeping deployment simple. It:
1. Validates the request
2. Pushes the change to HubSpot API
3. Updates the local Supabase table to match
4. Returns success/error

## What Becomes Editable

### Pipeline Page
- **Drag-and-drop** deal cards between stage columns (updates `deal_stage` + `deal_stage_label` in HubSpot)
- Quick-edit priority via right-click or dropdown on card

### Deal Detail Panel (Sheet)
All fields become click-to-edit:
- **Amount** — inline number input
- **Close Date** — date picker
- **Priority** — dropdown (High/Medium/Low)
- **Stage** — dropdown with known stages
- **Next Step** — inline textarea
- **Roadblocks** — inline textarea
- **Product Tier** — inline input
- **Number of Users** — inline input
- **Competitor** — inline input

Plus new actions:
- **Add Note** — textarea at bottom, saves as HubSpot engagement/note
- **Create Task** — form with title, due date, priority
- **Edit/Complete/Delete Tasks** — inline actions on each task row
- **Edit Decisions** — update status (approve/reject)

### Deal Room Page
- Edit room notes, close probability, TCV
- Add/edit/remove stakeholders
- Add manual feed entries
- Edit risk status (open/mitigated/escalated)

## Implementation Plan

### 1. Edge Function: `hubspot-proxy`
Single function handling these actions:
- `update_deal` — PATCH deal properties (stage, amount, close_date, priority, next_step, roadblocks, competitor, product_tier, number_of_users)
- `create_note` — POST engagement/note to HubSpot, insert into local `deal_room_feed`
- `create_task` — INSERT into `tasks` table (+ optionally HubSpot task)
- `update_task` — UPDATE task status/priority/title
- `delete_task` — DELETE from `tasks`
- `update_decision` — UPDATE decision status
- `update_deal_room` — UPDATE deal_rooms (notes, probability, TCV)
- `upsert_stakeholder` — INSERT/UPDATE deal_stakeholders
- `delete_stakeholder` — DELETE from deal_stakeholders

Uses `HUBSPOT_TOKEN` from Supabase secrets. Falls back gracefully if HubSpot rejects (returns error, reverts optimistic update).

### 2. Mutation Hooks: `src/hooks/useDealMutations.ts`
React Query `useMutation` hooks with optimistic updates:
- `useUpdateDeal()` — optimistically updates deal cache, calls edge function
- `useCreateNote()` — adds to feed
- `useCreateTask()` / `useUpdateTask()` / `useDeleteTask()`
- `useUpdateDecision()`
- `useUpdateDealRoom()` / `useUpsertStakeholder()` / `useDeleteStakeholder()`

All use `onMutate` for optimistic cache updates and `onError` for rollback with toast.

### 3. UI Components

**`EditableField`** — Generic click-to-edit component (text, number, date, select variants). Click label to toggle edit mode, Enter/blur to save, Escape to cancel.

**`DealDetailPanel` upgrade** — Replace static `<Field>` with `<EditableField>` for all mutable properties. Add "Add Note" section and task CRUD buttons.

**`Pipeline` drag-and-drop** — Use `@dnd-kit/core` + `@dnd-kit/sortable` for dragging cards between columns. On drop, call `useUpdateDeal` with new stage.

**`DealRoom` editing** — Editable TCV, probability, notes in header. Stakeholder add/edit/delete buttons. Risk status toggle buttons.

### 4. Files Changed/Created

```text
NEW:
  supabase/functions/hubspot-proxy/index.ts    -- Edge Function
  supabase/config.toml                          -- verify_jwt = false
  src/hooks/useDealMutations.ts                 -- All mutation hooks
  src/components/EditableField.tsx               -- Click-to-edit component
  src/components/AddNoteForm.tsx                 -- Note creation form
  src/components/TaskForm.tsx                    -- Task create/edit form

MODIFIED:
  src/components/DealDetailPanel.tsx             -- Editable fields + notes + task CRUD
  src/pages/Pipeline.tsx                         -- Drag-and-drop with dnd-kit
  src/pages/DealRoom.tsx                         -- Editable header metrics
  src/components/deal-room/StakeholderCards.tsx   -- Add/edit/delete
  src/components/deal-room/RiskTracker.tsx        -- Status toggle
  src/lib/types.ts                               -- HubSpot property mappings
```

### 5. Security
- Edge Function validates action type and required fields with zod
- HubSpot token never exposed to frontend (stays in Supabase secrets)
- Supabase anon key used as Bearer token for the Edge Function call
- No raw SQL — all operations use typed Supabase client

### 6. Dependencies
- `@dnd-kit/core` + `@dnd-kit/sortable` for pipeline drag-and-drop


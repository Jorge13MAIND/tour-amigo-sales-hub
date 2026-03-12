

# Tour Amigo Command Center — Implementation Plan

## Overview
A read-only, real-time sales pipeline dashboard for Jorge (Head of Sales). True black dark mode default, data-dense Linear/Vercel aesthetic. Connects directly to existing Supabase tables.

## Design System
- **Background**: True black `#000000`, surfaces `#0A0A0A`, cards `#111111`
- **Accents**: Pink `#E0035D` (alerts), Yellow `#FFC127` (warnings), Blue `#66B7FF` (primary), Dark Blue `#0D2480` (nav)
- **Typography**: Inter for text, JetBrains Mono for numbers/amounts
- **Borders**: 1px `#27272A`, max 8px radius, no shadows, no decorative elements
- **Light mode toggle** available in nav

## Navigation — Left Sidebar
Compact icon+label sidebar with Dark Blue `#0D2480` background:
- **Dashboard** (grid icon) — default
- **Pipeline** (columns icon)
- **Decisions** (clipboard-check icon)
- **Metrics** (trending-up icon) — conditionally shown when daily_metrics has 7+ rows

**Top-right header bar**: Pipeline selector (Default / Reseller / Lite), "Last synced: X min ago" with red warning if >2hrs stale, refresh button.

## Screen 1: Dashboard
- **4 metric cards** in a row: Pipeline Value, Active Deals, Needs Attention, Avg Risk Score — all filtered by selected pipeline, excluding Won/Lost/Disqualified stages
- **Pipeline funnel**: Horizontal stacked bar showing deal count + value per stage with distinct colors (teal → blue → purple → coral)
- **Deals needing attention**: Table sorted by risk_score DESC with clickable deal names, risk/priority badges, days since contact, truncated next steps
- **Today's tasks**: Priority-sorted pending tasks with badges for priority, source, and linked deal name

## Screen 2: Pipeline Board (Kanban)
- 5 columns (always visible even if empty): Demo Scheduled → Additional Demo → Demo Completed → Proposal Sent → Negotiation
- Cards: deal name, amount (or "TBD" in muted red), risk badge, days since contact, priority dot
- Sorted by risk_score DESC within each column
- Filter bar: Priority, Has Amount, Has Competitor
- Read-only, no drag-and-drop. Click deal name → slide-out detail panel
- Adapts columns based on selected pipeline's stages

## Screen 3: Deal Detail (Slide-out Panel)
- Right-side drawer, opens on any deal name click across all screens
- **Swaps instantly** if a different deal is clicked while open
- Header: deal name + stage badge + risk badge
- Sections: financials (amount, close date, users, tier), strategy (next step, roadblocks, competitor), activity (last contacted with "X days ago", sync time)
- "Open in HubSpot" button → new tab
- Related tasks and decisions listed below

## Screen 4: Decisions Log
- Full-page table of all decisions, ordered by created_at DESC
- Columns: Date, Deal Name, Decision Type (colored badge), Decision, Expected Outcome, Review Date, Status badge
- Filters: status dropdown, decision_type dropdown

## Screen 5: Metrics Trends
- Gated: only renders with 7+ rows in daily_metrics, otherwise shows placeholder message
- 3 recharts line charts: Pipeline Value over time, Active Deals over time, Deals at Risk over time
- Formatted X-axis dates ("Mar 12"), tooltips on hover

## Data Layer
- Supabase client initialized with provided URL + anon key (public, stored in code)
- React Query for all data fetching with auto-refresh
- Global refresh button re-invalidates all queries
- All monetary NULLs display "TBD", all empty fields display "N/A"

## Pipeline Switcher
- Dropdown in the header to switch between Default (Sales), Reseller, and Lite pipelines
- All dashboard metrics, funnel, tables, and Kanban dynamically filter by selected pipeline
- Stage labels adapt per pipeline (using deal_stage_label from data)


# Live Trip Companion — Phase 23

## Overview

The Live Trip Companion turns the Balkanish planner into an on-the-road companion during an active trip. It introduces a deterministic lifecycle model, a Today view organised by time-of-day, practical context cards, and a lighter-day proposal — all without live data, location tracking, or fabricated real-time information.

**Core philosophy constraints that must be enforced permanently:**

- "During the trip, the planner should become quieter."
- "Time-aware is not the same as live-data-aware."
- "Passing time is not evidence of traveller behaviour."
- A planned activity is not proof of presence.
- Phase 23 does NOT fake live data: no weather, no traffic, no ferry status, no border queues, no opening hours, no location.

---

## Architecture

### Route

```
/trips/[tripId]/today   — server page (app/trips/[tripId]/today/page.tsx)
```

The page is auth-gated. Unauthenticated users are redirected to `/sign-in`. If the trip is not found or doesn't belong to the user, `notFound()` is called.

### Components

```
components/planner/live-trip-today.tsx   — "use client"; the entire Today view
```

### Data layer

```
lib/data/live-trip.ts       — server-only; reads/writes live_trip_item_states
lib/actions/live-trip.ts    — server actions: markDaySlotDone, markDaySlotSkipped, etc.
```

### Domain engine (pure, no I/O)

```
lib/ai/live-trip.ts         — all lifecycle and day-context computation
```

### Database

```
supabase/migrations/0020_phase23_live_trip.sql
  — live_trip_item_states table
  — UNIQUE INDEX on (trip_id, item_key)
  — 4 user-scoped RLS policies
```

---

## Lifecycle Model

The `TripLifecycleState` is computed deterministically from `departure_date`, `duration_days`, and the client's local date string. It is never stored; computed fresh on each page render.

| State | Condition |
|-------|-----------|
| `PLANNING` | No departure_date, or departure is more than 1 day away |
| `PRE_TRIP` | Exactly 1 day before departure (the eve) |
| `DEPARTURE_DAY` | departure_date === today (trip day 1) |
| `IN_TRIP` | After departure day, before all trip days are complete |
| `COMPLETED` | Today is after (departure_date + duration_days - 1) |

**Date arithmetic is done exclusively with UTC midnight (`Date.UTC`)** to avoid DST boundary issues. The client's local date (not server UTC) governs all comparisons.

---

## Item Identity

`ItineraryDay` contains only prose slots (morning, afternoon, evening, food_highlight, summary). There are no structured activity items, no stable per-activity IDs, no time fields.

The stable key for a day slot is: **`day{N}:{slot}`** — e.g. `day1:morning`, `day3:evening`.

This key is:
- Deterministic from day number + slot name
- Not tied to any database row in the itinerary
- Stable across page reloads and itinerary regeneration (as long as day count doesn't change)

---

## Item Status

```typescript
type LiveItemStatus = "PLANNED" | "DONE" | "SKIPPED" | "SAVED_FOR_LATER";
```

`PLANNED` is the default — no row exists in `live_trip_item_states` until the traveller takes an explicit action. Resetting to `PLANNED` deletes the row rather than storing a `PLANNED` row.

---

## Time Semantics

All ItineraryDay slots are `SUGGESTED_TIME` (morning/afternoon/evening) or `UNTIMED` (food/day_overview). `FIXED_TIME` is **never** assigned — prose-only content carries no provable time anchor.

The Now/Next/Later grouping is a **heuristic suggestion** based on local hour, not a real-time assertion. Copy must reflect this ("Your plan for this morning", not "You are currently at").

---

## Day Load Engine

Day load is derived from the count of non-trivial prose slots (>20 chars):

| Populated slots | Load |
|----------------|------|
| 0–1 | `LIGHT` |
| 2 | `MODERATE` |
| 3+ | `FULL` |

This is an editorial estimate — not a provable fact about traveller time.

---

## Practical Context Cards

Cards are surfaced from logistics data (`TravelSegment`) and readiness items. Types:

- `FERRY_DAY` — from `TravelSegment.ferry_info`
- `BORDER_CROSSING` — from `TravelSegment.border_info`
- `LOGISTICS_MOVE` — LONG_DAY or COMPLEX segment without ferry
- `RESERVATION_DUE` — HIGH/CRITICAL readiness items still PENDING with IN_DESTINATION timing
- `PACKING_CHECK` — PACKING readiness items still PENDING on departure day

All cards carry `STATIC_CURATED` or `TRIP_DERIVED` capability — **never `LIVE_PROVIDER`**. Ferry and border cards always include a "Verify before travel" disclaimer.

---

## Lighter Day Proposal

When a day has 2+ planned items, `buildLighterDayProposal()` suggests which slots to skip. Skip order: food → afternoon → morning → evening. The last remaining item is never skipped.

The proposal is presented as a suggestion only. The disclaimer reads: "This is a suggestion only. You decide what to do."

---

## LiveDataCapability Model

```typescript
type LiveDataCapability =
  | "STATIC_CURATED"   // Editorially authored, stable knowledge
  | "TRIP_DERIVED"     // Computed from saved itinerary, no external data
  | "USER_CONFIRMED"   // Traveller explicitly confirmed
  | "LIVE_PROVIDER";   // Requires real live integration — NEVER assigned in Phase 23
```

Every piece of information surfaced in the Today view must carry one of the first three values. If a future feature needs `LIVE_PROVIDER`, it requires a genuine real-time integration, not a simulation.

---

## Offline Architecture

No PWA infrastructure exists (no service worker, no manifest.json). Phase 23 uses honest localStorage snapshots:

- `live_trip_snapshot_{tripId}` — JSON snapshot of trip + item states
- `live_trip_snapshot_{tripId}_saved_at` — timestamp of last save

Copy is honest: "Saved for offline viewing" not "Works offline". Mutations while offline show: "You're offline. Trip changes need a connection." — no false optimistic state.

---

## Cultural Intelligence Integration

The Today view surfaces up to 3 `CulturalInsight` items resolved by `resolveInsightsForDestination()` (scope precedence: DESTINATION > REGION > COUNTRY). Up to 5 `LocalPhrase` items are shown, filtered by country code.

These are read-only, STATIC_CURATED data. The Today view never generates cultural content.

---

## Privacy Constraints

- No location tracking, no GPS, no geolocation API
- No live data sources (weather, traffic, ferry status, border queues, opening hours)
- No public exposure of live state or trip progress
- Analytics events are privacy-conscious: no item text, no destination names, no PII
  - `LIVE_TRIP_OPENED`, `TODAY_ITEM_MARKED_DONE`, `TODAY_ITEM_SKIPPED`
  - `LIGHTER_DAY_PROPOSED`, `LIGHTER_DAY_ACCEPTED`
  - `OFFLINE_SNAPSHOT_SAVED`, `TOMORROW_PREVIEW_OPENED`

---

## RLS

`live_trip_item_states` is fully user-scoped:
- SELECT: `user_id = auth.uid()`
- INSERT: `user_id = auth.uid()`
- UPDATE: `user_id = auth.uid()`
- DELETE: `user_id = auth.uid()`

No service-role bypass. No cross-user access.

---

## Entry Points

1. **My Trips page** (`/my-trips`) — "Today" button appears alongside "Trip Companion" when lifecycle is `PRE_TRIP`, `DEPARTURE_DAY`, or `IN_TRIP`. Computed client-side via `computeLifecycle()`.

2. **Direct URL** — `/trips/[tripId]/today` is always accessible; shows appropriate lifecycle state for any phase.

---

## i18n

11th namespace: `liveTrip`. Available in `en`, `de`, `it`, `hr`.

Registered in `lib/i18n/dictionaries.ts` alongside the existing 10 namespaces.

Usage in components: `t("liveTrip", "lifecycle.planning.title")`.

---

## Phase 23 Audit Checklist

- [x] Deterministic lifecycle model: PLANNING / PRE_TRIP / DEPARTURE_DAY / IN_TRIP / COMPLETED
- [x] Today view route at `/trips/[tripId]/today`
- [x] Now/Next/Later grouping by time-of-day heuristic
- [x] Day load engine (LIGHT / MODERATE / FULL based on prose slot density)
- [x] Plan flexibility derived from day load (EASY_TO_MOVE / SOME_FLEXIBILITY / TIGHTLY_PACKED)
- [x] Lighter day proposal (skip order: food → afternoon → morning)
- [x] Practical context cards: FERRY_DAY, BORDER_CROSSING, LOGISTICS_MOVE, RESERVATION_DUE, PACKING_CHECK
- [x] LiveDataCapability model — LIVE_PROVIDER never assigned
- [x] Contextual honesty: "Verify before travel" on ferry/border cards
- [x] Cultural Intelligence "Good to know today" section
- [x] Language helper "Useful today" section
- [x] Tomorrow preview
- [x] Day navigation (Previous / Next / Back to today)
- [x] Traveller-controlled item state: PLANNED / DONE / SKIPPED / SAVED_FOR_LATER
- [x] Stable item identity: `day{N}:{slot}` key format
- [x] PLANNED as default — no row until explicit action taken
- [x] Reset to PLANNED = delete row (no PLANNED rows stored)
- [x] One-hand mobile interaction: large tap targets, concise labels
- [x] Offline snapshot: honest localStorage, no fake optimism
- [x] Offline mutation blocked with honest copy
- [x] Online/offline detection via navigator.onLine + event listeners
- [x] No PWA claims (no service worker, no manifest)
- [x] No location tracking, no GPS, no geolocation
- [x] No live data (weather, traffic, ferries, borders, opening hours)
- [x] No public exposure of live state
- [x] Privacy-conscious analytics events (no item text, no PII)
- [x] Completed trip state shown with graceful copy
- [x] Planning state redirects to Trip Companion CTA
- [x] Date arithmetic uses `Date.UTC` (DST-safe)
- [x] Client-side date comparison (user's local timezone, not server UTC)
- [x] `departure_date` as YYYY-MM-DD string, not Date object
- [x] `getTripDayDateString()` utility
- [x] `addDaysToDateString()` utility
- [x] `computeCurrentMoment()` exported from engine
- [x] Pure engine: no I/O, no async, no side effects
- [x] Server-only data layer (`lib/data/live-trip.ts`)
- [x] Server actions with `revalidatePath`
- [x] Supabase migration 0020 with RLS (4 user-scoped policies)
- [x] UNIQUE INDEX on `(trip_id, item_key)` for idempotent upserts
- [x] `set_updated_at` trigger on `live_trip_item_states`
- [x] Full i18n: en / de / it / hr (liveTrip namespace)
- [x] Analytics events added to `lib/analytics.ts`
- [x] "Today" CTA on My Trips page when lifecycle is PRE_TRIP/DEPARTURE_DAY/IN_TRIP
- [x] Trip Companion link from Today page
- [x] Parallel data fetches on server page (`Promise.all`)
- [x] `isSupabaseConfigured()` fallback on server page
- [x] Auth gate with `redirect("/sign-in")`
- [x] `notFound()` for unknown/unauthorized trips

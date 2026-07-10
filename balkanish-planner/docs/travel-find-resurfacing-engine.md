# Travel Find Resurfacing Engine

Phase 28 — Proximity Intelligence & In-Product Resurfacing

---

## Purpose

The resurfacing engine surfaces travel finds that users saved via Inspiration Capture (Phase 26) when those finds become relevant to an active or upcoming trip. The engine is deliberately conservative: it shows at most 2 candidates at a time, respects user dismissals, and never tracks continuous location.

---

## Architecture Overview

```
lib/types.ts                     ← shared domain types
lib/resurfacing/
  policy.ts                      ← DEFAULT_RESURFACING_POLICY (all thresholds)
  ranker.ts                      ← scoring & confidence derivation
  fatigue.ts                     ← suppression / cooldown logic
  matcher.ts                     ← pure matching engine (no I/O)
lib/data/
  resurfacing-history.ts         ← Supabase reads & writes
lib/actions/
  resurfacing.ts                 ← Next.js server actions
components/resurfacing/
  resurfaced-find-card.tsx       ← client UI card
components/planner/
  live-trip-today.tsx            ← renders ResurfacedFindsSection
app/trips/[tripId]/today/
  page.tsx                       ← server component; computes candidates
supabase/migrations/
  0023_phase28_resurfacing.sql   ← resurfacing_history table + RLS
locales/{en,de,it,hr}/
  resurfacing.json               ← i18n strings
```

---

## Core Types (`lib/types.ts`)

### `ResurfacingReason`

```ts
type ResurfacingReason =
  | "ON_ROUTE"
  | "NEAR_ROUTE"
  | "NEAR_DAY_STOP"
  | "NEAR_OVERNIGHT_STOP"
  | "SAME_DESTINATION"
  | "SAME_REGION"
  | "TRIP_INTEREST_MATCH"
  | "UPCOMING_DAY_OPPORTUNITY";
```

### `MatchConfidence`

```ts
type MatchConfidence = "HIGH" | "MEDIUM" | "LOW";
```

### `ResurfacingDistanceMetric`

```ts
type ResurfacingDistanceMetric =
  | "GEOGRAPHIC_DISTANCE"   // straight-line haversine — used in Phase 28
  | "ROUTE_DISTANCE"        // reserved for future TravelDistanceProvider
  | "TRAVEL_TIME"           // reserved
  | "DETOUR_TIME";          // reserved
```

### `ResurfacingWindow`

```ts
type ResurfacingWindow =
  | "PLANNING"
  | "PRE_TRIP"
  | "LIVE_TRIP"
  | "DAY_AHEAD"
  | "SAME_DAY"
  | "POST_TRIP";
```

### `TravelFindMatchContext`

Ambient context injected into every match — contains lifecycle, day number, and the window derived from lifecycle. Produced once per page render; never recalculated mid-function.

### `TravelFindTripMatch`

The result of matching one capture against one trip. Includes:
- `reasons: ResurfacingReason[]`
- `confidence: MatchConfidence`
- `distanceKm: number | null`
- `distanceMetric: ResurfacingDistanceMetric | null`
- `context: TravelFindMatchContext`

### `ResurfacingCandidate`

The unit the UI consumes:
```ts
{
  capture: InspirationCapture;
  match: TravelFindTripMatch;
  relevanceScore: number;        // 0–100
}
```

### `ResurfacingPolicyConfig`

All configurable thresholds in one place (see Policy section below).

### `ResurfacingHistoryEntry`

Maps to one row in `resurfacing_history`. Tracks every resurfacing event and subsequent user action.

### Provider Abstractions

**`TravelDistanceProvider`** — interface for routing/distance APIs. Not implemented in Phase 28; reserved for integrating a routing provider without changing core engine logic.

**`TravelNotificationProvider`** — interface for push notification delivery. Not implemented in Phase 28; reserved for opt-in push reminders without hardcoding Firebase/OneSignal/APNS.

---

## Policy (`lib/resurfacing/policy.ts`)

```ts
export const DEFAULT_RESURFACING_POLICY: ResurfacingPolicyConfig = {
  minScoreToSurface: 30,           // candidates below this are dropped
  strongScoreThreshold: 70,        // not currently surfaced in UI
  cooldownAfterRemindLaterDays: 7, // REMIND_ME_LATER → 7-day suppression
  cooldownAfterViewDays: 3,        // VIEW_FIND → 3-day cooldown
  maxResurfacedFindsShown: 2,      // UI cap; sliced after ranking
  nearRouteMaxDistanceKm: 30,      // NEAR_ROUTE distance gate
  nearStopMaxDistanceKm: 15,       // NEAR_DAY_STOP / NEAR_OVERNIGHT_STOP gate
  minCaptureConfidenceForGeo: 0.4, // minimum resolution_confidence for coordinate matching
};
```

To tune the engine, modify only `DEFAULT_RESURFACING_POLICY`. No engine code changes required.

---

## Matching Engine (`lib/resurfacing/matcher.ts`)

### `extractTripCountryCodes(itinerary)`

Extracts country codes for database pre-filtering:
1. Uses `itinerary.country` when set (single-country trips).
2. Falls back to cross-referencing `map_points[].slug` and `map_points[].destination` against `BALKAN_PLACES` (exported from `lib/capture/place-resolver.ts`) for multi-country itineraries.

### `matchCapture(capture, mapPoints, interests, policy, todayDayNumber)`

Produces a `TravelFindTripMatch | null` for one capture against the trip's map points:

1. **Name-based matching** (primary path in Phase 28)
   - `normalizeName()` accent-folds and lowercases both sides.
   - `namesMatch()` returns true on exact or contained match.
   - Produces: `SAME_DESTINATION` (exact), `NEAR_DAY_STOP` / `NEAR_OVERNIGHT_STOP` (contained, depending on `is_overnight`).

2. **Coordinate-based matching** (activated only when both conditions hold)
   - `capture.latitude` and `capture.longitude` are non-null.
   - `capture.resolution_confidence >= policy.minCaptureConfidenceForGeo`.
   - Computes `haversineKm()` against each map point with coordinates.
   - Produces: `ON_ROUTE` (≤ stop distance), `NEAR_ROUTE` (≤ route distance), `NEAR_DAY_STOP`, `NEAR_OVERNIGHT_STOP`.

3. **Interest matching**
   - Maps `capture.place_type` to a set of known interest keywords.
   - Compares against `itinerary_json.interests[]`.
   - Produces: `TRIP_INTEREST_MATCH`.

4. **Fallback**
   - If any country-code match exists without stronger geo/name signal: `SAME_REGION`.

### `computeResurfacingCandidates(trip, candidateFinds, history, policy, lifecycle, todayDayNumber, departureDateString)`

Pure function — no I/O, no side effects, deterministic given the same inputs.

Pipeline:
1. Build `TravelFindMatchContext` from lifecycle + todayDayNumber.
2. For each `InspirationCapture` in `candidateFinds`:
   - Skip if `capture.status === "DISMISSED"`.
   - Find the latest `ResurfacingHistoryEntry` for this (captureId, tripId) pair.
   - Skip if `isSuppressed(entry, now)`.
   - Call `matchCapture(...)`.
   - Skip if no match or score < `policy.minScoreToSurface`.
3. Sort by `relevanceScore` descending, then `captured_at` descending (stable tiebreak).
4. Slice to `policy.maxResurfacedFindsShown`.
5. Return `ResurfacingCandidate[]`.

---

## Scoring (`lib/resurfacing/ranker.ts`)

### Reason weights

| Reason | Weight |
|---|---|
| ON_ROUTE | 45 |
| NEAR_OVERNIGHT_STOP | 45 |
| UPCOMING_DAY_OPPORTUNITY | 35 |
| NEAR_DAY_STOP | 30 |
| SAME_DESTINATION | 25 |
| NEAR_ROUTE | 20 |
| TRIP_INTEREST_MATCH | 15 |
| SAME_REGION | 10 |

### Confidence multipliers

| Confidence | Multiplier |
|---|---|
| HIGH | 1.0 |
| MEDIUM | 0.75 |
| LOW | 0.5 |

### Score formula

```
rawScore = sum(REASON_WEIGHTS[r] for r in reasons)
score = rawScore × CONFIDENCE_MULTIPLIERS[confidence]
      + (resolution_confidence × 10)   // bonus for geocoded captures
```

Score is capped at 100.

### Confidence derivation

`deriveConfidence(reasons)` assigns:
- `HIGH` — any of: ON_ROUTE, NEAR_OVERNIGHT_STOP, SAME_DESTINATION
- `MEDIUM` — any of: NEAR_DAY_STOP, UPCOMING_DAY_OPPORTUNITY, NEAR_ROUTE
- `LOW` — otherwise (TRIP_INTEREST_MATCH, SAME_REGION)

---

## Fatigue Control (`lib/resurfacing/fatigue.ts`)

### Suppression rules

| Action | Effect |
|---|---|
| `DISMISS` | Permanent (`permanently_dismissed = true`) |
| `NOT_THIS_TRIP` | Permanent for this (capture, trip) pair |
| `REMIND_ME_LATER` | `suppressed_until = now + 7 days` |
| `VIEW_FIND` | `suppressed_until = now + 3 days` |
| `ADD_TO_DAY` | No suppression |

### `isSuppressed(entry, nowIso)`

Returns `true` when:
- `entry.permanently_dismissed === true`, or
- `entry.suppressed_until` is set and in the future.

---

## Data Layer (`lib/data/resurfacing-history.ts`)

### `getResurfacingHistoryForTrip(userId, tripId)`

Reads all `resurfacing_history` rows for this user + trip. Called once per page render; the result is passed to `computeResurfacingCandidates` as an in-memory list.

### `recordResurfacingEvent(userId, captureId, tripId, window, reasons, confidence)`

Inserts a new row when a candidate is displayed to the user. Called from the `trackResurfacing` server action.

### `recordResurfacingAction(userId, captureId, tripId, action, suppressedUntil, permanentlyDismissed)`

Updates the most recent no-action row for this (capture, trip) pair, or inserts a new row if none exists. Called from the `recordAction` server action.

---

## Server Actions (`lib/actions/resurfacing.ts`)

### `trackResurfacing(captureId, tripId, window, reasons, confidence)`

Called from `ResurfacedFindsSection.useEffect` when candidates are rendered. Records the impression in `resurfacing_history`.

### `recordAction(captureId, tripId, action)`

Called from `ResurfacedFindCard` button handlers. Computes `suppressedUntil` and `permanentlyDismissed` from the action, persists via `recordResurfacingAction`, then calls `revalidatePath(/trips/${tripId}/today)` to trigger a server-side refresh.

---

## Database Schema

Table: `resurfacing_history`

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | gen_random_uuid() |
| user_id | UUID FK | → auth.users |
| capture_id | UUID FK | → inspiration_captures |
| trip_id | UUID FK | → generated_itineraries |
| resurfaced_at | TIMESTAMPTZ | default now() |
| window | TEXT | ResurfacingWindow value |
| reasons | TEXT[] | ResurfacingReason[] |
| confidence | TEXT | MatchConfidence value |
| action | TEXT nullable | ResurfacingAction when taken |
| action_at | TIMESTAMPTZ nullable | when action was taken |
| suppressed_until | TIMESTAMPTZ nullable | fatigue window end |
| permanently_dismissed | BOOLEAN | default false |
| created_at / updated_at | TIMESTAMPTZ | standard audit columns |

RLS: Users can only read and write their own rows.

Migration: `supabase/migrations/0023_phase28_resurfacing.sql`

---

## UI Integration

### Page (`app/trips/[tripId]/today/page.tsx`)

Server component. Data flow:
1. `extractTripCountryCodes(trip.itinerary_json)` — derives country codes for pre-filtering.
2. `getFindsNearDestinations(userId, countryCodes)` — fetches candidate finds from Supabase.
3. `getResurfacingHistoryForTrip(userId, tripId)` — fetches suppression history.
4. `computeCurrentMoment(...)` — determines lifecycle + current day number.
5. `computeResurfacingCandidates(...)` — pure ranking; returns `ResurfacingCandidate[]`.
6. Passes `resurfacedCandidates` to `<LiveTripToday>`.

### `LiveTripToday` (`components/planner/live-trip-today.tsx`)

Renders `<ResurfacedFindsSection>` after the day's agenda and before cultural intelligence, when `resurfacedCandidates.length > 0`.

`ResurfacedFindsSection` fires a `useEffect` on mount to:
- Call `trackResurfacing` (server action) for each candidate.
- Fire `TRAVEL_FIND_RESURFACED` analytics event.

### `ResurfacedFindCard` (`components/resurfacing/resurfaced-find-card.tsx`)

One card per candidate. Shows:
- Place name
- Memory spark (line-clamped to 2 lines)
- Primary reason label (highest-priority reason)
- Distance badge (only when `distanceMetric === "GEOGRAPHIC_DISTANCE"`)

Actions:
- **View Find** — links to `/my-balkans/finds`, records `VIEW_FIND`
- **Add to Day** — records `ADD_TO_DAY`, fires `TRAVEL_FIND_ADDED_TO_DAY` analytics
- **Remind Me Later** — records `REMIND_ME_LATER`, 7-day cooldown
- **Not This Trip** — records `NOT_THIS_TRIP`, permanent dismissal for this trip

All actions call `router.refresh()` to re-render with updated suppression state.

---

## Privacy Model

- No continuous location tracking.
- No movement history stored.
- No GPS polling.
- All matching is done server-side against known itinerary points (which the user already saved).
- Coordinates on `InspirationCapture` are populated only when the user explicitly provides them; Phase 26 place resolver sets them to `null`.
- `resurfacing_history` stores user-initiated actions only; no passive tracking rows.

---

## Analytics Events

All events are defined in `lib/analytics.ts` under the Phase 28 comment block.

| Event | Fires when |
|---|---|
| `Travel Find Match Generated` | Reserved for batch/background job (future) |
| `Travel Find Resurfaced` | Candidate is shown to user (`ResurfacedFindsSection` mount) |
| `Travel Find Resurfacing Dismissed` | User taps NOT_THIS_TRIP or DISMISS |
| `Travel Find Added To Trip` | Reserved for add-to-trip flow (future) |
| `Travel Find Added To Day` | User taps ADD_TO_DAY |
| `Travel Find Remind Later` | User taps REMIND_ME_LATER |

---

## i18n

Namespace: `resurfacing` — 15th namespace in the dictionary.

Locales: `en`, `de`, `it`, `hr`.

Key structure:
- `section.title` / `section.subtitle`
- `reasons.{ON_ROUTE,NEAR_OVERNIGHT_STOP,...}` — one per reason
- `confidence.{high,medium,low}`
- `distance.straight_line` — with `{km}` placeholder
- `actions.{view_find,add_to_day,not_this_trip,remind_me_later,dismiss}`
- `saved_label` / `unknown_place`

---

## Decisions Not Taken

| Option | Reason skipped |
|---|---|
| Push notifications | `TravelNotificationProvider` abstraction exists; no vendor hardcoded |
| Travel time display | No routing provider in Phase 28; `TravelDistanceProvider` boundary reserved |
| Continuous GPS | Privacy model forbids it |
| Show all matching finds | Fatigue control is the trust signal; showing everything degrades signal quality |
| Server-side cron resurfacing | In-product is sufficient for Phase 28; cron would require push provider |
| "ALERT: PROXIMITY MATCH" copy | Warm, observant tone as per i18n guidelines |
| Add-to-trip without confirmation | ADD_TO_DAY records intent; actual scheduling is a future flow |

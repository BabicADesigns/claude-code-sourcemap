# Phase 28 — Travel Find Resurfacing & Proximity Intelligence: Pre-Implementation Audit

**Audit conducted before writing Phase 28 code.**
Principle: AUDIT FIRST → REUSE SECOND → EXTEND THIRD → BUILD NEW ONLY WHERE REAL GAP EXISTS.

---

## Existing Feature Inventory

| Feature | Current source | Reliability | Reusable? | Gap | Phase 28 action |
|---------|---------------|-------------|-----------|-----|-----------------|
| Trip matching boundary `getFindsNearDestinations()` | `lib/data/inspiration-captures.ts:127` | ✅ Correct — filters by country_code, excludes DISMISSED | ✅ Yes — reuse as first-pass filter | Country-level only; no name/coordinate matching | **Extend**: pass results to Phase 28 matcher for deeper matching |
| InspirationCapture — lat/lng columns | `supabase/migrations/0022_phase26_inspiration_capture.sql` | ✅ Schema correct — `latitude NUMERIC, longitude NUMERIC` (nullable) | ✅ Yes | Place resolver never populates them (returns null always) — coordinate matching only works for future captures with explicit coordinates | **Use when present** — matcher falls back to name/country matching when null |
| Map point coordinates | `lib/ai/itinerary.ts` mapPointSchema — `latitude: z.number(), longitude: z.number()` | ✅ Always set — from grounding layer | ✅ Yes — itinerary map_points always have coordinates | No gap on trip side | **Use** for haversine matching when capture coordinates are available |
| TripLifecycleState | `lib/ai/live-trip.ts` `computeLifecycle()` | ✅ Pure deterministic function | ✅ Yes — reuse same lifecycle computation | None | **Reuse**: read lifecycle from `computeCurrentMoment()` already in Trip Companion |
| `computeCurrentMoment()` | `lib/ai/live-trip.ts` | ✅ Pure function | ✅ Yes | None | **Reuse**: provides lifecycle + current_day_number |
| BALKAN_PLACES keyword registry | `lib/capture/place-resolver.ts` | ✅ ~70 places with country_code, region | ⚠️ Not exported | Need for multi-country trip country extraction | **Export** `BALKAN_PLACES` from place-resolver.ts |
| Analytics event pattern | `lib/analytics.ts` | ✅ Working | ✅ Yes — extend with 6 new events | Phase 28 events missing | **Extend** |
| i18n namespace pattern (14 namespaces) | `lib/i18n/dictionaries.ts` | ✅ Working | ✅ Yes | 15th `resurfacing` namespace needed | **Extend** |
| shadcn/ui Dialog + card patterns | `components/ui/` | ✅ Working | ✅ Yes | None | **Reuse** styling patterns |
| Server action pattern | `lib/actions/*.ts` | ✅ Consistent — isSupabaseConfigured + getCurrentUser + data layer call | ✅ Yes | Phase 28 actions missing | **Reuse** pattern for new resurfacing.ts actions |
| Trip Companion — `app/trips/[tripId]/today/page.tsx` | Server component | ✅ Loads trip + itemStates + readinessItems + culturalInsights + localPhrases in parallel | ✅ Yes — extend the parallel data fetch | No resurfacing fetch exists | **Extend**: add `getFindsNearDestinations` + `getResurfacingHistory` to parallel fetch |
| `LiveTripToday` component | `components/planner/live-trip-today.tsx` | ✅ Client component with full trip day context | ✅ Yes — add new prop | No "Remember this?" section | **Extend**: add `ResurfacedFindsSection` between practical cards and Now/Next/Later |
| Resurfacing history table | — | ❌ Not present | N/A | No persistence for fatigue control | **Build new**: migration 0023 |
| ResurfacingCandidate / match types | — | ❌ Not present | N/A | No normalized matching domain | **Build new**: add to lib/types.ts |
| Geographic matching engine (haversine) | — | ❌ Not present | N/A | No distance computation | **Build new**: lib/resurfacing/matcher.ts |
| Relevance ranking engine | — | ❌ Not present | N/A | No deterministic scoring | **Build new**: lib/resurfacing/ranker.ts |
| Fatigue control logic | — | ❌ Not present | N/A | No suppression/cooldown | **Build new**: lib/resurfacing/fatigue.ts |
| Resurfacing policy config | — | ❌ Not present | N/A | Thresholds scattered or missing | **Build new**: lib/resurfacing/policy.ts |
| Data layer for resurfacing history | — | ❌ Not present | N/A | No CRUD for history | **Build new**: lib/data/resurfacing-history.ts |
| Server actions for resurfacing | — | ❌ Not present | N/A | No Add to Trip / Dismiss / Remind Me Later | **Build new**: lib/actions/resurfacing.ts |
| ResurfacedFindCard UI component | — | ❌ Not present | N/A | No in-product resurfacing UI | **Build new**: components/resurfacing/resurfaced-find-card.tsx |
| TravelDistanceProvider abstraction | — | ❌ Not present | N/A | No vendor-abstraction boundary | **Build new**: interface in lib/types.ts |
| TravelNotificationProvider abstraction | — | ❌ Not present | N/A | No notification boundary | **Build new**: interface in lib/types.ts |
| `locales/*/resurfacing.json` | — | ❌ Not present | N/A | No i18n for resurfacing | **Build new**: 4 locale files |
| `docs/travel-find-resurfacing-engine.md` | — | ❌ Not present | N/A | No architecture reference | **Build new** |

---

## What Was Reused (from Audit Findings)

1. **`getFindsNearDestinations()`** — reused as first-pass country filter; Phase 28 matcher receives its output
2. **`computeCurrentMoment()` / `computeLifecycle()`** — reused in Trip Companion for lifecycle window determination
3. **Map point coordinates** — `mapPoint.latitude / mapPoint.longitude` (always set) used for haversine matching
4. **Server action pattern** — `isSupabaseConfigured + getCurrentUser + data layer call` — copied exactly in `lib/actions/resurfacing.ts`
5. **shadcn/ui styling** — border, muted, foreground, rounded-lg patterns reused in ResurfacedFindCard
6. **analytics.track() pattern** — extended with 6 new events, same fire-and-forget style
7. **i18n dictionary pattern** — 15th namespace added using the established pattern
8. **shadcn/ui Dialog** — no modal for Phase 28; resurfacing is inline in Trip Companion

## What Was Extended (from Audit Findings)

1. **`lib/capture/place-resolver.ts`** — `BALKAN_PLACES` exported for multi-country trip country extraction
2. **`lib/types.ts`** — Phase 28 types appended
3. **`lib/analytics.ts`** — 6 new Phase 28 events
4. **`lib/i18n/dictionaries.ts`** — 15th namespace `resurfacing` for all 4 locales
5. **`app/trips/[tripId]/today/page.tsx`** — resurfacing data fetch added to parallel Promise.all
6. **`components/planner/live-trip-today.tsx`** — `ResurfacedFindsSection` added between practical cards and Now/Next/Later

## What Was Built New (identified as real gaps)

1. **`supabase/migrations/0023_phase28_resurfacing.sql`** — `resurfacing_history` table with RLS
2. **`lib/resurfacing/policy.ts`** — `ResurfacingPolicyConfig` with all defaults in one place
3. **`lib/resurfacing/matcher.ts`** — deterministic matching engine: name-match + haversine + reason derivation
4. **`lib/resurfacing/ranker.ts`** — documented relevance weights; score 0–100
5. **`lib/resurfacing/fatigue.ts`** — suppression / cooldown / permanent dismiss logic
6. **`lib/data/resurfacing-history.ts`** — data layer: read history + record action
7. **`lib/actions/resurfacing.ts`** — server actions: recordResurfacing, recordResurfacingAction
8. **`components/resurfacing/resurfaced-find-card.tsx`** — inline resurfacing card with warm tone + actions
9. **`locales/{en,de,it,hr}/resurfacing.json`** — 15th i18n namespace

---

## Decisions Not Taken (and Why)

| Option considered | Decision | Reason |
|-------------------|----------|--------|
| Push notifications (Firebase/OneSignal) | ❌ Abstraction boundary only | No notification infrastructure in scope; `TravelNotificationProvider` interface defines the boundary for future activation |
| Travel time display ("34 min away") | ❌ Not implemented | No routing provider; travel time must NEVER be fabricated. Distance in km is shown only when from haversine (labeled clearly as straight-line distance) |
| Continuous GPS tracking | ❌ Rejected | Privacy: no movement history, no background location access |
| Show ALL matching finds | ❌ Rejected | Fatigue control: max 2 strong-score (≥70) candidates shown per session |
| Server-side resurfacing via cron | ❌ Abstraction boundary only | `TravelNotificationProvider` is the boundary; all Phase 28 resurfacing is in-product, user-initiated page load |
| "ALERT: PROXIMITY MATCH DETECTED" tone | ❌ Rejected | Warm observant tone: "Remember this?" not alert language |
| Add to Trip without confirmation | ❌ Rejected | Explicit user confirmation required; ownership validated via server action |
| Fabricated distance when no coordinates | ❌ Rejected | Distance shown only when computed from real coordinates; never estimated from country match |
| Coordinate matching for all captures | Considered | Place resolver never populates lat/lng (no geocoding in Phase 26). Coordinate matching activates only when `InspirationCapture.latitude` and `InspirationCapture.longitude` are non-null. Name matching is the primary path. |

# Post-Trip Reflection & Memory Loop (Phase 24)

## Overview

Phase 24 closes the learning loop between a traveller's lived experience and their future Balkanish plans. When a trip is complete, the planner offers an optional, privacy-first reflection that feeds confirmed insights back into the Travel Memory system.

**Core philosophy:**
- A completed trip should not become dead data.
- Balkanish must not turn travel into a performance review.
- Reflection is optional. Silence is not negative feedback.
- Completion is not preference. Skipping is not dislike.
- Doing something is not proof of enjoyment.
- Explicit reflection outweighs behavioural ambiguity.
- Private reflections stay private.
- The traveller confirms what becomes memory.

---

## Entry Points

| Surface | Condition | CTA |
|---------|-----------|-----|
| `/trips/[tripId]/today` (Live Trip Today) | `lifecycle === "COMPLETED"` | "Remember this trip" |
| My Trips card (saved-itineraries.tsx) | `lifecycle === "COMPLETED"` | "Remember this trip" |
| Direct URL | `/trips/[tripId]/reflection` | n/a |

Eligibility is deterministic:
1. Trip lifecycle must be `COMPLETED`
2. `departure_date` must be set
3. Trip must have at least one itinerary day

Eligibility never expires — a traveller can reflect on a two-year-old trip.

---

## Reflection Flow (5 Steps)

### Step 1: Overall Feeling
One of: `LOVED_IT | GOOD_TRIP | MIXED | NOT_MY_TRIP | PREFER_NOT_TO_SAY`

Never used as a standalone memory candidate. Modulates candidate confidence level only.

### Step 2: Pace & Planning
- **Pace reflection:** `TOO_SLOW | JUST_RIGHT | A_LITTLE_FULL | TOO_FULL | UNKNOWN`
- **Planning comfort:** `MORE_STRUCTURE | CURRENT_LEVEL | MORE_FLEXIBILITY | UNKNOWN`

Both drive learning candidates for the `ITINERARY_PACE` and `PLANNING_STRUCTURE` memory domains.

### Step 3: Item Reflection
Per-slot ratings using the same `day{N}:{slot}` item keys as Phase 23 Live Trip Mode.

Ratings: `LOVED | LIKED | NEUTRAL | WOULD_SKIP | NOT_EXPERIENCED`

**Behavioural ambiguity rules:**
- `DONE` status in Live Trip → defaults to `NOT_EXPERIENCED` in reflection (DONE ≠ LOVED)
- `SKIPPED` status → pre-filled as `NOT_EXPERIENCED`, always user-editable (SKIPPED ≠ DISLIKED)
- Only `LOVED` and `WOULD_SKIP` generate learning candidates

### Step 4: Memory Candidates + Return Intent + Private Note
- **Return intent:** `YES | MAYBE | NO | PREFER_NOT_TO_SAY` + optional destination note
- **Learning candidates:** deterministically derived, shown to traveller for confirmation
- **Private note:** stored server-side only; never read by AI, analytics, or any public surface

### Step 5: Done
Reflection marked `COMPLETED`. Confirmed candidates are promoted to Travel Memory.

---

## Learning Candidate Architecture

Candidates are derived by the **pure deterministic engine** `lib/ai/post-trip-reflection.ts`:

```
buildTripLearningCandidates({
  tripId, days, overallFeeling, paceReflection, planningComfort, reflectionItems
}) → TripLearningCandidate[]
```

No AI inference. No probabilistic guessing. Rules only.

### Candidate derivation rules

| Input | Domain | Candidate value | Condition |
|-------|--------|----------------|-----------|
| `pace_reflection: TOO_FULL` | `ITINERARY_PACE` | `LIGHT` | Always |
| `pace_reflection: A_LITTLE_FULL` | `ITINERARY_PACE` | `BALANCED` | Always |
| `pace_reflection: TOO_SLOW` | `ITINERARY_PACE` | `FULL` | Always |
| `pace_reflection: JUST_RIGHT` | — | none | No candidate |
| `planning_comfort: MORE_FLEXIBILITY` | `PLANNING_STRUCTURE` | `FLEXIBLE` | Always |
| `planning_comfort: MORE_STRUCTURE` | `PLANNING_STRUCTURE` | `STRUCTURED` | Always |
| `planning_comfort: CURRENT_LEVEL` | — | none | No candidate |
| `item: LOVED` | `FOOD_CULTURE` / `ACTIVITY_CATEGORY_PREFERENCE` | `LOVED` | Explicit rating |
| `item: WOULD_SKIP` | `FOOD_CULTURE` / `ACTIVITY_CATEGORY_PREFERENCE` | `WOULD_SKIP` | Explicit rating |
| `item: DONE` | — | none | DONE ≠ LOVED |
| `item: SKIPPED` | — | none | SKIPPED ≠ DISLIKED |

Confidence ranking: `HIGH` (pace + positive overall feeling) > `MEDIUM` > `LOW` (item-level).
Candidates are sorted HIGH → MEDIUM → LOW before display.

---

## Memory Promotion

Confirmed candidates flow into `recordTravelMemorySignal()` with source `POST_TRIP_REFLECTION` (weight: 0.85).

- `POST_TRIP_REFLECTION` is higher weight than `ITINERARY_KEEP` (0.6) and `WIZARD_SELECTION` (0.8)
- Lower than `PROFILE_CONFIRMATION` and `DIRECT_MEMORY_CONFIRMATION` (both 1.0)
- Not in `PROTECTED_MEMORY_SOURCES` (can decay normally)
- Memory promotion route: `confirmLearningCandidate` action → `recordTravelMemorySignal` → `travel_memory_signals` table

Rejected candidates are recorded as decisions but generate no signals. Deferred candidates generate no signals until re-decided.

---

## Grounding Integration

`lib/ai/grounding.ts` exports `derivePaceHintFromMemory(signals)`:
- Reads confirmed `ITINERARY_PACE` signals
- Maps `LIGHT → "relaxed"`, `BALANCED → "balanced"`, `FULL → "active"`
- Returns `null` when no relevant signal exists
- Used as a soft hint for which variant to surface first — never overrides explicit wizard selection

---

## Database Schema (Migration 0021)

Three tables, all user-scoped with RLS:

### `trip_reflections`
One row per `(user_id, trip_id)`. Stores header-level state including `overall_feeling`, `pace_reflection`, `planning_comfort`, `return_intent`, `return_intent_destination`, `private_note`, `status`, `completed_at`.

⚠️ `private_note` is never returned in public-facing responses. Server-side only.

### `trip_reflection_items`
One row per `(user_id, trip_id, item_key)`. Item keys match Phase 23 Live Trip format: `day{N}:{slot}`.

### `trip_learning_candidates`
One row per `(user_id, trip_id, candidate_key)`. Decision log (`CONFIRMED | REJECTED | DEFERRED`) with candidate snapshot for audit. The engine re-derives candidates deterministically — this table is the decision record, not the source of truth.

---

## Privacy Guarantees

1. `private_note` column: never read by AI prompt building, analytics, email content, or any public surface. Admin access via service-role only.
2. No item text, slot descriptions, or destination names are sent to analytics events.
3. The reflection route is auth-gated — unauthenticated users are redirected to sign-in.
4. RLS policies ensure users can only read/write their own rows on all three tables.
5. Memory promotion respects `BLOCKED_MEMORY_DOMAINS` guardrail regardless of reflection content.
6. Return intent destination is optional and not used in analytics.

---

## Analytics Events (Phase 24)

| Event | When | Props |
|-------|------|-------|
| `Reflection Started` | First step saved | — |
| `Reflection Step Completed` | Each step saved | `step` |
| `Reflection Dismissed` | Dismissed | — |
| `Reflection Completed` | Final completion | — |
| `Learning Candidate Confirmed` | Confirmed | `domain` |
| `Learning Candidate Rejected` | Rejected | `domain` |
| `Learning Candidate Deferred` | Deferred | `domain` |
| `Reflection Memory Promoted` | Signal written to memory | `domain` |

No item text, no destination PII, no private note content in any event.

---

## i18n

12th namespace: `reflection` — available in `en`, `de`, `it`, `hr`.

---

## Timing Windows

| Window | Days since last trip day | Display framing |
|--------|--------------------------|-----------------|
| `JUST_RETURNED` | 0–3 | "Welcome back" |
| `RECENT` | 4–30 | "Still fresh" |
| `PAST_TRIP` | 31+ | "Looking back" |

Eligibility is the same regardless of window. The window only affects framing copy, never access.

# Phase 25 — Travel Memory Audit

Audit date: 2026-07-07

---

## Architecture Summary

The travel memory system converts explicit user behaviour into typed preference signals stored in `travel_memory_signals`. These signals are:
1. Written by the server (never by the client directly)
2. Injected into future planner AI briefs
3. Reviewable and modifiable by the user via `/account`

---

## Signal Sources (ALLOWED_MEMORY_SIGNAL_SOURCES)

| Source | Weight | Written by | Trigger |
|--------|--------|-----------|---------|
| `ITINERARY_KEEP` | 0.9 | `saveItinerary` action | User saves a generated itinerary |
| `POST_TRIP_REFLECTION` | 0.85 | `confirmLearningCandidate` action | User confirms a reflection-derived candidate |
| `EXPLICIT_PREFERENCE` | 1.0 | (future) | Direct preference statement |
| `FEEDBACK_EXPLICIT` | 0.95 | (future) | Direct feedback action |
| `QUIZ_RESULT` | 0.8 | (future) | Matchmaker quiz result |

Sources not in this allowlist are silently rejected in `recordTravelMemorySignal`.

---

## Blocked Domains (BLOCKED_MEMORY_DOMAINS)

The following domains can never receive signals, regardless of source:

`HEALTH_CONDITION`, `DISABILITY_STATUS`, `RELIGIOUS_PRACTICE`, `POLITICAL_AFFILIATION`, `SEXUAL_ORIENTATION`, `GENDER_IDENTITY`, `ETHNIC_BACKGROUND`, `INCOME_LEVEL`, `FAMILY_STATUS`, `MENTAL_HEALTH`

These are hard-blocked in `recordTravelMemorySignal` via a Set lookup. No code path bypasses this check.

---

## Signal Write Path

```
Source action (e.g., confirmLearningCandidate)
    ↓
lib/actions/post-trip-reflection.ts (server action, verified user)
    ↓
lib/data/travel-memory.ts: recordTravelMemorySignal()
    ↓ [BLOCKED_MEMORY_DOMAINS check]
    ↓ [ALLOWED_MEMORY_SIGNAL_SOURCES check]
    ↓ [rejection cooldown check]
    ↓
travel_memory_signals table (admin client write)
```

**Admin client only:** All writes use the Supabase admin client. Users cannot write to this table directly. RLS policies on `travel_memory_signals` require `user_id = auth.uid()`, but writes always go through the server-side admin client which bypasses RLS.

---

## Signal Read Path

```
lib/data/travel-memory.ts: getActiveMemorySignals(userId)
    ↓ [admin client, SELECT active=true, ordered by strength]
    ↓
lib/ai/travel-memory.ts: buildMemoryBriefBlock(signals)
    ↓
AI brief (text block injected into gpt-4o-mini prompt)
```

Signals are also read for the `TravelMemoryPanel` on `/account` — but this uses the same `getActiveMemorySignals` function. Users see their own signals only.

---

## Reflection → Memory Promotion Path

From post-trip reflection:

1. `buildTripLearningCandidates(input)` derives candidates deterministically from:
   - `paceReflection` → `ITINERARY_PACE` domain candidate
   - `planningComfort` → `PLANNING_STRUCTURE` domain candidate
   - `reflectionItems` (LOVED/WOULD_SKIP) → `FOOD_CULTURE` / `ACTIVITY_CATEGORY_PREFERENCE` candidates

2. User reviews candidates in the UI and explicitly CONFIRMS/REJECTS/DEFERS each

3. On CONFIRM: `confirmLearningCandidate` server action:
   a. Records decision in `trip_learning_candidates` (audit log)
   b. Calls `recordTravelMemorySignal` with `source: "POST_TRIP_REFLECTION"`

**Explicit confirmation required:** No signal is auto-promoted. The traveller reviews and confirms. This is the core "explicit reflection outweighs behavioural ambiguity" principle.

---

## Behavioural Ambiguity Guardrails

These rules prevent incorrect inference:

| Behaviour | What is NOT inferred | What is inferred |
|-----------|---------------------|-----------------|
| Slot DONE | Nothing (completion ≠ preference) | Nothing |
| Slot SKIPPED | Not dislike | NOT_EXPERIENCED (default) |
| Item rated LOVED | — | POSITIVE signal candidate |
| Item rated WOULD_SKIP | — | NEGATIVE signal candidate |
| Item rated LIKED/NEUTRAL/NOT_EXPERIENCED | — | No candidate |
| Trip overall LOVED_IT | — | Boosts confidence of pace/planning candidates |

---

## Rejection Cooldown

When a user rejects a signal:
- `confirmation_status` set to `REJECTED`
- `rejected_until` set to `NOW + 90 days`
- `active` set to `false`

During the cooldown, `recordTravelMemorySignal` detects the active rejection and skips re-recording. After 90 days, the cooldown row is cleared and the signal can be re-established.

---

## Audit: No Private Data in Memory

Confirmed: `private_note` from trip_reflections is never passed to `buildTripLearningCandidates` or `recordTravelMemorySignal`. The reflection's `private_note` exists only in the `trip_reflections` table and is displayed only to the user on the reflection page. It has no path into the memory system.

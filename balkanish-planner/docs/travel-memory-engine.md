# Travel Memory Engine — Phase 21

## Overview

The Travel Memory Engine makes the Balkanish Planner progressively more useful without becoming invasive. As travellers plan trips, the system notices patterns — preferences they keep selecting, things they regenerate away from — and carries those signals into future AI briefs.

The traveller stays in control at every step. Nothing is hidden, nothing persists against their will, and no sensitive attribute is ever inferred from where they travel.

---

## Core Principles

1. **Transparency**: The traveller can see every signal the system holds about them.
2. **Control**: Every signal can be confirmed, rejected, or wiped entirely.
3. **Minimalism**: Only meaningful planning signals are stored. Browsing behaviour, page views, and partner clicks are not tracked.
4. **Privacy-by-design**: A hardcoded blocklist of sensitive domains (religion, ethnicity, sexual orientation, etc.) is never inferred, regardless of destination patterns.
5. **Explicit always wins**: Profile preferences and confirmed signals always take precedence over learned signals in the AI brief.
6. **No hidden profiling**: Memory signals are never shared across users, never sold, never used for advertising, and never surfaced on shared trip pages.

---

## Data Model

### `TravelMemorySignal`

One observed preference. Rows deduplicate on `(user_id, domain, subject, direction)` — repeated observations increment `occurrence_count` rather than creating new rows.

| Field | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | FK → profiles(id) ON DELETE CASCADE |
| `source` | `MemorySignalSource` | Where this signal came from (7 values) |
| `domain` | `MemoryPreferenceDomain` | Preference category (30 values) |
| `subject` | `string` | Human-readable description, e.g. "slow mornings and cafés" |
| `value` | `string?` | Optional specific value, e.g. "Dubrovnik", "Croatian wine" |
| `direction` | `POSITIVE \| NEGATIVE \| NEUTRAL` | Signal direction |
| `strength` | `numeric(4,3)` | Computed 0–1; source weight + repetition bonus, capped at 1.0 |
| `confidence` | `numeric(4,3)` | Computed 0–1; strength + confirmation boost |
| `source_trip_id` | `uuid?` | The trip that triggered this signal |
| `occurrence_count` | `integer` | How many times observed; drives repetition bonus |
| `first_observed_at` | `timestamptz` | First observation |
| `last_observed_at` | `timestamptz` | Last observation; used for decay calculation |
| `trip_context` | `MemoryTripContext?` | SOLO / COUPLE / FAMILY / FRIENDS / WORKATION / ROAD_TRIP |
| `confirmation_status` | `UNCONFIRMED \| CONFIRMED \| REJECTED` | Traveller review state |
| `rejected_until` | `timestamptz?` | Rejection cooldown expiry (90 days from rejection) |
| `active` | `boolean` | False = soft-deleted (reset flow) |

---

## Signal Sources

| Source | Base Weight | Decay Protected |
|---|---|---|
| `PROFILE_CONFIRMATION` | 1.0 | Yes |
| `DIRECT_MEMORY_CONFIRMATION` | 1.0 | Yes |
| `WIZARD_SELECTION` | 0.8 | No |
| `TRIP_COMPLETION_FEEDBACK` | 0.7 | No |
| `ITINERARY_KEEP` | 0.6 | No |
| `ITINERARY_REGENERATE` | 0.4 | No |
| `PARTNER_SAVE` | 0.4 | No |

Only sources in `ALLOWED_MEMORY_SIGNAL_SOURCES` are accepted at ingestion. This allowlist is the single point of control for what the system is permitted to learn.

---

## Strength & Confidence

**Strength** (0–1) measures how reliable a signal is as a planning input:

```
strength = min(1.0, source_weight + min(0.3, (occurrence_count - 1) × 0.1))
```

Each repetition adds 0.1 up to a bonus cap of 0.3. A `PROFILE_CONFIRMATION` signal starts at 1.0 and stays there.

**Confidence** (0–1) adds a confirmation boost:

```
confidence = min(1.0, strength + (0.3 if CONFIRMED else 0))
```

**Strength labels** for UI display:
- `strong_pattern` — strength ≥ 0.7
- `noticed` — strength ≥ 0.45
- `still_learning` — strength < 0.45

---

## Decay Model

Signals older than **18 months** (measured from `last_observed_at`) are treated as decayed and excluded from AI briefs.

Exceptions that never decay:
- Sources in `PROTECTED_MEMORY_SOURCES` (`PROFILE_CONFIRMATION`, `DIRECT_MEMORY_CONFIRMATION`)
- Signals with `confirmation_status = CONFIRMED`

---

## Blocked Domains (Hard Privacy Guardrail)

The following domains are **permanently blocked** at ingestion, regardless of source or content:

```
RELIGION, ETHNICITY, RACE, SEXUAL_ORIENTATION, POLITICAL_AFFILIATION,
HEALTH, DISABILITY, INCOME, IMMIGRATION_STATUS, CRIMINAL_HISTORY
```

This is enforced in `recordTravelMemorySignal()` before any database write. There is no override. Cultural interest in a region never implies cultural identity.

---

## Rejection Cooldown

When a traveller rejects a signal, the system records `rejected_until = now() + 90 days`. During the cooldown:
- New observations of the same `(domain, subject, direction)` are silently discarded.
- The rejected signal is hidden from the UI.

After the cooldown expires, the next observation for that signal starts fresh (counter resets to 1).

---

## AI Brief Integration

When an authenticated user generates an itinerary, `getActiveMemorySignals()` loads their signals in parallel with cultural data. Signals are filtered to:
- `active = true`
- `confirmation_status ≠ REJECTED`
- Not decayed (age < 18 months, or protected/confirmed)
- `strength_label ≠ still_learning` — only confirmed and strong/noticed signals reach the AI

The filtered signals are formatted as a `trip_memory` block in the grounding brief JSON:

```json
{
  "trip_memory": "- Traveller enjoys slow mornings and cafés\n- Traveller enjoys Wine & gastronomy (confirmed preference)\n- Traveller prefers to avoid crowded tourist hotspots"
}
```

### System Prompt Rules

The `PROSE_SYSTEM_PROMPT` instructs the model to:
- Use memory signals silently to shape tone and emphasis
- **Never** mention that memory was used ("we remembered you like...", "based on your past trips...")
- **Never** infer sensitive personal attributes from destination choices
- Treat memory as background context, not a feature to narrate

---

## Ingestion Points

All signal writes go through `recordTravelMemorySignal()` in `lib/data/travel-memory.ts`. Call sites:

| Event | Source | Signal |
|---|---|---|
| Itinerary saved | `ITINERARY_KEEP` | Interests, travel_mood, cuisine_preferences, transport_preferences |
| Profile update | `PROFILE_CONFIRMATION` | Interests, travel preferences |
| Wizard selection | `WIZARD_SELECTION` | Interests, mood, cuisine, transport |

**Partner commercial relationships never influence memory weighting.** Saving a partner listing may generate a `PARTNER_SAVE` signal, but that source carries a fixed 0.4 weight and is not adjustable.

---

## Memory Management UI

Location: `/account` → `TravelMemoryPanel`

Sections:
1. **Confirmed preferences** — signals the traveller has explicitly confirmed; shown prominently
2. **We've noticed** — strong + noticed unconfirmed signals; each has Confirm/Not for me buttons
3. **Still learning** — weak signals; shown minimally, no action needed
4. **Reset learned preferences** — 2-step confirmation; wipes all unconfirmed non-profile signals

### Privacy Note

Displayed at the bottom of the panel:

> "Your travel memory is private — it's only ever used to personalise your own itineraries. We never share it, never use it for advertising, and never infer sensitive personal attributes from where you travel."

---

## Privacy Constraints

- Memory signals are never included in PDF exports
- Memory signals are never exposed on shared trip pages (public itinerary links)
- Memory signals are never used to rank or promote commercial partners
- Memory signals are never sent to third parties
- Cultural interest signals (e.g. "enjoys History & heritage") never imply cultural identity

---

## Database Schema

Migration: `supabase/migrations/0018_phase21_travel_memory.sql`

Table: `travel_memory_signals`

RLS:
- **SELECT**: `auth.uid() = user_id` — users read only their own signals
- **UPDATE**: `auth.uid() = user_id` — users update only their own signals
- **INSERT**: No authenticated-role policy — all writes via service role (`createSupabaseAdminClient`)

This ensures the allowlist check and blocked-domain check in `recordTravelMemorySignal()` cannot be bypassed from the client.

---

## Files

| File | Role |
|---|---|
| `supabase/migrations/0018_phase21_travel_memory.sql` | Schema + RLS |
| `lib/types.ts` | Type definitions + constants (BLOCKED_MEMORY_DOMAINS, ALLOWED_MEMORY_SIGNAL_SOURCES, etc.) |
| `lib/ai/travel-memory.ts` | Pure utility: strength/confidence computation, decay check, brief builder |
| `lib/data/travel-memory.ts` | Server-only data layer: getActiveMemorySignals, recordTravelMemorySignal, updateSignalConfirmation, deleteLearnedSignals |
| `lib/actions/travel-memory.ts` | Server actions: confirmMemorySignal, rejectMemorySignal, resetLearnedMemory |
| `lib/ai/itinerary.ts` | TravelMemoryContext interface; trip_memory block in grounding brief; PROSE_SYSTEM_PROMPT update |
| `lib/actions/itineraries.ts` | Signal extraction on itinerary save |
| `app/api/planner/route.ts` | Memory load in parallel with cultural data |
| `components/account/travel-memory-panel.tsx` | Memory management UI |
| `app/account/page.tsx` | Renders TravelMemoryPanel |
| `locales/*/travel-memory.json` | i18n strings (en, de, it, hr) |

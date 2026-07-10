# Personalization Engine — Phase 17

## Overview

Phase 17 introduces the Balkanish Smart Personalization Engine: a preference-aware layer that shapes itinerary tone, food recommendations, and destination ranking to match each traveller's stated tastes — without ever inventing facts or bypassing the editorial trust model.

The engine has three surfaces:
1. **Traveller Profile** — saved preferences in the account settings page
2. **Planner Wizard** — new "Mood & Food" step (step 4 of 6) lets each trip carry its own vibe
3. **AI Brief** — the `personalization` block enriches the JSON skeleton sent to the prose layer

---

## Architecture

### Two-layer trust model (unchanged from Phase 11)

```
Layer A: curated mockDestinations (deterministic, editorial-verified)
Layer B: AI-suggested DestinationCandidates (clearly labelled, never mixed with Layer A)
```

Personalization operates entirely within Layer A. It changes *which* destinations rank highest and *how* the AI writes about them — never what destinations exist or what their facts are.

### Personalization data flow

```
Profile → PlannerFlow (pre-fill defaultValues)
              ↓
         PlannerInput { travel_mood, cuisine_preferences, ... }
              ↓
         buildGroundingBrief() → adds `personalization {}` block to JSON brief
              ↓
         PROSE_SYSTEM_PROMPT (mood → tone shaping, cuisine → food emphasis)
              ↓
         AI prose output (same stops, different narrative register)
```

---

## New Types (lib/types.ts)

### TravelerInterest (13 values)
`food | history | beaches | photography | hiking | islands | nightlife | architecture | hidden_gems | wine | family | wellness | adventure`

Used to score destinations against stated interests in `computeRecommendationScore()`.

### MobilityOption (7 values)
`car | camper | motorcycle | bicycle | ferry | public_transport | walking`

Stored in profile; not yet used in route planning (Phase 18 target).

### CuisinePreference (8 values)
`vegetarian | seafood | traditional_balkan | street_food | fine_dining | wine_lovers | coffee_lovers | desserts`

Included in the AI prose brief to shape food culture language in itinerary days.

### TravelMood (8 values)
`slow_living | romantic | adventure | family_time | digital_detox | road_trip | luxury_escape | weekend_escape`

Included in the AI prose brief; influences tone/register only — never destination selection.

### SeasonalData (interface)
```typescript
{
  best_months: number[];       // 1-indexed (1 = January)
  avoid_months?: number[];
  avoid_reason?: string;
  seasonal_highlights: { spring?, summer?, autumn?, winter? };
  rainy_day_ideas?: string[];
}
```

Added as an optional field on `Destination`. Authored editorially; never AI-generated.

### CrowdLevel
`busy | moderate | quiet` — editorial tier for peak-season crowd density. Architecture-only in Phase 17; no live API or real-time data.

---

## Recommendation Score (lib/ai/recommendation-score.ts)

Internal scoring function — not exposed in UI or API responses.

```
total = interest_match (35%) + season_fit (25%) + crowd_fit (20%) + editorial_quality (20%)
```

| Sub-score | Source | Notes |
|---|---|---|
| `interest_match` | TravelerInterest → Destination numeric scores | Maps each interest to the most relevant score keys (food_score, story_score, etc.) |
| `season_fit` | SeasonalData.best_months / avoid_months + travel month | Falls back to 0.5 when no SeasonalData exists |
| `crowd_fit` | CrowdLevel / crowd_score + TravelMood | Quiet moods (slow_living, digital_detox, romantic) prefer low-crowd destinations |
| `editorial_quality` | local_score + story_score + inverse crowd_score | Always-on; rewards genuinely local, story-rich, uncrowded places |

Phase 18 may surface this score in editorial admin tools for content curation ranking.

---

## Seasonal Intelligence (lib/ai/seasonal.ts)

Pure helper functions operating on `SeasonalData`:
- `isBestMonth(data, month)` — true if month is in `best_months`
- `isAvoidMonth(data, month)` — true if month is in `avoid_months`
- `seasonalSummary(data, month)` — human-readable string from `seasonal_highlights`
- `seasonFit(data, month)` — 0–1 fitness score (used by recommendation-score.ts)
- `rainydayHints(data)` — returns `rainy_day_ideas` array

Seasonal data is authored editorially alongside destination copy. Phase 18 will backfill `SeasonalData` for all mock destinations.

---

## Planner Wizard Changes

A new step 4 ("Mood & food") has been added between Interests (step 3) and Review (now step 5).

### Step 4 — Vibe
- **Travel mood** (single select, optional): 8 moods + "No preference"
- **Food & drink preferences** (multi-select checkboxes, optional): 8 cuisine types

Both fields are optional. Skipping them produces the same itinerary generation as before Phase 17.

### Pre-fill from Profile
`PlannerFlow` now accepts an optional `profile?: Profile | null` prop. When present:
- `budget` defaults to `profile.budget_preference ?? "mid_range"`
- `pace` defaults to `profile.travel_pace ?? "balanced"`
- `cuisine_preferences` defaults to `profile.cuisine_preferences ?? []`

The planner page (`app/planner/page.tsx`) fetches the current user's profile server-side and passes it to `PlannerFlow`. When Supabase is unconfigured or the user is signed out, `profile` is null and the wizard behaves exactly as before.

---

## BudgetTier — "premium" Added

`BUDGET_TIERS` now has 4 tiers: `budget | mid_range | premium | luxury`.

The previous "luxury" tier label ("Premium — design hotels…") has been renamed to "Premium — design hotels, private drivers, curated experiences" and a new "Luxury — five-star stays, private yachts, tasting menus" tier sits above it.

Existing saved itineraries that used `"luxury"` are unaffected — the value is unchanged. No migration is needed for the ENUM since `BudgetTier` is a TypeScript type, not a Postgres ENUM.

---

## AI Prompt Improvements

`buildGroundingBrief()` now includes a `personalization` block in the JSON brief:

```json
{
  "personalization": {
    "travel_mood": "Slow Living",
    "food_preferences": "Seafood, Wine lovers",
    "budget": "Mid-range — boutique stays, good tables, the occasional splurge"
  }
}
```

`PROSE_SYSTEM_PROMPT` instructs the AI to use this block for tone only:
- `travel_mood` → emotional register (Slow Living = contemplative pace; Adventure = kinetic energy)
- `food_preferences` → which dining moments to foreground in morning/afternoon/evening paragraphs
- `budget` → accommodation and dining language calibration

The "AI never invents facts" constraint is explicitly preserved: personalization shapes narrative, never destination facts or place names.

---

## Account Settings Changes

`ProfileForm` now includes a "Travel preferences" section:
- Default pace (select)
- Default budget (select)
- Interests (checkboxes — 13 options)
- How you travel / Mobility (checkboxes — 7 options)
- Food & drink preferences (checkboxes — 8 options)

`updateProfile` server action persists these as:
- `travel_pace` — text with CHECK constraint
- `budget_preference` — text with CHECK constraint
- `interests` — text[] array
- `mobility` — text[] array
- `cuisine_preferences` — text[] array

---

## Database Migration (0014_phase17_personalization.sql)

```sql
-- profiles
ADD COLUMN travel_pace         text   CHECK (travel_pace IN ('relaxed', 'balanced', 'active'))
ADD COLUMN interests           text[] DEFAULT '{}'
ADD COLUMN mobility            text[] DEFAULT '{}'
ADD COLUMN budget_preference   text   CHECK (budget_preference IN ('budget', 'mid_range', 'premium', 'luxury'))
ADD COLUMN cuisine_preferences text[] DEFAULT '{}'

-- destinations
ADD COLUMN seasonal_data jsonb
ADD COLUMN crowd_level   text   CHECK (crowd_level IN ('busy', 'moderate', 'quiet'))
```

All columns are nullable/additive. No existing rows are modified.

---

## Privacy Considerations

- Preferences are user-owned and optional. Every field is nullable; the planner works without them.
- No preference data is shared publicly, included in generated PDFs, or exposed in API responses.
- The `mobility` field is stored but not yet used in route planning — it is reserved for Phase 18 route-mode filtering.
- Engagement signals (Phase 16) remain separate from preference data and are never joined for user-facing outputs.
- Preference arrays store string values only; no location or behavioural tracking is introduced.

---

## Crowd Awareness

`CrowdLevel` (`busy | moderate | quiet`) is an architectural type added in Phase 17. In this phase:
- It exists on `Destination` as an optional field
- It is used by `computeRecommendationScore()` to bias recommendations toward quieter places for quiet-preferring moods
- No destination in the current mock dataset has `crowd_level` set yet — backfill is planned for Phase 18
- The fallback is the existing numeric `crowd_score` field

Live crowd data (real-time APIs, seasonally updated feeds) is explicitly out of scope. If implemented in a future phase, it must remain clearly labelled and isolated from editorial content.

---

## Future Improvements (Phase 18+ Targets)

- Backfill `SeasonalData` for all 35+ mock destinations
- Backfill `crowd_level` for high-traffic destinations (Dubrovnik, Split, Plitvice)
- Use `mobility` to filter out car-dependent itineraries for public-transport travellers
- Surface recommendation scores in editorial admin for curation ranking
- Add `TravelerInterest` pre-fill to the wizard's Interests step (not just profile)
- Consider collaborative filtering: "travellers with similar interests also liked…"

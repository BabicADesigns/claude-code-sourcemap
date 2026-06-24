# Planner Intelligence — Phase 8 Architecture & Audit

**Product:** Balkanish Planner
**Status:** Implemented. Covers the guided planner wizard, destination scoring, explainability, route variants, and day-trip matching shipped in Phase 8. No auth, payments, analytics, Supabase schema, or OpenAI prompt/client changes were made — Phase 8 is planner UX and itinerary-quality work only, layered on top of the deterministic grounding architecture from Phase 6 (`lib/ai/grounding.ts`, `docs/ai-expansion-roadmap.md`).

---

## 1. What changed and why

Before Phase 8, the planner was a single form (duration, month, budget, travel style, interests) that produced one itinerary. The brief asked for a guided, multi-step experience that explains its own choices and offers a choice of routes, without touching auth/payments/analytics/Supabase credentials/OpenAI prompts.

The implementation has four moving parts:

1. **`PlannerStyle`** (`lib/types.ts`) — a new 8-value travel-style type (`slow_travel`, `food_and_wine`, `road_trip`, `romantic_escape`, `family`, `culture`, `nature`, `mixed`) used everywhere in the planner UI and grounding logic. It deliberately does **not** touch the existing `travel_style` Postgres enum (4 values, used by `Profile` and `SavedItinerary`), which can't be extended without a migration. `PLANNER_STYLE_TO_TRAVEL_STYLE` maps the 8 planner styles down to the 4 legacy enum values only at the two Supabase write call sites (`app/api/planner/route.ts`, `lib/actions/itineraries.ts`). Everywhere else — scoring, the wizard, the PDF — uses `PlannerStyle` directly.
2. **`lib/ai/grounding.ts`** — deterministic scoring, sequencing, and explainability. No AI calls. This is the engine described in sections 2–4 below.
3. **`lib/ai/itinerary.ts`** — builds the factual itinerary skeleton from the grounded output, then (only if `OPENAI_API_KEY` is set) asks the model to narrate prose around that fixed skeleton. The OpenAI call, prompt, schema, and client are unchanged from Phase 6; only the *inputs* feeding the skeleton changed.
4. **`components/planner/planner-flow.tsx`** — the 5-step wizard (Destination → Trip length & pace → Style & budget → Interests → Review) that collects the inputs above and renders the 3 generated route variants as tabs.

## 2. Destination matching and the five-factor score

Selection is driven by `deriveItineraryFocus(plannerStyle, interests)` (`grounding.ts`), which maps the chosen style and interests onto one of the existing `ItineraryFocus` values (`coast`, `food`, `wine`, `culture`, `national_park`, `romantic`, `family`, `slow_living`, `road_trip`, `mixed`) via `PLANNER_STYLE_FOCUS_WEIGHTS` and `INTEREST_FOCUS_WEIGHTS`. Ties are broken by a fixed `FOCUS_PRIORITY` order; a focus with no signal, or a 3-way+ tie, falls back to `"mixed"` rather than guessing.

Every candidate destination in the resolved pool is then scored by `scoreDestination(destination, plannerStyle, focus, pace)`, which combines five independent 0–1 factors:

| Factor | What it measures | Source |
|---|---|---|
| `styleMatch` | How well the destination's existing six-metric scores match the resolved focus (e.g. `food`→`food_score`, `coast`→`sunset_score`+`slow_living_score`, with `crowd_score` inverted) | `styleMatchScore` |
| `foodMatch` | `food_score`/10 plus a bonus if the destination's `travel_types` include `food_destination`/`wine_region` | `foodMatchScore` |
| `cultureMatch` | `story_score`/10 plus a bonus for `historic_town`/`cultural_experience` travel types | `cultureMatchScore` |
| `natureMatch` | Blend of `sunset_score` and inverted `crowd_score`, plus a bonus for `national_park`/`mountain_escape`/`island_escape` travel types | `natureMatchScore` |
| `pacingFit` | How calm (`slow_living_score` + inverted `crowd_score`) or active (`story_score`+`food_score`) the destination is, weighted toward whichever the chosen `pace` wants | `pacingFitScore` |

These five factors are combined with **per-style weights** (`SCORE_WEIGHTS`), each row summing to 1.0, so a `food_and_wine` request weights `foodMatch` at 0.45 while a `nature` request weights `natureMatch` at 0.45:

```
slow_travel:      styleMatch .35  foodMatch .15  cultureMatch .15  natureMatch .10  pacingFit .25
food_and_wine:     styleMatch .20  foodMatch .45  cultureMatch .15  natureMatch .05  pacingFit .15
road_trip:         styleMatch .30  foodMatch .15  cultureMatch .20  natureMatch .20  pacingFit .15
romantic_escape:   styleMatch .40  foodMatch .15  cultureMatch .15  natureMatch .10  pacingFit .20
family:            styleMatch .30  foodMatch .15  cultureMatch .15  natureMatch .15  pacingFit .25
culture:           styleMatch .25  foodMatch .10  cultureMatch .45  natureMatch .05  pacingFit .15
nature:            styleMatch .25  foodMatch .10  cultureMatch .10  natureMatch .45  pacingFit .10
mixed:             styleMatch .25  foodMatch .20  cultureMatch .20  natureMatch .20  pacingFit .15
```

**Distance is deliberately not a per-candidate score.** Baking distance into the ranking would penalize a genuinely great destination just for being far from the others before a route has even been chosen. Instead, distance is computed at the *route* level after selection: `buildGroundedItinerary` runs the selected stops through `sequenceGeographically` (greedy nearest-neighbor ordering) and records the real haversine distance between each consecutive stop as `legDistancesKm`. Those numbers roll up into `route_summary.total_distance_km` / `average_distance_km`, which the wizard's Review step and the PDF's Trip Summary page both surface — so distance is visible and honest without distorting which destinations get picked.

Pool sizing also adapts to pace: `idealStopCount(days, pace)` divides trip length by `PACE_DAYS_PER_STOP` (3.5 relaxed / 2.5 balanced / 1.8 active days per stop), so a relaxed 10-day trip targets fewer, longer stays than an active 10-day trip covering more ground.

## 3. Day-trip integration and the hub-city fix

**Root cause of the gap named in the brief:** `lib/data/day-trips.ts` already referenced `"Zagreb"`, `"Split"`, and `"Dubrovnik"` as day-trip `origin` strings (e.g. Zagreb→Plitvice, Split→Trogir, Dubrovnik→Cavtat), but none of those three cities existed as `Destination` entries in `lib/data/destinations-mock.ts`. `attachDayTrips` matches day trips by exact (case-insensitive) name against the *selected stops* — so a day trip whose origin never appears as a stop can never attach, no matter how good the matching logic is. The bug was missing data, not a matching-algorithm defect.

**Fix:** added real `Destination` entries for Zagreb, Split, and Dubrovnik (full six-metric scores, `travel_types`, region, coordinates), so they can be selected as stops like any other destination. No changes were needed to the matching algorithm itself.

**Matching logic** (`attachDayTrips`, unchanged): for each selected stop, find day trips whose `origin` matches the stop's name and whose `destination` isn't already a stop in this itinerary (no point day-tripping to somewhere you're already staying). The number of day trips attached per stop is capped by `PACE_MAX_DAY_TRIPS` (1 for relaxed, 2 for balanced, unlimited for active) — a relaxed trip shouldn't be packed with side quests.

**Verified live** (production build, manual API smoke test): a Croatia/culture/18-day/active request selected `['Dubrovnik', 'Grožnjan', 'Motovun', 'Pula', 'Split', 'Šibenik']` as stops and correctly attached `Dubrovnik→Cavtat`, `Split→Trogir`, and `Pula→Rovinj` as day trips.

## 4. Explainability

Every generated itinerary includes a `selection_reasons` array — one deterministic sentence per stop, built from the *same* score breakdown used to rank it (never AI-invented, never a separate explanation pass that could drift from the actual selection logic).

`buildSelectionReason` (`grounding.ts`) picks the strongest signal behind a destination's inclusion:

- If `styleMatch` is the destination's best factor, the sentence credits the chosen travel style directly: *"because it matches your slow travel preference"*.
- Otherwise it credits whichever secondary factor scored highest — food (*"it's a strong fit for its food and drink scene"*), culture (*"its history and story"*), or nature (*"its scenery and the outdoors"*).
- A pacing clause is appended only when the stop's `crowd_score` meaningfully differs from the route's average: noticeably quieter stops get *"and provides a slower, quieter pace than the rest of this route"*; noticeably busier ones get *"and brings more energy and bustle than the rest of this route"*. Stops close to the route average get no pacing clause, instead of a forced one.

This produces sentences in the exact shape the brief asked for. Verified live output: *"We selected Motovun because it's a strong fit for its food and drink scene and provides a slower, quieter pace than the rest of this route,"* which closely mirrors the brief's own worked example about Motovun.

Explanations are rendered on both output surfaces that exist today:
- Web: a "Why these stops" panel in `components/planner/itinerary-view.tsx`, placed after the route map and before the day-by-day plan.
- PDF: a dedicated "Why These Stops" page in `components/planner/itinerary-pdf.tsx`, placed between the Trip Summary page and the Daily Itinerary pages.

## 5. Dynamic route variants

`ROUTE_VARIANTS = ["conservative", "balanced", "explorer"]`, each locked to a fixed pace via `VARIANT_PACE` (`conservative`→`relaxed`, `balanced`→`balanced`, `explorer`→`active`). `generateItineraryVariants(input)` calls the same, unmodified `generateItinerary(input, variant)` three times in parallel — the variants are not three different algorithms, they're the same scoring/sequencing/day-trip/explainability pipeline run three times with a different pace, which is what actually changes stop count, day-trip density, and pacing-fit weighting per the table in section 2.

The wizard's `pace` field is separate from this: it's the pace the *user* says they want, used only to pick which variant tab opens by default after generation (`defaultVariantForPace`), so a user who chose "Active" lands on the Explorer tab first but can still freely switch to Conservative or Balanced — all three are always generated and shown.

The API response shape is `{ itineraries: { conservative, balanced, explorer } }`. Only the `balanced` variant is persisted to `generated_itineraries.itinerary_json` when Supabase is configured — the other two are cheap to regenerate from the same stored `PlannerInput` and don't need their own rows.

## 6. AI-expansion readiness

Phase 8 implements the diagnostic recommended by **Stage 1** of `docs/ai-expansion-roadmap.md` ("Coverage-aware curated selection"): every grounded itinerary now carries a `coverageScore` (0–1, how comfortably the curated pool covered the request relative to the ideal stop count for that pace) and a `widenedSearch` boolean (true when the requested country's pool was too thin and the search had to widen to the full curated dataset — see `poolForCountryAndFocus`'s 3-tier fallback). Both are purely diagnostic today, exactly as the roadmap specified: they don't change which destinations get picked, but they're the trigger condition the roadmap names for Stage 2 ("only show/seek external candidates when curated coverage is genuinely thin").

Nothing in Stages 2–4 (gated external discovery, editorial promotion, dynamic AI-proposed destinations) was implemented or required by this phase. The scoring, sequencing, and explainability logic in `grounding.ts` is written entirely against the existing `Destination` shape and curated dataset — when a `DestinationSource` (Stage 2) eventually exists, `poolForCountryAndFocus` is the single function that would need to merge in external candidates, and `scoreDestination` would need those candidates to arrive with real score fields before they could be ranked. No redesign required, per the roadmap's stated goal.

## 7. PDF and future-export readiness

Every `GeneratedItinerary` already exposes everything requirement #8 asked for, independent of whether a PDF is actually generated:

- **Route summary** — `route_summary` (`stop_count`, `day_trip_count`, `total_distance_km`, `average_distance_km`).
- **Trip theme** — `trip_theme`, a short descriptor built from the resolved focus and planner style.
- **Explanation notes** — `selection_reasons`, described in section 4.
- **Recommended day trips** — `day_trips`, each with origin, drive time, why-go copy, and a local tip.

These fields are part of `generatedItinerarySchema` (`lib/ai/itinerary.ts`) regardless of export path, so any future export surface (email, share link, alternate PDF layout) can consume the same itinerary object the wizard and the current PDF already use — no planner-side changes needed to support a new export format.

## 8. Validation

- `tsc --noEmit`, `eslint .`, and `next build` all pass clean.
- Manual production-server smoke testing (`npm run build && npm run start`) confirmed: the 3-variant API contract, thin-country pool widening (Slovenia, 2 destinations, resolves without a Stage-2 external source), the hub-city day-trip fix (Dubrovnik→Cavtat, Split→Trogir), and explainability sentence formatting against several representative style/country/duration/pace combinations.

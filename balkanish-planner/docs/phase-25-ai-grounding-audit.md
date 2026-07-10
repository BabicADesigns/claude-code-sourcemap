# Phase 25 — AI Grounding Audit

Audit date: 2026-07-07

---

## Pipeline Overview

```
User input (PlannerInput)
    ↓
lib/ai/grounding.ts (deriveItineraryFocus → buildGroundedItinerary)
    ↓ [deterministic, mock dataset]
GroundedItinerary (skeleton: days, stops, food, day-trips)
    ↓
lib/ai/itinerary.ts (buildGroundingBrief → fetchProse via OpenAI)
    ↓ [OpenAI gpt-4o-mini — optional]
GeneratedItinerary (skeleton + prose applied)
    ↓
lib/ai/discovery.ts (discoverDestinationCandidates — optional)
    ↓ [OpenAI function call — optional]
GeneratedItinerary (with discovered_candidates appended)
```

---

## Grounding Layer (lib/ai/grounding.ts)

**Data source:** Static mock arrays (`mockDestinations`, `mockDayTrips`, `mockFoodFinds`, `mockCultureNotes`)  
**AI involvement:** None — pure deterministic functions

### Key functions audited

| Function | Purpose | Deterministic? |
|----------|---------|----------------|
| `deriveItineraryFocus` | Maps plannerStyle + interests → ItineraryFocus | Yes |
| `scoreDestination` | 5-factor scoring (style/food/culture/nature/pacing) | Yes |
| `selectDestinations` | Picks 2–4 destinations from curated pool | Yes |
| `sequenceGeographically` | Nearest-neighbor route ordering | Yes |
| `buildGroundedItinerary` | Assembles full skeleton | Yes |
| `findFoodFindsForDestination` | Finds food by destination and focus | Yes |

**Invariants:**
- No AI calls, no external I/O
- Output depends only on the input + mock dataset
- Same input always produces same output (deterministic)
- Never invents place names or driving times

---

## AI Prose Layer (lib/ai/itinerary.ts)

**Model:** OpenAI `gpt-4o-mini`  
**Trigger:** `isOpenAIConfigured()` — skipped when `OPENAI_API_KEY` absent

### Prompt structure (buildGroundingBrief)

The AI brief includes:
- Trip style, budget, pace, country, month
- Selected destination names (from grounding)
- Day trip references
- Cultural context (insights + founder notes — from DB or mock)
- Memory brief (active signals — from DB only)
- Logistics context (route practicality — from DB or mock)

**What AI is allowed to do:**
- Write narrative prose for each day slot (morning/afternoon/evening/food_highlight)
- Add a trip title, tagline, theme narrative
- Style text to match the tone brief

**What AI is NOT allowed to do (enforced by schema parsing):**
- Invent new destination names (grounding provides the skeleton)
- Invent day trips (skeleton pre-filled)
- Invent food highlights (skeleton pre-filled from food-finds data)
- Override routing or day assignments

### Fallback behavior

When `isOpenAIConfigured()` returns false OR when OpenAI call fails:
```ts
.catch((error) => {
  console.error("AI prose layer failed; falling back to deterministic itinerary text.", error);
  return null;
})
```
`applyProse(skeleton, prose)` is only called when prose is non-null. The skeleton is returned as-is. Users see a valid itinerary structure but without narrative prose.

**Gap (P25-M02):** The fallback is silent. Users do not know they received a degraded itinerary.

---

## Discovery Layer (lib/ai/discovery.ts)

**Model:** OpenAI (same API key)  
**Trigger:** Only when `grounded.coverageScore < DISCOVERY_COVERAGE_THRESHOLD` or user provided a custom destination query

Discovery is a best-effort expansion — it suggests additional destination candidates that fall outside the curated mock pool. These are returned as `discovered_candidates` on the itinerary and go through the moderation pipeline before appearing on any editorial surface.

**Invariant:** Discovery results never replace grounded destinations. They are additive candidate suggestions only.

---

## Memory Integration

Active travel memory signals are fetched via `getActiveMemorySignals(user.id)` and passed to `buildMemoryBriefBlock`. The memory brief is injected into the AI prompt as a soft-preference hint block.

**Guardrails:**
- Signals must be in `ALLOWED_MEMORY_SIGNAL_SOURCES` (source allowlist)
- Signals must not be in `BLOCKED_MEMORY_DOMAINS` (privacy hard block)
- Rejected signals with active cooldown are excluded
- The AI cannot read signals directly — it only receives a text brief summarizing preferences

**Loop integrity:** reflection → confirmed candidates → `travel_memory_signals` → memory brief → future planner brief. Loop is closed end-to-end.

---

## Cultural & Logistics Context

Cultural context (`getCulturalInsights`, `getFounderNotes`) falls back to mock when Supabase absent — mock data is labelled demo_only but is real editorial content.

Logistics context (`buildLogisticsContextForBrief`) reads from the logistics connections data layer, which similarly falls back to mock.

Both contexts are injected as text blocks into the AI brief and are optional — the planner degrades gracefully when empty.

---

## Output Validation

After OpenAI returns prose, `applyProse` maps it onto the skeleton. The final result is parsed through `generatedItinerarySchema.parse(skeleton)` (Zod). If the AI returned data that doesn't match the schema, Zod throws and the planner API returns a 502 error.

**Missing:** There is no content-safety validation of AI prose. If gpt-4o-mini returns factually incorrect, offensive, or hallucinated place descriptions, they would pass schema validation and be shown to users.

**Mitigating factors:**
- The AI brief contains only real destination names from the curated mock dataset
- The brief explicitly instructs "only write prose around the grounding skeleton, don't invent places"
- gpt-4o-mini is low-risk for content policy violations in travel context

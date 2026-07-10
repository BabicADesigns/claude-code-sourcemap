# Phase 25 — Production Data Audit

Audit date: 2026-07-07

This document classifies every data surface by its real-world data source behavior.

---

## Classification Key

| Label | Meaning |
|-------|---------|
| DATABASE | Reads from Supabase when configured; returns empty/null otherwise |
| DATABASE + MOCK_FALLBACK | Reads from Supabase when configured; falls back to mock data when not |
| MOCK_ONLY | Always reads from mock data; never queries DB |
| CLIENT_ONLY | Computed client-side; no DB interaction |
| ADMIN_WRITE_ONLY | Writes via admin client; no user-facing read from this layer |

---

## Data Surface Classification

### Editorial Content

| Surface | Source Pattern | Mock Location |
|---------|---------------|---------------|
| Destinations | DATABASE + MOCK_FALLBACK | `lib/data/destinations-mock.ts` |
| Food Finds | DATABASE + MOCK_FALLBACK | `lib/data/food-finds-mock.ts` |
| Culture Notes | DATABASE + MOCK_FALLBACK | `lib/data/culture-notes-mock.ts` |
| Secret Swaps | DATABASE + MOCK_FALLBACK | `lib/data/secret-swaps-mock.ts` |
| Community Notes | DATABASE + MOCK_FALLBACK | `lib/data/community-notes-mock.ts` |
| Cultural Insights | DATABASE + MOCK_FALLBACK | `lib/data/cultural-insights-mock.ts` |
| Founder Notes | DATABASE + MOCK_FALLBACK | `lib/data/founder-notes-mock.ts` |
| Local Phrases | DATABASE + MOCK_FALLBACK | `lib/data/local-phrases-mock.ts` |
| Local Partners | DATABASE + MOCK_FALLBACK | `lib/data/partners-mock.ts` |
| Logistics Connections | DATABASE + MOCK_FALLBACK | `lib/data/logistics-connections-mock.ts` |
| Stories | DATABASE + MOCK_FALLBACK | `lib/data/stories-mock.ts` |
| Local Heroes | DATABASE + MOCK_FALLBACK | `lib/data/local-heroes-mock.ts` |
| Premium Guides | DATABASE + MOCK_FALLBACK | (empty mock array) |
| Discovered Destinations | DATABASE + MOCK_FALLBACK | (curated list) |

### User-Owned Data

| Surface | Source Pattern | Notes |
|---------|---------------|-------|
| Saved itineraries | DATABASE | Empty when Supabase absent |
| Favorites | DATABASE | Empty when Supabase absent |
| Postcards | DATABASE | Empty when Supabase absent |
| Profile | DATABASE | Null when Supabase absent |
| Trip readiness items | DATABASE | Feature disabled when Supabase absent |
| Live trip item states | DATABASE | Feature disabled when Supabase absent |
| Trip reflections | DATABASE | Feature disabled when Supabase absent |
| Trip reflection items | DATABASE | Feature disabled when Supabase absent |
| Trip learning candidates | DATABASE | Feature disabled when Supabase absent |
| Travel memory signals | DATABASE (admin) | Feature disabled when Supabase absent |
| PDF documents | DATABASE (admin) | Feature disabled when Supabase absent |

### AI / Computed

| Surface | Source Pattern | Notes |
|---------|---------------|-------|
| Itinerary generation | OpenAI gpt-4o-mini | Falls back to deterministic skeleton only |
| AI grounding | MOCK_ONLY (destinations-mock) | Grounding reads hardcoded mock data |
| Memory brief | DATABASE (admin) | Empty when Supabase absent |
| Matchmaker result | CLIENT_ONLY | Never persisted |
| Lifecycle state | CLIENT_ONLY | Pure function of dates |
| Reflection eligibility | CLIENT_ONLY | Pure function of lifecycle + days |
| Readiness score | CLIENT_ONLY | Pure function of checklist state |

---

## Mock Data Quality

All mock data files use the pattern `active: false, demo_only: true` for records that exist only for demonstration. Examples:

- `lib/data/cultural-insights-mock.ts` — insights with `active: false, demo_only: true`
- `lib/data/logistics-connections-mock.ts` — connections with `active: false, demo_only: true`
- `lib/data/partners-mock.ts` — partners with `active: false, demo_only: true`

Mock destination data (`destinations-mock.ts`) uses `picsum.photos` placeholder images. All mock records are clearly distinguishable as demo data.

**No mock data leaks into the production query path.** When Supabase is configured, mock fallbacks are never reached for the main query path. The fallback only triggers when:
1. The Supabase client is not configured (`!isSupabaseConfigured()`), OR
2. A Supabase query returns an error (logged via `logError`, then fallback used)

---

## AI Grounding: Mock Data Still Used in Production

**Important:** `lib/ai/grounding.ts` imports `mockDestinations`, `mockDayTrips`, `mockFoodFinds`, and `mockCultureNotes` directly — it does NOT query Supabase. This means the AI Planner's grounding layer always uses the mock/hardcoded dataset, even in production.

This is by design: the grounding module is synchronous and deterministic. Supabase queries are async and would add latency to every planning request. The mock dataset serves as the curated editorial backbone.

**Implication:** Destinations added to Supabase (including promoted discovered destinations) are NOT automatically available to the planner. The planner only includes destinations hardcoded in `destinations-mock.ts`.

This is documented in `docs/ai-expansion-engine-architecture.md` as a known architectural constraint.

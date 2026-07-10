# Cultural Intelligence Engine — Phase 20

## Overview

The Cultural Intelligence Engine gives the Balkanish AI Planner a "local friend" voice for cultural context. Rather than generic travel-guide summaries, the system surfaces editorial insights — written by the team, grounded in direct observation — and makes them available at every touchpoint: the live planner result, the PDF export, and the admin editorial panel.

---

## Data Model

### CulturalInsight

The primary content unit. Each insight belongs to exactly one category and one scope level.

| Field | Type | Notes |
|---|---|---|
| `id` | string | Slug-style identifier |
| `scope` | `DESTINATION \| REGION \| COUNTRY` | Specificity level |
| `scope_slug` | string | Destination slug, region slug, or ISO country code |
| `category` | `CulturalInsightCategory` | One of 23 categories (see below) |
| `headline` | string | Short, opinionated title |
| `body` | string | The substantive insight (1–3 paragraphs) |
| `nuance` | string? | Qualifying detail, edge cases |
| `confidence` | `CulturalConfidence` | Editorial reliability tier |
| `sensitivity` | `CulturalSensitivity` | Content sensitivity flag |
| `active` | boolean | Must be `false` in development/demo fixtures |
| `demo_only` | boolean | `true` for all development fixtures |

### LocalPhrase

Language helper — contextual phrases grouped by function.

| Field | Type | Notes |
|---|---|---|
| `language_code` | string | ISO 639-1 (e.g. `hr`, `bs`) |
| `category` | `LocalPhraseCategory` | GREETING, FOOD_ORDER, etc. |
| `phrase` | string | The native-script phrase |
| `transliteration` | string? | Latin-script pronunciation guide |
| `translation` | string | English meaning |
| `applicable_country_codes` | string[] | ISO 3166-1 alpha-2 codes |

### FounderNote

A personal observation from the Balkanish founder. Displayed with special styling to convey authenticity.

**CRITICAL RULE — enforced in code and AI prompt:** The AI may surface a Founder Note from the database. The AI may **never** invent a Founder Note. Only notes authored by the founder and stored in the database may appear under this label.

| Field | Type | Notes |
|---|---|---|
| `scope` | `DESTINATION \| REGION \| COUNTRY \| GENERAL` | Applies broadly at GENERAL |
| `scope_slug` | string? | null for GENERAL scope |
| `headline` | string | Short title |
| `body` | string | The founder's personal note |
| `attribution` | string? | Optional attribution line |

### CulturalMatchResult

The resolved result passed to UI components. Contains only what's relevant for a specific itinerary.

```typescript
interface CulturalMatchResult {
  insights: CulturalInsight[];
  phrases: LocalPhrase[];
  founderNote: FounderNote | null;
  personalStories: PersonalConnectionStory[];
}
```

---

## Scope Hierarchy

Cultural insights are resolved per-category using a specificity cascade:

```
DESTINATION (most specific, always wins)
    ↓
REGION
    ↓
COUNTRY (least specific, only used if no DESTINATION or REGION match exists)
```

When two insights of different scope levels exist for the same category, the most specific one is used. This ensures that a Dubrovnik-specific coffee culture note beats a generic Croatia one.

Implementation: `lib/ai/cultural-resolver.ts` → `resolveInsightsForDestination()`.

---

## Confidence Tiers

| Tier | Meaning |
|---|---|
| `EDITORIAL_VERIFIED` | Directly observed and editorially confirmed by the Balkanish team |
| `LOCAL_CONTEXT` | Based on local knowledge, corroborated by multiple sources |
| `GENERAL_GUIDANCE` | Widely applicable regional guidance |
| `VERIFY_CURRENT_CONTEXT` | May have changed; flagged for local verification |

The `VERIFY_CURRENT_CONTEXT` tier triggers a visible warning in the UI (yellow badge + disclaimer text).

---

## Sensitivity Flags

| Flag | UI behaviour |
|---|---|
| `NONE` | No special treatment |
| `NEEDS_REVIEW` | Shown in admin with an amber badge; requires editorial sign-off before activation |
| `HISTORICALLY_SENSITIVE` | UI shows sensitivity note; AI prompt explicitly references this flag |
| `POLITICALLY_SENSITIVE` | Same as above; highest caution |

The AI system prompt contains explicit sensitivity guardrails: the model is instructed never to editorialize on politically or historically sensitive topics, and to defer to the stored cultural context verbatim.

---

## AI Integration

### Context Injection

When the planner API generates an itinerary, it:

1. Loads `getCulturalInsights()` and `getFounderNotes()` in parallel
2. Passes them as `culturalContext` to `generateItineraryVariants()`
3. Inside `buildGroundingBrief()`, the resolver computes up to 3 insights per stop and the best available Founder Note
4. The resolved text is appended to the JSON brief as `cultural_context`

This means the model sees real editorial content, not a prompt telling it to "sound local."

### System Prompt Rules

The `PROSE_SYSTEM_PROMPT` in `lib/ai/itinerary.ts` contains:

- **Cultural voice guidance**: warm, observant, specific — not generic travel-guide voice
- **Founder Note rule**: verbatim — "AI may surface a Founder Note. AI may NEVER invent a Founder Note."
- **Sensitivity guardrail**: the model must not editorialize on historically or politically sensitive topics

---

## Client-Side Resolver

`lib/ai/cultural-resolver.ts` is a pure utility module with no server dependencies. It can be imported by both server components (data layer) and client components (planner flow).

Key exports:

```typescript
resolveInsightsForDestination(allInsights, destinationSlug, regionSlug, countryCode, maxInsights?)
resolvePhrasesForCountryCodes(allPhrases, countryCodes, maxPhrases?)
resolveFounderNote(allNotes, destinationSlug, regionSlug, countryCode)
resolveCulturalMatch(allInsights, allPhrases, allNotes, allStories, destinationSlug, regionSlug, countryCode)
buildCulturalContextForBrief(insights, founderNote)
```

The planner flow (`components/planner/planner-flow.tsx`) receives `initialCulturalInsights` and `initialFounderNotes` as server-loaded props, then resolves a `CulturalMatchResult` client-side after the itinerary is generated.

---

## UI Touchpoints

### Live Planner Result (`components/culture/cultural-section.tsx`)

Rendered in `ItineraryView` after the logistics section. Shows:
1. **FounderNoteCard** — if a note matched the itinerary's destinations
2. **CulturalInsightCard** grid — resolved insights with category label, confidence badge, and optional nuance
3. **LocalPhraseChip** grid — phrases for the applicable country codes

### PDF Export (`components/planner/itinerary-pdf.tsx`)

A dedicated "Living Like a Local" page appears after the Getting Around section. Contains:
- Editorial disclaimer
- Founder Note card (if present)
- Cultural insights list with category label, headline, body, nuance

### Admin Panel (`app/admin/cultural/page.tsx`)

Editor-only view at `/admin/cultural`. Shows all cultural insights, founder notes, and local phrases with status badges. Uses the same `EDITOR_EMAILS` gate as other admin panels.

---

## Demo Fixtures

All development fixtures are `active: false, demo_only: true`. They exist to validate the schema, admin preview flow, and component rendering — they will never surface in a production itinerary.

Files:
- `lib/data/cultural-insights-mock.ts` — 7 insights across destinations, regions, countries
- `lib/data/local-phrases-mock.ts` — 8 phrases for HR/BS/SR/MK/SQ languages  
- `lib/data/founder-notes-mock.ts` — 3 notes (dubrovnik, sarajevo, general)

---

## Database Schema

Migration: `supabase/migrations/0017_phase20_cultural_intelligence.sql`

Tables:
- `cultural_insights` — core content
- `local_phrases` — language helper phrases
- `founder_notes` — founder personal observations
- `personal_connection_stories` — traveller submissions (community readiness)
- `cultural_contributions` — community insight submissions (community readiness)

RLS: public read for `active = true AND demo_only = false`; authenticated insert for contributions.

---

## Community Contribution Readiness

The schema includes `personal_connection_stories` and `cultural_contributions` tables. These power a future community layer where travellers can share their own connections to places and suggest cultural insights for editorial review. The types (`PersonalConnectionStory`, `CulturalContribution`) are defined in `lib/types.ts`; the UI is deferred until Phase 21+.

---

## i18n

Cultural intelligence strings are in the `cultureIntel` namespace (8th namespace, added Phase 20).

Files:
- `locales/en/culture-intel.json`
- `locales/de/culture-intel.json`
- `locales/it/culture-intel.json`
- `locales/hr/culture-intel.json`

Each covers: section headings, category labels, confidence labels, phrase UI labels, PDF strings, and editorial disclaimers.

# Inspiration Capture Engine — Architecture Reference

**Phase 26 — Balkanish Planner**

> "The source may disappear. The destination memory should remain."

---

## 1. What This Is

The Inspiration Capture Engine lets users save travel discoveries from any source — a web link, an Instagram reel, a screenshot, or a handwritten recommendation — and stores them as structured, place-linked memories independent of where the original content lived.

This is NOT a social media scraper. It is NOT an OCR service. It is a source-agnostic capture pipeline that:
- Accepts input from multiple sources
- Normalizes it through an adapter layer
- Attempts place resolution via local keyword matching
- Generates a Memory Spark (deterministic, no AI)
- Stores the result in a user-scoped RLS table

---

## 2. Core Pipeline

```
User Input
   │
   ▼
Source Detection
(detect-source.ts)
   │
   ├─ isUrl()          → URL or SOCIAL_URL
   ├─ detectSocialProvider() → provider regex match
   └─ plain text       → MANUAL_TEXT
   │
   ▼
Adapter Selection
(pipeline.ts — ADAPTER_REGISTRY)
   │
   ├─ socialUrlAdapter   (social URLs, no API call)
   ├─ urlAdapter         (OG metadata fetch, 5s timeout, 50KB)
   └─ manualTextAdapter  (fallback, always matches)
   │
   ▼
CaptureAdapterResult
   │
   ▼
Place Resolver
(place-resolver.ts — keyword match, no geocoding API)
   │
   ▼
PlaceResolutionResult + CaptureResolutionStatus
   │
   ▼
Memory Spark Generator
(memory-spark.ts — deterministic, no AI)
   │
   ▼
Database Insert
(lib/data/inspiration-captures.ts — server-only, RLS)
```

---

## 3. Adapter Architecture

Every adapter implements `SourceAdapter` from `lib/capture/types.ts`:

```typescript
interface SourceAdapter {
  name: string;
  version: string;
  canHandle(input: string): boolean;
  adapt(input: string): Promise<CaptureAdapterResult>;
}
```

### Registry Evaluation Order

Adapters are evaluated in order in `ADAPTER_REGISTRY`. First `canHandle()` match wins.

| Order | Adapter | Matches |
|-------|---------|---------|
| 1 | `socialUrlAdapter` | Instagram, TikTok, YouTube, Pinterest, Twitter, Facebook URLs |
| 2 | `urlAdapter` | Any other HTTP/HTTPS URL |
| 3 | `manualTextAdapter` | Everything else (fallback) |

Screenshots bypass the registry and go directly to `imageEvidenceAdapter` via `runImageCapturePipeline()`.

### Adding a New Adapter

1. Create `lib/capture/adapters/my-new-adapter.ts` implementing `SourceAdapter`
2. Add it to `ADAPTER_REGISTRY` in `lib/capture/pipeline.ts` in the correct order
3. No other code changes needed

### Adding a Live Social Provider

When a real Instagram/TikTok API key is available:
1. Create `lib/capture/adapters/providers/instagram-provider.ts`
2. Check for the API key in `socialUrlAdapter.adapt()`
3. Return enriched `CaptureAdapterResult` with real title/description
4. The pipeline and data layer require zero changes

---

## 4. Social URL Handling

The `socialUrlAdapter` is an explicit boundary: it detects the platform and records the source reference, but **makes no API calls** and **never fabricates content**.

This is by design. Social platform content requires authentication, rate-limit management, and Terms of Service compliance. Those concerns belong in a separate provider layer that can be inserted without changing the pipeline contract.

What the adapter does:
- Detects provider via regex (Instagram, TikTok, YouTube, Pinterest, Twitter, Facebook)
- Extracts post/reel/video ID for `original_source_reference` (provenance auditing only)
- Returns `extraction_available: false` with a clear user-facing message per provider
- Sets `resolution_status: NEEDS_CONFIRMATION` — the user must tell us what the place is

---

## 5. URL Adapter

The `urlAdapter` fetches publicly available Open Graph metadata from web pages:

- 5-second `AbortController` timeout (never blocks the server)
- Reads only the first 50KB of HTML (enough for `<head>` tags)
- Extracts `og:title`, `og:description`, `og:site_name`, `og:locality` via regex
- Falls back to `<title>` tag when `og:title` is absent
- Returns `extraction_available: false` on failure without fabricating data
- Reports `confidence: 0.4` when title/description found; `0.1` otherwise

**To replace with a link-preview service:** swap only `lib/capture/adapters/url-adapter.ts`. The `CaptureAdapterResult` contract is unchanged.

---

## 6. Screenshot Handling

Screenshot analysis is a future capability. The boundary is implemented and documented but the vision provider is not yet configured.

### Privacy Contract (non-negotiable)

```
Image received in server action
  → Passed to imageEvidenceAdapter.adapt(base64)
    → imageEvidenceProvider.analyze(base64)  [currently no-op]
  → Structured evidence returned (text, location hints)
  → base64 buffer DISCARDED
  → provenance records screenshot_retained: false (ALWAYS)
→ Only structured evidence stored in DB
→ Image never appears in: logs, DB, server memory, returned values
```

### Inserting a Vision Provider

1. Create `lib/capture/adapters/providers/openai-vision-provider.ts` implementing `ImageEvidenceProvider`
2. Check `process.env.OPENAI_API_KEY` in `getImageProvider()` in `image-evidence-adapter.ts`
3. Return the real provider when key is present; fall back to no-op otherwise
4. The privacy contract and pipeline are unchanged

---

## 7. Place Resolution

`resolvePlace()` in `lib/capture/place-resolver.ts` uses purely local keyword matching against a curated list of ~70 known Balkan destinations.

### Confidence Thresholds

| Score | Status | Behavior |
|-------|--------|----------|
| ≥ 0.8 | `RESOLVED_HIGH_CONFIDENCE` | Auto-resolved; no confirmation needed |
| 0.4–0.79 | `NEEDS_CONFIRMATION` | System has a suggestion; ask user |
| < 0.4 | `UNRESOLVED` | System has nothing useful; show raw input |

### Resolution Method Values

| Method | Meaning |
|--------|---------|
| `keyword_match` | Matched a known Balkan destination |
| `country_hint_only` | Detected country but no specific place |
| `no_match` | No match found |
| `no_text_available` | Adapter returned no extractable text |

### Adding Geocoding

When a geocoding API (Mapbox, Google Places) is available:
1. Create `lib/capture/resolvers/geocoding-resolver.ts`
2. Call it from `resolvePlace()` as a fallback after keyword matching
3. Propagate the `latitude`, `longitude` from the API response
4. The `PlaceResolutionResult` contract is unchanged

---

## 8. Memory Spark

`generateMemorySpark()` in `lib/capture/memory-spark.ts` produces a short, deterministic text string that reminds the user why they saved a find.

### Rules (in priority order)

1. **User note** — if the user wrote something, that wins
2. **Social + place** — "Spotted on Instagram: Mostar, BA"
3. **URL + place** — "[page title] — [place name]"
4. **URL title only** — "Spotted online: [title]"
5. **Manual text** — "You noted: [the text they typed]"
6. **Screenshot + place** — "Screenshot pointed to [place]"
7. **Place name only** — "A place you saved: [place name]"

**Non-negotiable constraints:**
- Never claims user emotion unless the user stated it
- Never invents detail not present in the capture
- Maximum 150 characters (card display)
- Observable fact only — what the source said, not what we infer

---

## 9. Database Schema

Table: `public.inspiration_captures` (migration `0022_phase26_inspiration_capture.sql`)

**Key fields:**
- `source_type` — `URL | SOCIAL_URL | SCREENSHOT | MANUAL_TEXT | SHARED_LINK`
- `source_provider` — detected provider (provenance only, not core logic)
- `original_source_reference` — post ID for auditing; never used to re-fetch
- `resolution_status` — 7-state confidence model
- `resolution_confidence` — 0.0–1.0 numeric
- `provenance` — jsonb audit record (adapter, version, extraction method, screenshot_retained)
- `capture_context` — observable context from source (what the caption/title said)
- `memory_spark` — deterministic reminder
- `confirmed_at` / `dismissed_at` — user decision timestamps

**RLS:** Users can only access their own rows. Four policies: SELECT, INSERT, UPDATE, DELETE.

---

## 10. Trip Matching Boundary

`getFindsNearDestinations(userId, countryCodes)` in `lib/data/inspiration-captures.ts` is the activation point for trip-to-finds matching.

In Phase 26 it queries the database purely by `country_code`. In future phases it will accept destination slugs and match by place_name, region, and eventually proximity radius when lat/lng is populated from geocoding.

---

## 11. User Flow Summary

```
User pastes Instagram reel URL
  ↓
socialUrlAdapter detects INSTAGRAM, extracts reel ID
  ↓
CaptureAdapterResult: extraction_available=false, confidence=0
  ↓
Place resolver: no text → UNRESOLVED
  ↓
DB insert: resolution_status=UNRESOLVED, source_type=SOCIAL_URL
  ↓
Card shows: "Saved from Instagram — add a note to remember why"
  ↓
User types note: "Stari Most at sunrise — recommended by Ana"
  ↓
addNoteToCapture() → provenance records user_correction_applied=true
  ↓
Memory Spark: 'You noted: "Stari Most at sunrise — recommended by Ana"'
```

---

## 12. Exit Readiness

| Property | Status |
|----------|--------|
| Source-agnostic domain | ✓ No provider hardcoded into domain model |
| Provider isolation | ✓ All platform logic lives in adapters only |
| Portable data model | ✓ Standard SQL with RLS; no vendor-specific types |
| Screenshot non-retention | ✓ Always false; enforced in pipeline and provenance |
| Export/delete readiness | ✓ RLS DELETE policy; deleteInspirationCapture() action |
| Low founder dependency | ✓ Adapters documented for replacement; registry pattern |
| Geocoding-ready | ✓ lat/lng columns present; resolver accepts future geocoding layer |
| Live provider-ready | ✓ ImageEvidenceProvider interface; getImageProvider() hook |
| i18n | ✓ 13th namespace `finds`, all 4 locales (EN/DE/IT/HR) |

---

## 13. Files Created

```
lib/capture/types.ts                                — adapter contracts
lib/capture/detect-source.ts                        — source/provider detection
lib/capture/adapters/url-adapter.ts                 — OG metadata fetcher
lib/capture/adapters/social-url-adapter.ts          — social URL boundary
lib/capture/adapters/manual-text-adapter.ts         — text fallback
lib/capture/adapters/image-evidence-adapter.ts      — screenshot boundary
lib/capture/place-resolver.ts                       — keyword place matching
lib/capture/memory-spark.ts                         — deterministic spark
lib/capture/pipeline.ts                             — orchestration
lib/data/inspiration-captures.ts                    — server-only data layer
lib/actions/inspiration-captures.ts                 — server actions
components/inspiration/capture-input.tsx            — 3-tab capture UI
components/inspiration/find-card.tsx                — find display card
components/inspiration/resolution-confirm.tsx       — place confirmation UX
components/inspiration/finds-empty.tsx              — empty state
app/my-balkans/finds/page.tsx                       — My Balkan Finds page
supabase/migrations/0022_phase26_inspiration_capture.sql
locales/en/finds.json, locales/de/finds.json
locales/it/finds.json, locales/hr/finds.json
docs/inspiration-capture-engine.md                  — this file
```

```
lib/types.ts                                        — Phase 26 types appended
lib/i18n/dictionaries.ts                            — finds namespace added (13th)
lib/analytics.ts                                    — FIND_* events added
app/my-balkans/page.tsx                             — My Balkan Finds dashboard section
```

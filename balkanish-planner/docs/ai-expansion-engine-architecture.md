# AI Expansion Engine Architecture — Phase 15

**Product:** Balkanish Planner
**Status:** Implemented. This document is the Phase 15 companion to `docs/ai-discovery-architecture.md` (Phase 11, which introduced Layer B itself) — it does not repeat that document's content, only extends it with what Phase 15 added: a persistent, shared discovery registry; a human moderation workflow; one-action editorial promotion; trust-tier badges that read the registry's moderation state; a learning-layer usage signal; and multilingual query parsing. Read `docs/ai-discovery-architecture.md` first for the two-layer model, the verification gate, and the `DestinationCandidate` shape — this document assumes that context.

---

## 1. What Phase 15 adds on top of Phase 11

Phase 11 made Layer B (AI discovery) produce a verified, clearly-labeled `DestinationCandidate[]` attached to a single itinerary response. That candidate was **ephemeral** — it lived only inside that one `GeneratedItinerary`, with no row anywhere a human could review it, approve it, or convert it into a real `Destination`.

Phase 15 adds the missing layer on top: a **shared registry** every suggestion flows through (`discovered_destinations`, migration `0012_phase15_ai_expansion_engine.sql`), a **human review workflow** against that registry (pending → approved/rejected), a **one-action promotion path** from registry row to real `Destination`, **trust-tier badges** derived from the registry's moderation state, a first **usage signal** for future ranking, and **multilingual discovery-query parsing**. None of this touches Layer A's deterministic grounding, and none of it weakens the rule Phase 11 established: an AI suggestion is never presented as a verified fact.

## 2. Trust model

Three concepts that look similar but answer different questions, all in play at once for any AI-suggested place:

| Axis | Type | Who/what sets it | Lifetime | Where |
|---|---|---|---|---|
| Structural plausibility | `VerificationStatus` (`unverified` \| `structurally_checked` \| `rejected`) | `lib/ai/verification.ts`, automated, deterministic | Computed once per suggestion, at generation time | Embedded in the per-itinerary `DestinationCandidate` |
| Editorial review | `ModerationStatus` (`pending` \| `approved` \| `rejected`) | A human editor, via the moderation page | Persists across every future itinerary that proposes the same place again | The shared `discovered_destinations` registry row |
| User-facing trust tier | `TrustTier` (`verified` \| `community_verified` \| `ai_suggested`) | Derived, never stored | Recomputed on every render | `deriveTrustTier()`, `lib/ai/trust.ts` |

`deriveTrustTier` (`lib/ai/trust.ts`) is the single source of truth both render paths (web `itinerary-view.tsx`, PDF `itinerary-pdf.tsx`) call, so the two surfaces can never disagree about which badge a candidate gets:

```ts
export function deriveTrustTier(
  candidate: Pick<DestinationCandidate, "source" | "moderation_status">
): TrustTier {
  if (candidate.source === "curated") return "verified";
  return candidate.moderation_status === "approved" ? "community_verified" : "ai_suggested";
}
```

- **Verified** — a real, editorially-vetted `Destination` row (Layer A). Curated destinations never flow through `DestinationCandidate` at all, so this branch is reachable today only in principle (kept for completeness and because `deriveTrustTier`'s input type is shared infrastructure, not because any current caller passes a curated candidate through it).
- **Community Verified** — an `ai_suggested` candidate whose `discovered_destinations` row an editor has approved. Not yet a curated `Destination` — still thin (no scores, no `ImageAsset`, no `why_we_love_it`) — but a human has looked at it and said "yes, this is real and worth surfacing as a stronger recommendation than a bare AI guess."
- **AI Suggested** — still `pending` (the default for every newly-registered row) or the registry lookup fell back to `pending` because the admin Supabase client isn't configured (the safe default for local/unconfigured environments — see §6).

Badge copy itself never overstates what's known: `discovery.verificationStatus.structurally_checked` reads "Structurally checked — not an editorial fact-check" in all four locales, deliberately distinct from the `community_verified` trust-tier label so a user can't conflate "an editor approved this row" with "this row was fact-checked place-by-place." Neither claims more certainty than the codebase actually has.

## 3. The shared registry — making review tractable

Every itinerary request that triggers Layer B can independently re-suggest the same real place ("Vis" gets proposed for a dozen different "quiet island" requests across different users and sessions). Without deduplication, a human reviewer would face an unbounded, repetitive queue. `discovered_destinations` (migration `0012`) solves this with a deterministic dedup key:

```ts
// lib/data/discovered-destinations.ts
export function normalizedKeyFor(candidate: Pick<DestinationCandidate, "name" | "region" | "country">): string {
  return slugify(`${candidate.name}-${candidate.region}-${candidate.country}`);
}
```

`registerDiscoveredDestination` (called from `discoverDestinationCandidates` in `lib/ai/discovery.ts`, after verification, never for a rejected suggestion) upserts on this key:

- **First time seen:** inserts a new row, `moderation_status: "pending"`, `times_suggested: 1`, `times_saved: 0`.
- **Seen again:** updates `confidence_score`/`rationale`/`matched_focus` to the latest suggestion's values (the AI's phrasing can drift request to request; the registry tracks the most recent), increments `times_suggested`, and **returns the existing `moderation_status` unchanged** — an editor's prior approve/reject decision is never silently reset just because the AI proposed the same place again. This is the load-bearing guarantee that makes "review once" actually mean once.

`registerDiscoveredDestination` never throws (mirrors `discoverDestinationCandidates`'s own contract) — a registry write failure must never prevent an itinerary from reaching the user. When the admin Supabase client isn't configured, it returns `"pending"` immediately without attempting a write, which is also the universally-safe default the UI already renders correctly.

**Module boundary note:** every export in `lib/data/discovered-destinations.ts`, including the moderation page's read-only `listDiscoveredDestinations`, uses the service-role admin client (`lib/supabase/admin.ts`), never the cookie-based `createSupabaseServerClient` (`lib/supabase/server.ts`, which imports `next/headers`). `registerDiscoveredDestination` is reachable from `lib/ai/discovery.ts` → `lib/ai/itinerary.ts` → the client component `components/planner/planner-flow.tsx` (which imports `plannerInputSchema` and other client-safe constants from `itinerary.ts`), so anything this module imports gets pulled into the browser bundle's module graph. A cookie-based client would fail the Next.js build with a "next/headers in a non-Server-Component" error; the admin client has no such constraint and is safe here regardless, since `listDiscoveredDestinations`'s underlying data is public per RLS (see above) and the page's real access control is the `EDITOR_EMAILS` gate, not row-level security.

## 4. Moderation workflow (requirement #5)

`app/admin/discoveries/page.tsx` lists every `discovered_destinations` row (newest first, via `listDiscoveredDestinations`) behind two independent gates, evaluated in order:

1. **Signed in at all** — `getCurrentUser()`; unauthenticated visitors are redirected to `/sign-in`.
2. **On the editor allow-list** — `isEditorEmail(user.email)` (`lib/auth/editors.ts`), a comma-separated `EDITOR_EMAILS` env var, lower-cased and trimmed before comparison. No database role or admin table exists anywhere in this codebase; this is deliberately the same env-var-driven feature-gating pattern used elsewhere (`isSupabaseConfigured()`, `isEmailConfigured()`) rather than introducing a new authorization primitive for one page.

A blank `EDITOR_EMAILS` means the page is reachable (it's not linked from any nav — URL-only) but every visitor sees "you're not on the editor allow-list," which is the intended degraded state, not a bug: the feature is simply unavailable until configured, same as email delivery (Phase 14) or storage uploads (Phase 13) when their env vars are unset.

`DiscoveriesPanel` (`components/admin/discoveries-panel.tsx`) renders three actions per row, each a server action gated by the same `requireEditor()` check independently (defense in depth — the page-level gate alone is not trusted to be the only check):

- **Approve** (`approveDiscoveredDestination`) — sets `moderation_status: "approved"`. Immediately flips every future render of this place to the `community_verified` trust tier, everywhere it's shown.
- **Reject** (`rejectDiscoveredDestination`) — sets `moderation_status: "rejected"`. The row stays in the registry (for audit/history — nothing is ever deleted) but a rejected place keeps surfacing as `ai_suggested` to end users if the AI proposes it again; rejection is reviewer signal, not a suppression list the AI consults before suggesting (no such feedback loop exists — see §8 for why).
- **Promote** (`promoteDiscoveredDestination`) — requirement #6, see §5.

The moderation page is deliberately **not localized** — it has no `useLocale`/`t()` calls and renders English-only labels (`STATUS_LABEL`, `STATUS_CLASS` in `discoveries-panel.tsx`). This is consistent with `docs/multilingual-architecture.md`'s position that English-only is an acceptable permanent state for non-traveler-facing surfaces; editors are internal staff, not the four-locale audience the rest of the product serves.

## 5. Editorial promotion — one action, registry row to real Destination (requirement #6)

`promoteDiscoveredDestination` (`lib/actions/discovered-destinations.ts`) is the bridge Phase 11's roadmap called "Stage 3" (`docs/ai-expansion-roadmap.md` §3) — now implemented. One server-action call:

1. Re-fetches the registry row by id; refuses if `promoted_destination_id` is already set (promotion is one-way and not re-runnable).
2. Derives a `slug`, `category` (via `FOCUS_TO_CATEGORY`, a best-effort mapping off the candidate's first `matched_focus`), and `travel_types` (via the existing `ITINERARY_FOCUS_TRAVEL_TYPES` table Phase 8 already built — no new mapping invented).
3. Inserts a full row into `public.destinations` with:
   - All six `DESTINATION_SCORES` set to a **neutral 5.0** — the same "not yet earned" default migration `0003` established, never a fabricated high score.
   - `hero_image` synthesized via `synthesizeImageAsset()` (`lib/media/normalize.ts`) using the exact `picsum.photos` + "Unassigned" placeholder pattern Phase 6/12 already use for legacy/missing photography — promotion never invents real photography credit.
   - `summary`/`description`/`why_we_love_it`/`best_season` filled with **honest placeholder copy that says what's missing** ("Promoted from an AI-suggested discovery — full editorial summary pending," etc.) rather than AI-generated prose dressed up as finished editorial content. The original AI `rationale` is preserved verbatim inside `description`, parenthetically labeled as unreviewed.
4. Updates the registry row: `moderation_status: "approved"`, `promoted_destination_id` set to the new row's id.
5. Revalidates the moderation page and `/hidden-gems` (where the new destination will appear once Layer A is regenerated against live data — see the limitation in §8).

Promotion never auto-runs — it is always a deliberate editor click, gated by the same `requireEditor()` check as approve/reject. Nothing in the AI discovery path can trigger it.

## 6. Destination candidate layer — what's new in the shape (requirement #3)

Phase 11's `DestinationCandidate` gained one field this phase:

```ts
export interface DestinationCandidate {
  name: string;
  region: string;
  country: Country;
  latitude: number;
  longitude: number;
  source: DestinationSourceType;
  confidence_score: number;
  verification_status: VerificationStatus;
  rationale: string;
  matched_focus: ItineraryFocus[];
  moderation_status: ModerationStatus;   // new — read off the shared registry, see §3
}
```

`moderation_status` is populated at the end of `discoverDestinationCandidates` (`lib/ai/discovery.ts`), after verification, by the return value of `registerDiscoveredDestination` — so a candidate embedded in a freshly-generated itinerary already reflects any prior editorial decision for that exact place, even though the candidate object itself is recreated fresh on every request (it's not the registry row; it's a snapshot of it at request time, joined by the same dedup key).

The persistent registry row itself (`DiscoveredDestination`, `lib/types.ts`) carries strictly more: a stable `id`, `normalized_key`, `times_suggested`/`times_saved` counters (§7), and `promoted_destination_id`. It is deliberately a separate type from `DestinationCandidate` — the candidate is per-itinerary, read-only, ephemeral; the registry row is the mutable, server-side record everything else is checked against.

## 7. Future learning layer (requirement #8)

Two counters on every `discovered_destinations` row are the first piece of the brief's "track saved destinations, generated trips, favorites — to improve ranking":

- **`times_suggested`** — incremented every time `registerDiscoveredDestination` upserts an existing row (i.e., every itinerary request, anonymous or signed-in, that re-proposes this place). A raw "how often does the AI think of this" signal.
- **`times_saved`** — incremented by `incrementDiscoveredDestinationSaves` (`lib/data/discovered-destinations.ts`), called from `lib/actions/itineraries.ts`'s `saveItinerary` immediately after a successful itinerary save, for every `discovered_candidate` embedded in that itinerary. A stronger signal than `times_suggested`: a user didn't just receive the suggestion, they kept it.

Additionally, migration `0012` extends `favorites.entity_type` to accept `"discovered_destination"` — so a user can favorite an AI-suggested place the same way they favorite a curated `Destination`, `FoodFind`, or `CultureNote`, giving a third, even-stronger usage signal (explicit, repeatable intent rather than a one-time save).

**What's honestly not built**: nothing yet *reads* these counters to influence ranking, confidence scoring, or which candidates get surfaced first. `verifyDestinationCandidate`'s confidence formula (`lib/ai/verification.ts`, unchanged this phase) is still purely structural — proximity to an anchor, region-name substantiveness — with no usage-weighted term. This is consistent with the brief's own framing ("Future Learning Layer") and with the codebase's "never invent/launder certainty" principle: the counters exist and are correctly incremented, so a later ranking pass has real data to read from day one, but no formula has been written yet that would need to be retroactively justified or quietly tuned. Wiring them in is a natural, scoped follow-up, not a gap hidden by a vague feature flag.

## 8. Multilingual readiness (requirement #9)

Two independent surfaces needed multilingual coverage this phase, each handled differently:

**Trust-tier and verification-status copy** — straightforward translation, following the exact Phase 9 i18n pattern (`docs/multilingual-architecture.md`) with no new mechanism: `discovery.trustTier.{verified,community_verified,ai_suggested}` (`locales/{en,de,it,hr}/planner.json`) and the equivalent `aiSuggestedCard.trustTier.*` (`locales/{en,de,it,hr}/pdf.json`). Both render paths read the key dynamically (`` t("planner", `discovery.trustTier.${trustTier}`) `` / `` t(`aiSuggestedCard.trustTier.${deriveTrustTier(candidate)}`) ``) off the same `deriveTrustTier()` call, so a tier can never be translated correctly on one surface and incorrectly on the other.

**Discovery-query parsing** (`lib/ai/discovery-query.ts`) — the harder half, since `parseDiscoveryQuery` is deliberately a deterministic, regex/keyword parser (never an LLM call — Phase 11 §5's reproducibility argument still holds: intent/anchor extraction must stay auditable and can never itself be a source of invented facts). Rather than threading a `locale` parameter through `PlannerInput` → `generateItinerary` → `DiscoveryContext` → `parseDiscoveryQuery` (a larger, riskier plumbing change than this requirement calls for), the parser is **language-agnostic**: it recognizes English, German, Italian, and Croatian keyword stems and connector phrasing simultaneously, regardless of which language the input is actually in.

- `FOCUS_KEYWORDS` (one entry per `ItineraryFocus`) lists keyword stems for all four languages together — e.g. `coast: ["beach", "beaches", ..., "strand", "küste", ..., "spiaggia", ..., "plaž", "obal", "otok"]`. Croatian and some Italian entries use short word **stems** rather than full inflected forms (`"plaž"` instead of `"plaža"`/`"plaži"`/`"plažu"`; `"romantič"` instead of `"romantičan"`) so one substring-match (`.includes()`) entry catches several declined/conjugated surface forms without building a per-language grammar engine.
- `ROUTE_BETWEEN_PATTERNS`, `ALTERNATIVE_TO_PATTERNS`, `NEAR_PATTERNS`, `IN_PLACE_PATTERNS` are each an **ordered array** of four regexes (en, de, it, hr), tried in order by a `firstMatch()` helper until one matches — e.g. `/\bfrom\s+(...)\s+to\s+(...)/i` (en: "from X to Y"), `/\bvon\s+(...)\s+nach\s+(...)/i` (de: "von X nach Y"), `/\bda\s+(...)\s+a\s+(...)/i` (it: "da X a Y"), `/\bod\s+(...)\s+do\s+(...)/i` (hr: "od X do Y"). English, German, and Italian all happen to share the literal preposition "in" before a trailing capitalized place name, so the pre-existing `IN_PLACE_PATTERNS[0]` from Phase 11 already covered three of the four languages "for free" — only Croatian (`"u X"`) needed a dedicated addition.

**Documented limitation — anchor-place extraction outside English.** Croatian declines place names by grammatical case (e.g. "Dubrovniku", "Zagreba", "Kotoru" rather than the nominative "Dubrovnik"/"Zagreb"/"Kotor"), and Italian sometimes uses its own exonyms ("Zagabria" for Zagreb, "Cattaro" for Kotor) rather than the English-style names the curated dataset and Layer B's AI both use. A regex-captured `anchor_place` from a non-English query may therefore not exactly string-match a curated destination's `name`. This is treated as an **honest, documented limitation, not a silent failure**: `resolveAnchorCoordinates()` (`lib/ai/verification.ts`, unchanged this phase) already treats "no string match" as "can't verify proximity," never as a rejection — so an unmatched anchor simply skips the proximity confidence boost in `verifyDestinationCandidate` rather than breaking discovery or producing an incorrect result. Extending this properly (a declension-aware or fuzzy place-name matcher) is future work, not something this phase silently papers over.

Manually verified against the brief's own example queries, translated into all four locales, tracing each through to the expected `DiscoveryQuery` shape:

| Query (en / de / it / hr) | Parsed intent | focus_tags | anchor_place |
|---|---|---|---|
| "quiet beach town" / "ruhige Strandstadt" / "tranquilla città balneare" / "tiha plaža grad" | `themed_search` | `coast`, `slow_living` | — |
| "best food village" / "bestes Essensdorf" / "miglior villaggio gastronomico" / "najbolje selo za hranu" | `themed_search` | `food` | — |
| "romantic island" / "romantische Insel" / "isola romantica" / "romantičan otok" | `themed_search` | `coast`, `romantic` | — |
| "road trip from Zagreb to Kotor" / "Roadtrip von Zagreb nach Kotor" / "viaggio su strada da Zagabria a Kotor" / "road trip od Zagreba do Kotora" | `route_between` | `road_trip` | "Zagreb" (en/de) / "Zagabria" (it, exonym — won't anchor-match) / "Zagreba" (hr, inflected — won't anchor-match) |

The last row is exactly the documented limitation in practice: the intent, focus tags, and `route_to_place` all parse correctly in every locale; only the Italian/Croatian `anchor_place` string fails to resolve to curated coordinates — which, per the paragraph above, degrades gracefully rather than failing the request.

## 9. The curated-data asymmetry (documented, not fixed)

Promotion (§5) writes a real row into the live Supabase `public.destinations` table. But `lib/ai/grounding.ts` — the deterministic engine that actually selects, scores, and sequences Layer A stops — reads from `lib/data/destinations-mock.ts`'s static 35-destination array, not from live Supabase data (this asymmetry predates Phase 15; it's the same mock-data foundation every prior phase has built on, documented in `docs/production-readiness.md`). A freshly-promoted destination is therefore real, persisted, and immediately visible on `/hidden-gems` and its own detail page — but the planner's grounding module won't *select* it for an itinerary until the mock dataset is regenerated from live data (or the grounding source is migrated to query Supabase directly, which is out of scope for this phase). This is an honest architectural seam, not a Phase 15 regression: it's the same gap every other "what does promotion actually unlock today" question in this codebase already has, named here so it isn't mistaken for working end-to-end itinerary inclusion when it currently isn't.

## 10. What does NOT change

Consistent with `docs/ai-discovery-architecture.md` §10 and `docs/ai-expansion-roadmap.md` §4:

- `lib/ai/grounding.ts` remains the single deterministic source of truth for curated geography, sequencing, and day-range math — untouched by this phase. Registry rows, moderation decisions, and even promoted destinations don't feed back into Layer A's selection logic (see §9's documented seam).
- `verifyDestinationCandidate`'s structural/geographic plausibility check (`lib/ai/verification.ts`) is unchanged — Phase 15 adds a persistence and review layer *after* verification, not a new or different gate.
- An AI suggestion's `confidence_score` and `verification_status` are still only ever set by deterministic code, never self-reported by the model — the new `moderation_status` field follows the identical principle: it's set by a human action (`approveDiscoveredDestination`/`rejectDiscoveredDestination`/`promoteDiscoveredDestination`) or a safe default (`"pending"`), never by the AI call itself.

## 11. Validation

- `tsc --noEmit`, `eslint .` both pass clean against the full Phase 15 changeset (trust-tier i18n + rendering, multilingual `discovery-query.ts` rewrite, this document).
- `parseDiscoveryQuery` manually verified against the brief's three literal multilingual examples plus the existing Phase 11 example set, across all four locales (§8 table).
- The moderation/promotion server actions (`lib/actions/discovered-destinations.ts`) were implemented and reviewed in an earlier Phase 15 segment; this document's §3–§6 describe that already-shipped behavior, re-verified by source read while writing this document.
- Old, pre-Phase-15 saved itineraries' embedded `discovered_candidates` lack `moderation_status` entirely (the field didn't exist when they were generated). `deriveTrustTier` only reads `moderation_status` for `ai_suggested`-sourced candidates and a missing value is `undefined`, which fails the `=== "approved"` check safely, falling back to the `ai_suggested` tier — the same graceful-degradation pattern `itinerary.discovered_candidates ?? []` already established in Phase 11 for itineraries saved before that field existed at all.

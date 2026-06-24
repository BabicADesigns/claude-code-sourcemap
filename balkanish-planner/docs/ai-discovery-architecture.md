# AI Discovery Architecture — Phase 11 (Hybrid Recommendation Engine)

**Product:** Balkanish Planner
**Status:** Implemented (Layer B as an AI-knowledge proposal layer, gated by deterministic verification). The "future data sources" section (§7) is architecture only — no OpenStreetMap/Wikivoyage/tourism-board/user-submission integration exists; no new API keys or network calls were added for them. This phase implements `docs/ai-expansion-roadmap.md`'s Stage 2 ("gated external discovery") using the AI model itself as the candidate source, rather than a licensed external dataset — §7 documents how a real external `DestinationSource` would slot into the same gate later without an architecture change.

---

## 1. What changed and why

Before Phase 11, the planner could only ever select from `lib/data/destinations-mock.ts`'s 35 curated destinations (`docs/ai-expansion-roadmap.md`'s Stage 0/1). A request the curated pool genuinely can't satisfy — a niche focus, a thin country, or a specific free-text ask like "hidden waterfalls near Mostar" — had no path to a better answer than the closest curated stop.

Phase 11 adds a second, clearly-provenanced layer without touching the trust guarantee Stage 0–1 already established: **every place name, coordinate, drive time, and score a user sees from the curated layer still has a curated source.** The new layer only ever *supplements* that, and is never allowed to look indistinguishable from it.

## 2. The two-layer model

- **Layer A — curated database.** `lib/data/destinations-mock.ts`, scored and sequenced by the deterministic `lib/ai/grounding.ts` (unchanged this phase). This remains the trust backbone and is always tried first.
- **Layer B — AI discovery.** `lib/ai/discovery.ts`'s `discoverDestinationCandidates`. Proposes additional real places the curated database doesn't cover yet, using the model's own world knowledge — then runs every proposal through a deterministic verification gate (`lib/ai/verification.ts`) before anything reaches a client.

The two layers combine inside `generateItinerary` (`lib/ai/itinerary.ts`): the curated skeleton is always built first via `buildGroundedItinerary`/`buildSkeleton`; Layer B runs concurrently with the AI prose call (`Promise.all`) and its output is attached afterward as `skeleton.discovered_candidates` — it never feeds back into stop selection, scoring, or sequencing for the curated route.

```
PlannerInput
   │
   ├─► buildGroundedItinerary (Layer A, deterministic) ──► skeleton (curated stops, day trips, scores)
   │
   ├─► fetchProse (AI prose, narrates the skeleton only)         ┐  Promise.all
   └─► discoverDestinationCandidates (Layer B, gated)            ┘
                                                │
                                                ▼
                                  skeleton.discovered_candidates
```

### Trigger conditions (requirement #1 — "the system should combine both")

Layer B runs when *either* is true:

1. **Proactively, on thin coverage.** `grounded.coverageScore < DISCOVERY_COVERAGE_THRESHOLD` (0.6). `coverageScore` already existed from Phase 8's Stage-1 diagnostic (`docs/ai-expansion-roadmap.md` §3) — Phase 11 is the first thing that actually *acts* on it, exactly as the roadmap anticipated ("It becomes the trigger condition for Stage 2").
2. **On request, via a free-text query.** Whenever `PlannerInput.discoveryQuery` is non-empty, `parseDiscoveryQuery` produces a non-null result and discovery always runs, regardless of coverage.

Both conditions are evaluated once per `generateItinerary` call (`lib/ai/itinerary.ts:415-418`) and OR'd together as `shouldDiscover`.

## 3. Destination matching beyond the curated vocabulary (requirement #2)

Hidden beaches, mountain villages, wine regions, family destinations, romantic escapes, national parks, island hopping, and food-focused trips are all expressible today through the existing `ItineraryFocus` vocabulary (`coast`, `national_park`, `wine`, `family`, `romantic`, `food`, etc. — `lib/types.ts`) that already drives Layer A's scoring (Phase 8). Layer B reuses the *same* vocabulary as its briefing context (`DiscoveryContext.focus`), so a request that resolves to `national_park` but exhausts the curated pool gets AI-suggested candidates `matched_focus`-tagged the same way — there is one shared concept space, not two parallel taxonomies. The free-text path (§5) lets a user reach these concepts in their own words ("hidden waterfalls") even when they don't map cleanly onto a single planner-style dropdown choice.

## 4. The `DestinationCandidate` model and recommendation confidence (requirements #3, #4)

`DestinationCandidate` (`lib/types.ts`) is the expansion model the brief asked for — deliberately thin compared to a curated `Destination`:

```ts
export type DestinationSourceType = "curated" | "ai_suggested";
export type VerificationStatus = "unverified" | "structurally_checked" | "rejected";

export interface DestinationCandidate {
  name: string;
  region: string;
  country: Country;
  latitude: number;
  longitude: number;
  source: DestinationSourceType;
  confidence_score: number;        // 0–1, deterministic, never AI-self-reported
  verification_status: VerificationStatus;
  rationale: string;               // one AI-authored sentence — narrative, not a verified fact
  matched_focus: ItineraryFocus[];
}
```

No `*_score` fields (the six editorial `DESTINATION_SCORES`), no `ImageAsset`, no `why_we_love_it` — those are earned through editorial review, not generated. A candidate that earns them stops being a `DestinationCandidate` and becomes a real `Destination` row (Stage 3 promotion, still doc-only — see `docs/ai-expansion-roadmap.md` §3, unchanged by this phase).

**Curated-or-AI-Suggested is always visible, never inferred by the user.** Every surface that renders a `DestinationCandidate` carries its provenance explicitly:
- Web (`components/planner/itinerary-view.tsx`): curated stops sit under a "Curated Route" badge with an explanatory hint; AI-suggested candidates render in a visually distinct section below day trips, each card tagged "AI Suggested," its confidence percentage, and its verification-status caption.
- PDF (`components/planner/itinerary-pdf.tsx`): the same "Curated Route" badge appears on the Trip Summary page; a conditional "AI-Suggested Possibilities" page (only rendered when `discovered_candidates` is non-empty) carries the same badge/confidence/verification-status per candidate.

Styling deliberately reuses neither the curated palette nor the existing day-trip (`rose`) accent — AI-suggested cards use a dashed `sage` border, so they cannot be visually confused with either a curated stop or a curated day trip at a glance.

## 5. Smart discovery — free-text query parsing (requirement #7)

`lib/ai/discovery-query.ts`'s `parseDiscoveryQuery` is **deterministic** — plain regex/keyword matching, never an LLM call — so intent extraction is reproducible and auditable, and can never itself be a source of invented facts. It produces a `DiscoveryQuery`:

```ts
export type DiscoveryIntent = "alternative_to" | "themed_search" | "route_between" | "general";

export interface DiscoveryQuery {
  raw: string;
  intent: DiscoveryIntent;
  focus_tags: ItineraryFocus[];
  anchor_place: string | null;
  route_to_place: string | null;   // only set for "route_between"
}
```

Verified against the brief's own four example queries:

| Query | Parsed intent | anchor_place | route_to_place |
|---|---|---|---|
| "quiet alternatives to Dubrovnik" | `alternative_to` | "Dubrovnik" | — |
| "best wine villages in Istria" | `themed_search` (focus_tags: `wine`) | "Istria" | — |
| "hidden waterfalls near Mostar" | `themed_search` (focus_tags: `national_park`) | "Mostar" | — |
| "road trip from Zagreb to Kotor" | `route_between` (focus_tags: `road_trip`) | "Zagreb" | "Kotor" |

`anchor_place` (when resolvable against the curated dataset via `resolveAnchorCoordinates`) becomes the proximity anchor the verification layer checks AI suggestions against (§6). `route_between` queries deliberately have no single anchor — `resolveDiscoveryAnchor` (`discovery.ts`) returns `null` for them, since a corridor between two places isn't a "near X" check the current verification model expresses; this is intentionally left unconstrained rather than approximated, an explicit limitation, not a silent gap (see §8).

## 6. Verification layer (requirement #5)

**Hard rule the whole layer is built around: never present a fabricated fact as a verified fact.** `lib/ai/verification.ts`'s `verifyDestinationCandidate` is the only place a `DestinationCandidate`'s `confidence_score` and `verification_status` get set — the AI's response schema (`discoverySuggestionSchema`, `lib/ai/discovery.ts`) has no field for either, so there is no code path where the model could self-report confidence even if the prompt were ignored.

The check is **structural/geographic plausibility, not an editorial fact-check**, and the status name says so explicitly (`"structurally_checked"`, never "verified" or "confirmed") — copy surfacing it to a user repeats that distinction (`discovery.verificationStatus.structurally_checked` in all four locales: "Structurally checked — not an editorial fact-check" / "Strukturell geprüft — keine redaktionelle Faktenprüfung" / "Controllato strutturalmente — non è una verifica editoriale" / "Strukturno provjereno — nije urednička provjera činjenica").

A suggestion is **rejected outright** (and never reaches a client — `discoverDestinationCandidates` filters rejected candidates before returning) when any of:
- `country` isn't one of the five Balkan countries the planner covers.
- The name looks like a placeholder (empty, "unknown", "tbd", etc.) or `region` is blank.
- The name exactly matches an existing curated destination (Layer B must never propose a re-skinned duplicate of Layer A).
- Coordinates are missing/non-finite, or fall outside that country's rough lat/lng bounding box (`COUNTRY_BOUNDS` — deliberately loose, a plausibility check, not a precise border lookup).
- An anchor place was given (§5) and the suggestion is more than `MAX_ANCHOR_DISTANCE_KM` (120km) from it — a "waterfall near Mostar" 300km away fails the request's own premise.

A suggestion that survives all of the above gets `status: "structurally_checked"` and a confidence score built entirely from the checks themselves: `0.6` base, `+` a proximity bonus (closer to the anchor scores higher, only when an anchor exists), `+0.1` if the region name is substantive, capped at `0.95` (never `1.0` — structural checking alone never earns full confidence, by design).

## 7. Future data sources — architecture only (requirement #8)

No integration work was done for any of these; the goal here is to confirm the existing seam (`DiscoveryContext` in, `DestinationCandidate[]` out, gated by `verifyDestinationCandidate`) doesn't need to change shape to accommodate them later.

```ts
// Future shape — not implemented. Mirrors docs/ai-expansion-roadmap.md §3's DestinationSource.
interface ExternalDestinationSource {
  id: "openstreetmap" | "wikivoyage" | "tourism_board" | "user_submission";
  search(criteria: {
    focus: ItineraryFocus;
    country: Country | null;
    query: DiscoveryQuery | null;
  }): Promise<UnverifiedSuggestion[]>;   // same shape lib/ai/verification.ts already accepts
}
```

- **OpenStreetMap** (via Overpass API or Nominatim) — POI/place search by tag (`tourism=*`, `natural=waterfall`, etc.) and bounding box. Would slot in as a `search()` that queries by the same `country`/`anchor_place` the AI prompt already receives — no change to `DiscoveryContext`'s shape.
- **Wikivoyage** — full-text/category search for travel-guide pages matching a region or theme; strong fit for `themed_search` queries (§5) since Wikivoyage's own taxonomy (e.g. "Istria/Wine") maps loosely onto `ItineraryFocus`.
- **Official tourism boards** (e.g. Croatian National Tourist Board's open data, where available) — the highest-trust external source, since it's already an editorial authority rather than crowd-sourced or AI-derived; a board-sourced suggestion could reasonably skip straight to a higher initial confidence band than an AI-knowledge suggestion, an asymmetry the architecture supports (confidence computation in `verifyDestinationCandidate` is already source-agnostic input, not hardcoded to the AI path) without being implemented here.
- **User submissions** — a moderated queue (a new Supabase table, not built this phase) feeding `search()` with previously-submitted places pending review; would reuse the *same* `verifyDestinationCandidate` gate as a first-pass automated check before a human moderator ever sees it, rather than inventing a second verification path.

**Why none of these are wired up:** each requires a product decision this phase isn't scoped to make (API key acquisition, rate limits/cost, a moderation UI for user submissions) and the brief is explicit that Phase 11 is "architecture only" for this requirement. Whichever is picked later, it plugs into `discoverDestinationCandidates`'s existing `for (const suggestion of ...) verifyDestinationCandidate(suggestion, anchor)` loop as an additional candidate stream merged before that loop runs — the AI-knowledge path (this phase) and an external-API path are structurally the same shape (`UnverifiedSuggestion` in, gated `DestinationCandidate` out), so adding one doesn't require removing or redesigning the other.

## 8. Planner intelligence reused, not duplicated (requirement #6)

Phase 11 deliberately adds no new "understand the user" logic. Pace, travel style, interests, and the family/couple/solo + food/nature/culture priority signals the brief asks for are already fully modeled by Phase 8's `deriveItineraryFocus` + five-factor `scoreDestination` (`docs/planner-intelligence.md` §2) for Layer A. Layer B receives the *same* resolved signals as its briefing context (`DiscoveryContext.plannerStyle`, `.focus`) rather than re-deriving them from raw input — one signal-interpretation path feeds both layers, so they can never disagree about what the user asked for.

## 9. Multilingual compatibility (requirement #9)

All net-new user-facing copy introduced by this phase is translated across all four supported locales (EN/DE/IT/HR), following the existing Phase 9 i18n architecture (`docs/multilingual-architecture.md`) exactly — no new pattern was introduced:

- `locales/{en,de,it,hr}/planner.json` — `discoveryStep` (the free-text search field's label/description/placeholder), `reviewStep.discoveryLabel`, and a `discovery` block (curated badge, AI-suggested section heading/description, badge labels, confidence label, and all three `verificationStatus` strings).
- `locales/{en,de,it,hr}/pdf.json` — the equivalent `sections.aiSuggested`, `aiSuggestedCard`, and `curated` keys for the PDF export's matching page.

**What stays English-only, deliberately:** the AI's own output — a candidate's `rationale` and `region`/`name` — is generated in whatever language the underlying prompt and model produce (currently English-only, the same limitation Phase 9's documentation already noted for the AI prose layer in `docs/multilingual-architecture.md` §4, "AI-generated narrative compatibility (future)"). `parseDiscoveryQuery`'s regex matching (§5) is also English-keyword-only today. Both are pre-existing, documented limitations of the AI layer generally, not regressions introduced by this phase — extending either to other locales is future-ready in the sense that the *plumbing* (locale flows end-to-end through `PlannerInput`/`GeneratedItinerary` already) doesn't need to change, only the prompt/keyword tables would need locale variants, following the exact two-step pattern §4 of that document already lays out for prose.

## 10. What does NOT change

Consistent with `docs/ai-expansion-roadmap.md` §4:

- `lib/ai/grounding.ts` stays the single source of truth for curated geography, sequencing, and day-range math — completely untouched by this phase. Layer B candidates never enter `scoreDestination`, `sequenceGeographically`, or any curated-stop selection.
- The AI prose layer's existing sandbox is unchanged — it still only narrates around the grounded skeleton; Layer B's AI call is a separate, independently-gated path with its own schema and its own verification step, not an extension of the prose call's trust boundary.
- `is_featured`, the six `DESTINATION_SCORES`, and `ImageAsset` metadata remain earned, editorial properties that no AI call (prose or discovery) can set on anything that reaches a user.

## 11. Validation

- `tsc --noEmit`, `eslint .`, and `next build` all pass clean (see the Phase 11 PR section for the exact run).
- `parseDiscoveryQuery` manually verified against all four of the brief's literal example queries (§5 table).
- `verifyDestinationCandidate` manually verified to reject: a non-Balkan country, a placeholder name, an exact curated-name duplicate, out-of-bounds coordinates, and an anchor distance over 120km — and to accept a plausible candidate with a confidence score strictly below 0.95.
- Old, pre-Phase-11 saved itineraries (`SavedItinerary.itinerary_json` rows written before this phase) lack `discovered_candidates` entirely; both render paths (`itinerary-view.tsx`, `itinerary-pdf.tsx`) read it as `itinerary.discovered_candidates ?? []`, so reopening one of those trips renders exactly as it did before this phase, with no AI-suggested section.

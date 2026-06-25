# AI Expansion Roadmap — From Curated Database to Hybrid Travel Advisor

**Product:** Balkanish Planner
**Status:** Stages 0–1 were already shipped (Phase 8). **Stage 2 ("gated external discovery") is now implemented as of Phase 11** — see `docs/ai-discovery-architecture.md` for the full architecture, the `DestinationCandidate` model, and the verification strategy. Phase 11 implements Stage 2 using the AI model's own knowledge as the candidate source, gated by deterministic verification, rather than a licensed external dataset; `docs/ai-discovery-architecture.md` §7 documents how a real external `DestinationSource` (OpenStreetMap, Wikivoyage, tourism boards, user submissions) would plug into the same gate later. Stages 3 and 4 below remain technical recommendation only — nothing in those two sections is implemented.

---

## 1. Where the platform is today

The planner is **curated-data-first, AI-prose-second**, and that split is already enforced in code, not just convention:

- `lib/data/destinations-mock.ts` is a fixed, hand-authored set of 35 destinations across 5 countries. There is no path — today — for a destination to enter an itinerary that isn't in this list.
- `lib/ai/grounding.ts` is explicitly commented as "deterministic, data-grounded planning logic — no AI calls, no invented places, no invented driving times." It selects, scores, geographically sequences, and assigns day ranges to destinations using real lat/lng (haversine distance), real scores, and real day-trip records — all before any AI call happens.
- `lib/ai/itinerary.ts` builds a factual `GeneratedItinerary` skeleton from that grounded output first (`buildSkeleton`), then — only if `OPENAI_API_KEY` is configured — asks the model to *narrate* around that fixed skeleton (`// --- AI prose layer — narrative only, sandboxed to the grounded skeleton's facts ---`). If OpenAI isn't configured, the skeleton itself is the full output. The product works, and tells the truth, with zero AI calls.

This is a deliberate trust architecture: every place name, coordinate, drive time, and score a user sees has a curated source. The AI's job is sentence construction, never fact invention. Any expansion plan has to preserve this property — it's the platform's core credibility claim ("the places locals actually go," not "the places a language model guessed at").

## 2. The constraint that shapes everything below

A travel product that occasionally recommends a restaurant that closed in 2019, or a "hidden cove" that doesn't exist, loses the exact trust it's selling. So the question this roadmap answers is not "how do we let the AI pick any destination" — it's:

**How do we grow the candidate pool past 35 fixed destinations without weakening the guarantee that everything recommended is real and vetted?**

The answer is a staged hybrid model where curated data stays the trust backbone, and every new source is additive, clearly provenanced, and gated before it can influence what gets shown.

## 3. Proposed stages

### Stage 0 — Today (baseline, already shipped)
Fixed curated list. Deterministic scoring/sequencing in `lib/ai/grounding.ts`. AI narrates only. No changes needed; this stage is the floor every later stage must not regress below.

### Stage 1 — Coverage-aware curated selection
Before adding any new data source, make the *existing* selection logic self-aware of when it's stretched thin. `selectDestinations` in `grounding.ts` already has a `deriveItineraryFocus` fallback to `"mixed"` when interests are diffuse — that's effectively a "low confidence" signal that exists today but isn't surfaced anywhere.

**Recommendation:** introduce a lightweight `coverageScore` (e.g. pool size for the resolved focus, or score variance among the top candidates) computed alongside `buildGroundedItinerary`'s output. Low coverage doesn't change the result yet — it's purely diagnostic. It becomes the trigger condition for Stage 2: only show/seek external candidates when curated coverage is genuinely thin (e.g. a request for a 14-day trip with a niche focus that the current 35-destination pool can't fill without repeating regions).

This stage is pure software, no new data, no new APIs — a natural next PR, independent of everything after it.

### Stage 2 — Gated external discovery (implemented in Phase 11, using the AI model as the source)
**Implemented as of Phase 11 — see `docs/ai-discovery-architecture.md`.** What shipped: `lib/ai/discovery.ts`'s `discoverDestinationCandidates`, gated by `lib/ai/verification.ts`'s `verifyDestinationCandidate`, triggered by Stage 1's `coverageScore` falling below a threshold or by an explicit free-text discovery query. The abstraction below was the original, provider-agnostic interface this section proposed before implementation; it's left as-written for the historical record and because §7 of `docs/ai-discovery-architecture.md` documents exactly this kind of pluggable `DestinationSource` for OpenStreetMap/Wikivoyage/tourism-board/user-submission integration, none of which is built yet:

```ts
// Future shape — not implemented:
interface DestinationCandidate {
  name: string;
  region: string;
  country: Country;
  latitude: number;
  longitude: number;
  provenance: "curated" | "external_discovery";
  // Deliberately thin: no score fields, no hero_image, no "why_we_love_it" —
  // those are earned through the editorial pipeline in Stage 3, not invented.
}

interface DestinationSource {
  search(criteria: { focus: ItineraryFocus; region?: Country }): Promise<DestinationCandidate[]>;
}
```

- `selectDestinations` would only call a `DestinationSource` when Stage 1's `coverageScore` says the curated pool is thin — curated data still wins by default whenever it's sufficient.
- An `external_discovery` candidate is **never** treated as equivalent to a curated `Destination`. It has no `score` fields (so it can't be ranked by `scoreDestinationForFocus`, which is intentional — it shouldn't compete on a scoring system it didn't earn), no `ImageAsset`, no `why_we_love_it`. It can be offered as a clearly-labeled, lower-confidence suggestion ("Worth checking out — not yet reviewed by our editors") but must never silently appear indistinguishable from a vetted Hidden Gem.
- Candidate sources to evaluate later (no selection made here, this is a planning doc): a places/POI API, a licensed travel dataset, or a moderated user-submission queue. Any of them slot behind the same `DestinationSource` interface, so the choice of provider is decoupled from the architecture decision.

### Stage 3 — Editorial promotion pipeline (the bridge from "discovered" to "curated")
This is the piece that keeps Stage 2 from eroding trust over time: an `external_discovery` candidate that proves out (repeatedly selected, positively engaged with, or manually reviewed) gets *promoted* into the real curated dataset — gaining real `DESTINATION_SCORES`, a real `ImageAsset` once photography exists, a real `why_we_love_it`, and a real database row. Promotion is a one-way, editorially-gated upgrade; nothing is ever auto-promoted purely by an AI's say-so. Mechanically, this is the same shape as the photo-credit/ImageAsset pattern from Phase 6: the system can model a "not yet fully described" thing (a placeholder image; a thinly-described candidate destination) — what matters is being honest about which is which until the real content lands.

### Stage 4 — Dynamic, request-shaped recommendation
Only once Stage 2/3 exist does it make sense to let the AI layer *propose* a destination directly, rather than only narrate around ones the grounding module already picked. Even then, the same rule from Stage 0 holds: the AI proposes a name and a rationale; it is never the source of the coordinates, drive time, or score that flow into the map/PDF. Those still have to resolve through a `DestinationSource` lookup before they're trusted facts. This stage is the one explicitly named in the Phase 6 brief ("not limited to a fixed list of destinations") and is intentionally last — it's the part with the most trust risk, so it's the part that requires the most scaffolding (Stages 1–3) underneath it first.

## 4. What does NOT change, at any stage

- The deterministic grounding module (`lib/ai/grounding.ts`) stays the single source of truth for geography, sequencing, and day-range math. New data sources feed it candidates; they don't replace its logic.
- The AI prose layer's existing sandbox — "only allowed to add prose around" a fixed factual skeleton — extends to cover discovery too: an LLM can rank or describe candidates, but a fact (coordinate, drive time, score) only becomes real once it has a deterministic, attributable source.
- `is_featured`, the six `DESTINATION_SCORES`, and `ImageAsset` metadata remain earned, editorial properties — never something an external API or AI call can set directly on a destination that reaches a user.

## 5. Sequencing recommendation

Stage 1 is low-risk and could be picked up next with no new dependencies. Stages 2–4 each require a product decision this document doesn't make (which external data source, what the promotion review process looks like, what UI distinguishes "curated" from "discovered") — they're sequenced here so that decision can be made later without the architecture needing to be revisited.

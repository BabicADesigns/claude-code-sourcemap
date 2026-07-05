# Local Trust & Partner Recommendation System

_Phase 18 — Balkanish Planner_

---

## Philosophy

> "The Balkanish Travel Planner sells nothing. It recommends."

Every partner in this system was placed here by the editorial team. There are no pay-to-appear positions. Commercial relationships are stored for legal disclosure purposes and are never read by the recommendation engine. A Founder's Pick with a paid partnership is disclosed — but the badge is still genuine, earned before any commercial relationship existed.

---

## Trust Taxonomy

Three editorial trust levels, each with a specific meaning:

| Level | Key | Meaning |
|---|---|---|
| Founder's Pick | `founder_pick` | Personal recommendation from the Balkanish founder. Often includes a direct quote or note. |
| Verified Local | `verified_local` | Manually reviewed and personally verified by the editorial team. |
| Community Favourite | `community_favourite` | Recommended by the Balkanish travelling community. Evidence-required; never fabricated. |

**Trust badge ≠ commercial disclosure.** These are separate dimensions. A Verified Local partner may have an affiliate link; a Founder's Pick may have no commercial relationship at all.

---

## Commercial Disclosure Architecture

Five possible commercial relationships:

| Value | Display |
|---|---|
| `none` | Nothing shown |
| `affiliate` | "We may earn a small commission if you book through this link, at no extra cost to you." |
| `paid_partnership` | "Paid partnership." |
| `founder_connection` | "Note: the Balkanish founder has a personal connection to this project." |
| `owned_or_affiliated_project` | "Disclosure: this is a project connected to the Balkanish team…" |

Disclosure text is always visible when `commercial_relationship !== "none"` — in the web card, in the printed page, and in the PDF export. This is a non-negotiable design constraint.

The `commercial_relationship` field is **never read by the matching or ranking algorithm**. The `priority` field (0–100 editorial weight) may be influenced by editorial judgment, but not by whether a relationship exists.

---

## Data Model

Core type: `LocalPartner` (see `lib/types.ts`, Phase 18 block).

Key fields:

- `trust_level: PartnerTrustLevel` — editorial classification
- `commercial_relationship: CommercialRelationship` — disclosure only
- `disclosure_text?: string` — optional custom override for the localized default
- `priority: number` — 0–100 editorial weight, applied as a multiplier in scoring
- `active: boolean` — only `active=true AND demo_only=false` partners are surfaced publicly
- `demo_only?: boolean` — development fixtures; never surface in production

---

## Contextual Matching Algorithm

File: `lib/ai/partner-match.ts`

### Hard gate

If the partner's `country` is set and does not match the trip's country, the partner is excluded entirely (score = 0). Geography is the only hard gate; all other signals are additive.

### Scoring (additive)

| Signal | Weight |
|---|---|
| Base score | +0.30 |
| Destination slug match | +0.25 |
| Region match | +0.15 |
| Traveler interest overlap | up to +0.20 |
| Travel mood match | +0.10 |
| Cuisine preference overlap | up to +0.05 |
| Mobility option overlap | up to +0.05 |
| Trip pace match | +0.05 |
| Season (best_months) | +0.05 |
| Family suitability | +0.05 |

### Editorial priority multiplier

`final_score = raw_score × (0.5 + priority / 100)`

A partner with `priority=100` scores up to 1.5× its raw signal score. A partner with `priority=0` scores 0.5×. Commercial relationship is not part of this calculation.

### Density constraints (defaults)

```typescript
MAX_PER_ITINERARY = 2
MIN_RELEVANCE_SCORE = 0.4
FOUNDER_PICK_CAP = 1
```

Community Favourite partners are excluded from auto-insertion by default (`allowCommunityFavourite: false`). They can be surfaced by passing `{ allowCommunityFavourite: true }` to `matchPartnersToContext()`, but only when the editorial team has genuine evidence.

---

## Demo Fixtures

Ranger Hero (`lib/data/partners-mock.ts`) is a demo fixture for development and design work. It is defined with `active: false, demo_only: true`. It will never surface in the public planner, never appear in a generated itinerary, and never be included in a PDF export.

When real partners are onboarded, they are added with `active: true, demo_only: false` — either directly to the `local_partners` Supabase table or to the mock file for development.

---

## Integration Points

| Layer | File | What changed |
|---|---|---|
| Types | `lib/types.ts` | `PartnerTrustLevel`, `CommercialRelationship`, `PartnerCategory`, `LocalPartner`, `PartnerMatchResult` |
| Database | `supabase/migrations/0015_phase18_local_partners.sql` | `local_partners` table with RLS, GIN indexes |
| Data layer | `lib/data/partners.ts` | `getPartners()` (public), `getAllPartnersForAdmin()`, `getPartnerBySlug()` |
| Mock data | `lib/data/partners-mock.ts` | Ranger Hero demo fixture (`active: false, demo_only: true`) |
| Matching | `lib/ai/partner-match.ts` | Contextual scoring algorithm |
| i18n | `locales/*/partners.json` | Partners namespace for all 4 locales |
| i18n | `lib/i18n/dictionaries.ts` | `partners` added to `Dictionary` |
| i18n | `locales/*/pdf.json` | `sections.localRecommendations`, `partnerCard.*` keys |
| Components | `components/partners/trust-badge.tsx` | Warm editorial trust level badge |
| Components | `components/partners/commercial-disclosure.tsx` | Disclosure text (hidden when `none`) |
| Components | `components/partners/partner-card.tsx` | Full recommendation card with CTA |
| Planner UI | `components/planner/itinerary-view.tsx` | Local Recommendations section after AI suggestions |
| Planner flow | `components/planner/planner-flow.tsx` | Partner matching on itinerary generation |
| PDF | `components/planner/itinerary-pdf.tsx` | Optional Local Recommendations page |
| PDF generator | `lib/pdf/generate-itinerary-pdf.tsx` | `matchedPartners` param threaded through |
| Planner page | `app/planner/page.tsx` | `getPartners()` loaded server-side |
| Admin | `components/admin/partners-panel.tsx` | Read-only admin overview |
| Admin | `app/admin/partners/page.tsx` | Admin route (editor-gated) |

---

## Security & Integrity Constraints

1. **No fabricated partners.** Every entry in `local_partners` must correspond to a real, independently reachable business or project.

2. **No fabricated community consensus.** Community Favourite is never auto-assigned. Evidence is required before the tag is applied.

3. **Commercial relationship never influences ranking.** The `computePartnerRelevance()` function deliberately never reads `commercial_relationship`.

4. **Demo fixtures never surface publicly.** The `getPartners()` function filters `active=true AND demo_only=false`. The Supabase RLS policy mirrors this constraint at the database level.

5. **Ranger Hero stays separate.** Ranger Hero is a separate project with a personal connection to the founder. If it ever becomes a real partner in the Balkanish system, it is added as a proper `LocalPartner` record — never hardcoded into the engine or treated as a default example.

---

## Admin Access

Route: `/admin/partners`

Gated by `EDITOR_EMAILS` environment variable, same as discovery moderation. Shows all partners including inactive and demo-only. Read-only in this phase — editorial updates go through Supabase directly or (future) a CMS write flow.

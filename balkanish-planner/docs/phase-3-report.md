# Phase 3 Implementation Report — Visual Identity + Editorial Experience

Scope: branding, copy, and visual identity only. No new pages, auth, payments,
or database functionality. The Supabase migration `0003_destination_scores.sql`
remains unapplied; every page still reads from the mock-data layer.

PR: [#44](https://github.com/BabicADesigns/claude-code-sourcemap/pull/44) →
`claude/balkanish-editorial-phase-3` → `main`.

## What changed

### 1. Signature Balkanish motifs (used sparingly, by design)
Four new components in `components/brand/editorial.tsx`:

- `LocationTag` — pin + place name, used on hero images only (not on grid thumbnails, to avoid repetition).
- `MapDetailAccent` — a faint dotted route line with a short label (e.g. "Dalmatian Islands · Croatia"). Deliberately takes a *label*, not fabricated coordinates — inventing precise lat/long for fictional precision would read as dishonest.
- `GuidebookReference` — a vintage-clipping-style quoted line between hairlines, used once per destination page.
- `Postmark` — a circular cancellation mark, paired with the existing `TravelStamp` on the postcard editor.

### 2. Destination pages — three new data-driven callouts
`BestSlowMoment`, `WorthWakingUpFor`, `SkipThisDoThis` in `components/brand/content-blocks.tsx`. Each derives its copy from a destination's *existing* score fields (`sunset_score`, `slow_living_score`, `crowd_score`, `food_score`) and the matching Secret Swap entry if one exists — no new data model, no hardcoded per-destination special-casing.

### 3. Food Finds — ritual and anecdote depth
Added `ritual` and `local_anecdote` fields to `lib/types.ts` and populated all 6 mock dishes in `lib/data/food-finds.ts`. Detail pages now render a "The Ritual" section and a `LocalWisdom` callout when present.

### 4. Culture Notes — magazine reading rhythm
Masthead row (category · region · read time), tighter measure (`max-w-2xl`), heavier body leading (`1.85`), closing handwritten note under the wave divider.

### 5. Homepage — postcard interlude
A new tactile section between Culture Notes and Secret Swap: a tilted, stamped postcard card paired with a `GuidebookReference` line, breaking up the repeating card-grid rhythm with a different visual register.

### 6. Postcard editor — more collectible
Added `Postmark` next to the existing `TravelStamp`, slight permanent tilt with a hover-to-straighten interaction, heavier drop shadow and an inset ring to read as a physical object rather than a UI card.

### 7. `docs/image-direction.md`
Added an AI Planner section, a consolidated imagery-vocabulary list, and fixed duplicate section numbering left over from Phase 2.

## Mobile-first audit (390 / 430 / 768px)

Captured 44 full-page screenshots (11 pages × 4 viewports) and reviewed each one. Two real issues found and fixed; nothing else broke at any tested width.

**Bug: horizontal page overflow on Secret Swap.** The comparison table's `min-w-[480px]` was inside a `lg:col-span-2` grid item that's a sibling of two image divs in the same single-column mobile grid. CSS Grid sizes a shared column track to the *widest* min-content contribution among every item in it — so the table's 480px minimum forced the whole grid (and the page) to 506px wide on a 390px viewport. Fixed by adding `min-w-0` to that grid item, which lets its own `overflow-x-auto` wrapper do its job instead of leaking width upstream. Verified with a scripted `scrollWidth` check across all 11 pages × 3 narrow viewports — confirmed zero overflow anywhere, including the fix.

**Consistency/resilience gap: Secret Swap images skipped the editorial photo system.** They used a bare `<Image fill>` in a plain `<div>` instead of the shared `EditorialImage` wrapper that every other page uses. The practical effect: when an image fails to load, `EditorialImage`'s grain + color-grade overlay (CSS pseudo-elements, independent of whether the `<img>` itself loads) still paints, so the box reads as an intentional muted photograph. The bare divs had no such fallback, so a failed load showed a transparent box with the browser's default broken-image icon — which is also why this surfaced clearly in this sandbox, where the picsum.photos image host has no network egress. Fixed by switching both images to `EditorialImage`, which also brings Secret Swap into line with the rest of the site's photography treatment (closing a gap in item 1 of the original Phase 3 brief — Secret Swap had never gotten the editorial image system applied).

No other layout issues found: the `BestSlowMoment`/`WorthWakingUpFor` grid collapses to a single column correctly below `lg`, `SkipThisDoThis`'s strikethrough text wraps cleanly, the new motif components don't collide with other UI at narrow widths, and the homepage's postcard interlude stacks correctly below the `lg` breakpoint.

## Brand consistency review

Reviewed desktop, tablet, and mobile renders across every page. Typography scale (`font-display` headings, `font-serif` body, `font-sans` uppercase-tracked labels, `font-script` italic accents), the sage/cream/rose palette, section spacing, and CTA styling all hold consistently site-wide. The one inconsistency found (Secret Swap's photography treatment) is fixed above.

## Recommendations for a future pass

- **Scroll affordance on the Secret Swap comparison table.** It now scrolls horizontally within its own box on narrow viewports (correct, intentional), but there's no visual hint (e.g. a fade-edge gradient or "swipe to compare →" label) that more columns exist off-screen.
- **Real photography.** Every image on the site is currently a `picsum.photos` placeholder. The editorial grain/gradient treatment carries a lot of weight standing in for a real photo system — swapping in actual location photography per `docs/image-direction.md`'s vocabulary list would be the highest-leverage next step toward "this feels like BabicADesigns."
- **`LocationTag` on a second context.** Currently only used on hero images; could extend (carefully, still sparingly) to the Secret Swap "famous spot" / "try this instead" pair now that those images use `EditorialImage`, since that's a natural second home for the motif.

## Validation

- `npx tsc --noEmit` — clean
- `npm run build` — all 36 routes generate successfully
- Scripted `scrollWidth` audit — 11 pages × 390/430/768px, zero overflow after fix
- Supabase migration `0003_destination_scores.sql` — confirmed unapplied; no DB-dependent functionality introduced

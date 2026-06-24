# Media Library & Editorial Content System — Architecture

**Product:** Balkanish Planner
**Version:** 1.0 — Phase 12, Real Media Library & Editorial Content System
**Relationship to v1/v2:** `docs/image-direction.md` is the mood/styling brief (light, color grade, composition). `docs/image-direction-v2.md` is the Phase 6 system architecture that introduced `ImageAsset`/`ImageCredit`, `PhotoCredit`, and the PDF photography slots — for `Destination` only. This document is Phase 12: it widens that same `ImageAsset` pattern to `FoodFind` and `CultureNote`, adds the metadata fields editorial workflows actually need (title, location, category, aspect ratio, multilingual captions), and turns "every destination supports a hero + gallery" into "every content type renders editorial sections that combine images and text on purpose." Read v1 for *how a photo should look*. Read v2 for *the credit/caption pattern's origin*. Read this for *the full metadata model, the five-section editorial workflow, and where the system is still deliberately unfinished*.

---

## 1. Media Architecture — Categories and Slots

Every image in the system is one `ImageAsset`, tagged with a `MediaCategory` (`lib/types.ts`):

```ts
export type MediaCategory = "hero" | "gallery" | "food" | "culture" | "map_illustration" | "pdf";
```

| Category | Used by | Notes |
|---|---|---|
| `hero` | `Destination.hero_image`, list-page `FeatureLead` | One scene-setting image per page/feature |
| `gallery` | `Destination.gallery_images` | Multiple supporting images, mixed aspect ratios |
| `food` | `FoodFind.hero_image` | New this phase — see §3 |
| `culture` | `CultureNote.hero_image` | New this phase — see §3 |
| `map_illustration` | Reserved — no current renderer | The PDF/web map today is a generated SVG (`lib/maps/`), not a photo; this category exists so a future hand-illustrated or photographed map graphic has a home without inventing a new field |
| `pdf` | Reserved — see §6 | Tags an asset as cleared/sized for the PDF pipeline once that pipeline renders images at all |

`category` is optional on `ImageAsset` and is backfilled by `lib/media/normalize.ts` (§2) so existing call sites never have to set it by hand — a destination's hero is always normalized to `"hero"`, a gallery image to `"gallery"`, and so on, derived from *where* the asset is attached, not guessed from its content.

This is additive over v2's four-category visual system (Hero / Feature Lead / Gallery / Card), which still describes layout treatment. `MediaCategory` is the orthogonal, structural axis: it answers "what kind of content is this" so non-visual consumers (the PDF pipeline, a future image-tagging pass) can filter without re-deriving the answer from a component name.

## 2. Image Metadata Model

```ts
export interface ImageCredit {
  photographer: string;
  source: string;
  license?: string;
  copyright?: string;
}

export type LocalizedText = Partial<Record<Locale, string>> & { en: string };

export interface ImageAsset {
  url: string;
  alt: string;
  caption?: string | LocalizedText;
  credit: ImageCredit;
  title?: string;
  location?: string;
  aspect_ratio?: AspectRatio;
  category?: MediaCategory;
}
```

What's new versus v2's `ImageAsset { url, alt, caption?: string, credit }`:

- **`credit.copyright`** — a rights/usage line distinct from `license` (e.g. `"© Ivana Babić"` for a real-looking credit, or the honest placeholder string for mock data — see "Placeholder honesty" below). v2 had no field for this; credits could describe *who* but not *whether the rights are settled*.
- **`title`** — a short editorial label for the image itself (e.g. for a gallery lightbox caption strip, or a future PDF caption). Distinct from the *destination's* name, since a gallery image's title is `"{destination.name} — {index}"`, not just the destination name repeated.
- **`location`** — where the photo was taken, separate from a destination's own `region`. A gallery image might be a detail shot (a doorway, a dish, a close-up) that isn't really "at" the destination's named region in the way the hero is.
- **`aspect_ratio`** — see §4. Replaces the old assumption (baked into Tailwind classes at each call site) that every image in a given slot has the same crop.
- **`caption?: string | LocalizedText`** — see §8. A plain string today for ~105 of ~115 captions in the system; some are hand-translated `LocalizedText` maps.

All five new fields are optional on the literal level. Nothing in `lib/data/*-mock.ts` needs every field hand-written — see §2.1.

### 2.1 Normalization layer (`lib/media/normalize.ts`)

A presentation-time backfill pass, not a migration. Each content type gets a small wrapper:

```ts
normalizeDestination(destination)   // backfills hero_image + gallery_images
normalizeFoodFind(food)             // backfills hero_image
normalizeCultureNote(note)          // backfills hero_image
```

Each delegates to `normalizeImageAsset(asset, defaults)`, which fills in `title`/`location`/`category`/`aspect_ratio` only where the literal didn't already set them, and derives `credit.copyright` from whether the photographer name is a known placeholder (`"Unassigned"`) — placeholder credits get `"Placeholder — rights holder not yet determined"`; anything else gets `` `© ${photographer}` ``. This is the same "placeholder honesty" principle v2 established for `alt` text, now extended to `copyright`.

These four wrappers are called at every return path in `lib/data/destinations.ts`, `lib/data/food-finds.ts`, and `lib/data/culture-notes.ts` — both the Supabase-row path and the mock-data fallback path — so every consumer of `getDestinations()`/`getFoodFinds()`/`getCultureNotes()` (and their `*BySlug` counterparts) receives fully-backfilled `ImageAsset`s without needing to know normalization exists. A hand-authored mock entry can still override any single field (set `aspect_ratio: "portrait"` explicitly, say) and the normalizer leaves it alone — it only fills gaps, never overwrites.

### 2.2 Caption resolution (`lib/media/caption.ts`)

```ts
export function resolveCaption(caption: string | LocalizedText | undefined, locale: Locale): string | undefined
```

A plain string passes through unchanged regardless of requested locale (every pre-Phase-12 caption is treated as the `en` value). A `LocalizedText` resolves `caption[locale] ?? caption.en`. This is the single place the union type gets collapsed to a renderable string — every page component calls `resolveCaption` once per image and then just renders a `string | undefined`, never branching on the union itself.

## 3. Editorial Storytelling — Five Named Sections

Per requirement #3, every destination detail page (`app/hidden-gems/[slug]/page.tsx`) is now organized into five labeled editorial sections via a local `SectionEyebrow` helper:

1. **Hero Story** — the hero image + `description` + a `GuidebookReference` pull-line. Image and text share one scene-setting role.
2. **Local Perspective** — `WhatLocalsKnow` tips (derived from the destination's own scores — crowd, food — not generic advice), `BestSlowMoment`/`WorthWakingUpFor` callouts, and `SkipThisDoThis`. No image of its own; this section is deliberately text-led, the "local voice" interlude between two photo-led sections.
3. **Visual Highlights** — `MasonryGallery` rendering `gallery_images` at each image's real `aspect_ratio` (§4), the section where the gallery's job is purely visual.
4. **Food Moments** — nearby `FoodFindCard`s, image-and-text grid cards pulling in the newly-credited `FoodFind.hero_image` (§3 below... see note) by way of the card component, not the detail page directly.
5. **Hidden Gems** — new this phase: a related-destinations module (same-category-first, same-country fallback, capped at 3) using `DestinationCard`. Before Phase 12 this name had no section to point to on the page itself (it only existed as the list page's name); now the detail page has one too, completing the "five sections" requirement literally rather than only at the list-page level.

`FoodFind` and `CultureNote` detail pages each gained a `resolveCaption`-driven hero caption line (§2.2) and switched their `hero_image_url` string prop to the full `hero_image: ImageAsset`, surfacing `PhotoCredit` for the first time on those two page types — previously only `Destination` heroes had a credit pill.

**FoodFind/CultureNote get a `hero_image: ImageAsset` for the first time this phase.** v2 §2 explicitly deferred this ("a future pass should do it for `FoodFind` first") — Phase 12 is that pass, added the same way v2 added it to `Destination`: an additive TypeScript field, backfilled in mock data, with zero Supabase migration (see §9 on why).

## 4. Destination Galleries — No Hardcoded Aspect Ratios

```ts
export type AspectRatio = "landscape" | "portrait" | "square";
export const ASPECT_RATIO_CLASSES: Record<AspectRatio, string> = {
  landscape: "aspect-[4/3]",
  portrait: "aspect-[3/4]",
  square: "aspect-square",
};
```

`MasonryGallery` (`components/brand/editorial.tsx`) renders a CSS multi-column layout (`columns-1 sm:columns-2`, `break-inside-avoid` figures) and looks up each image's *own* `aspect_ratio` via `ASPECT_RATIO_CLASSES[image.aspect_ratio ?? "landscape"]` — a portrait image gets a `3:4` box, a square image gets `1:1`, and neither is force-cropped into the other's shape or left with empty grid gaps beside it. This replaces the fixed `aspect-[4/3]` grid every gallery rendering used before Phase 12, where every image in a destination's gallery was assumed to be the same shape because the grid demanded it, not because the photos were.

Each gallery figure also carries a `LocationTag` (if `location` is set), a `PhotoCredit`, and a `resolveCaption`-resolved `<figcaption>` — the gallery is the one place all four new-this-phase metadata fields (`location`, `credit.copyright` via `PhotoCredit`'s `title` attribute, `caption`, `aspect_ratio`) are visible on a single image at once.

## 5. Homepage Editorial System — Four Named Spotlights

Per requirement #5, `lib/content/editorial-spotlight.ts` defines four pure, independently-testable selector functions over the destination list:

| Selector | Picks | Homepage placement |
|---|---|---|
| `getFeaturedDestination` | Highest `story_score` among `is_featured` destinations | The `FeatureLead` in the "Featured Destination" slot of the Hidden Gems section |
| `getSeasonalDestination` | Whichever destination's free-text `best_season` covers the current month (parsed by a small range/substring matcher, falling back to highest `slow_living_score` if nothing matches) | A new compact "In Season Now" strip between the Hidden Gems and Food Finds sections |
| `getEditorsPicks` | Top `local_score + food_score` among `is_featured` destinations, default count 2–3 | The supporting card column beside the Featured Destination |
| `getHiddenGemSpotlight` | Lowest `crowd_score` among `is_featured` destinations — "the quietest of the quiet" | The relabeled "Hidden Gem Spotlight" postcard interlude |

Each selector accepts an optional `exclude: Set<string>` of destination IDs. `app/page.tsx` threads one accumulating `usedSpotlightIds` set through all four calls in order, so the four homepage slots never collide on the same destination — a destination can still appear in more than one *list* elsewhere on the site, but never twice across these four specific editorial slots in the same page render.

`getSeasonalDestination`'s month parsing (`monthsInSeasonText`) handles both `"Month–Month"` en-dash ranges (expanding every month in between) and looser literal phrasing like `"Late May to mid-June, or September"` via substring matching against full month names — validated against the actual range of `best_season` strings already authored in `destinations-mock.ts`, including multi-part comma-separated and parenthetical forms (`"September–November (truffle season), May–June"`).

## 6. PDF Compatibility

`components/planner/itinerary-pdf.tsx` documents four reserved photography slots (`coverImageSlot`, `destinationThumb`, `mapStopThumb`, `foodItemThumb`) — unchanged in number from Phase 6, but the file-level comment and the Food Recommendations section's inline comment were updated this phase to reflect two things:

1. Every `ImageAsset` in the system now carries title/location/credit metadata, so whichever slot eventually gets wired could also render a credit line, not just a bare image.
2. `FoodFind.hero_image: ImageAsset` now exists (§3) — but `itinerary.restaurant_picks` is still a free-text string array with no `FoodFind` slug threaded through `lib/ai/grounding.ts`. The image data is no longer the blocker for the Food Recommendations slot; the *lookup key* connecting a recommendation line back to a specific `FoodFind` record is.

The reliability decision from Phase 6 is unchanged and this phase does not revisit it: `@react-pdf/renderer`'s `Image` component resolves `src` over the network at render time, so wiring live `picsum.photos` URLs into PDF exports would make every export depend on a third-party host staying reachable. That's a reliability regression, not an architecture gap, so no `Image` import was added and no slot renders a real photo yet. When real, hosted photography exists (own CDN, not picsum), wiring each slot is a one-line `<Image style={styles.slotName} src={asset.url} />` — the layout math is already decided.

A travel-magazine PDF (a downloadable destination guide, not just a generated itinerary) or a print-style guide export would draw from the exact same `ImageAsset` records — nothing about the metadata model is itinerary-specific. The `category: "pdf"` tag exists precisely so a future PDF-rendering pass can filter to "images cleared and sized for print" without re-deriving that from context each time.

## 7. Mobile Experience Audit

Spot-checked this phase against the three pages touched (destination, food-find, culture-note detail pages) plus the homepage:

- **Hero height consistency** — `HERO_HEIGHT.detail` (`h-[38vh] min-h-[280px] sm:h-[50vh] sm:min-h-[360px]`) is now applied via `cn(HERO_HEIGHT.detail, "w-full")` on both the destination and food-find detail-page heroes, closing the exact gap v2 §4 flagged as "unreviewed" (Hidden Gems at 50vh vs. Food Finds at 42vh, hand-tuned independently). Both now share one constant. Culture Notes still deliberately has no full-bleed hero — its in-flow `aspect-[16/9]` essay treatment is unchanged and, per the v2 audit, is intentional rather than a gap to close.
- **Gallery responsiveness** — `MasonryGallery`'s `columns-1 sm:columns-2` means a single column on mobile (390/430px) and two columns from `sm:` (640px) up; each image's own aspect ratio (§4) means no image is ever stretched or cropped to fit a column it wasn't shaped for, at any viewport.
- **Image scaling** — every `EditorialImage` and `MasonryGallery` image is a `next/image` `fill` inside a relative, percentage/viewport-sized wrapper (no hardcoded pixel widths), consistent with the v2 audit's finding and unchanged by this phase's additions.

This is a code-level audit (reading component source and Tailwind classes), the same caveat v2 §4 and the Phase 6 report carried — no live browser session was available this session to confirm rendered behavior at 390/430/768/1024px.

## 8. Multilingual Readiness — Architecture Only

Requirement #8 asks for EN/DE/IT/HR caption *support*, not translated copy. This phase implements exactly the union type v2 §5 proposed as a future-notes sketch, now for real:

```ts
export type LocalizedText = Partial<Record<Locale, string>> & { en: string };
// ImageAsset.caption?: string | LocalizedText;
```

- Every existing `caption: string` stays valid — `resolveCaption` (§2.2) treats a plain string as the `en` value for any requested locale, so the ~105 captions already in mock data needed zero rewriting.
- `en` is required so there's always a guaranteed fallback string; `de`/`it`/`hr` are filled in opportunistically as real translations are written, not as a backlog that blocks anything.
- `alt` deliberately stays a plain required `string`, not a `LocalizedText` — this phase doesn't touch it. Localizing alt text is a real future need (a screen reader should hear the right language), but it's a separate, larger decision than captions (alt text has accessibility implications captions don't), and the brief's requirement #8 specifically names *captions*. Widening `alt` the same way `caption` was widened is a natural next step, not done here to avoid scope creep beyond what was asked.
- `credit` (photographer/source/license/copyright) is unchanged — names and rights lines don't need translation.

This is purely a type-and-resolver change. No locale-switching UI work was needed, since `getServerLocale()` (built in Phase 9) already exists and every page reading an `ImageAsset` caption already calls it for other purposes (e.g. the language switcher); this phase's pages added one extra `resolveCaption` call alongside the locale they already had.

## 9. Why Additive, Not a Migration

Same precedent v2 established for `Destination.hero_image`/`gallery_images`, now extended to `FoodFind`/`CultureNote`: every Phase 12 field is a new TypeScript field, backfilled in mock data, with **zero Supabase migration**. `hero_image_url` (the flat string column real Supabase rows provide) is untouched on both types — list cards that still read the flat string keep working unmodified; only the two detail pages and the normalization layer read the new structured field. When a real `hero_image jsonb` column eventually lands for `food_finds`/`culture_notes` (mirroring whatever migration `destinations.hero_image` would eventually get), the data layer needs no further changes — the type already expects the shape.

## 10. Future AI Compatibility (Notes Only — No AI Image Generation)

Per requirement #9, this section documents *how* future AI-generated imagery or AI-assisted tagging could integrate — nothing here is implemented, and no AI image generation exists in this codebase today.

**AI-assisted tagging (lower-risk, more plausible near-term):** `lib/media/normalize.ts`'s backfill pattern is exactly the seam an AI tagging pass would use — instead of (or alongside) deriving `title`/`location`/`aspect_ratio` from the owning destination, a one-time enrichment script could call a vision model against each `url`, propose values for the *same* optional fields, and write them back into the mock-data literals (or, once persisted, a real `jsonb` column) for a human to review before they ship. Because every field this phase added is optional and additive, an AI tagging pass is a data-backfill exercise, not a schema change — it would produce more `ImageAsset` literals, not a new shape.

**AI-generated imagery (out of scope today, and deliberately not wired toward `DestinationCandidate`):** `lib/ai/discovery.ts`'s `DestinationCandidate` (Phase 11) is *intentionally* thin — no `*_score` fields, no `ImageAsset`, no `why_we_love_it` (see `lib/types.ts`'s comment on the type). That gap must not be closed by attaching AI-generated or AI-sourced imagery to a candidate automatically. A `DestinationCandidate` only earns an `ImageAsset` the same way it earns scores and editorial copy: through the Stage 3 editorial-promotion path documented in `docs/ai-discovery-architecture.md`, where a human reviews and promotes a candidate into a real, curated `Destination`. If AI image generation is added to this product later, the integration point is *after* that promotion step — generating or sourcing a hero/gallery image for an already-promoted `Destination` — never as an automatic enrichment of an unverified, AI-suggested candidate still carrying a `"structurally_checked"` or `"unverified"` status. This mirrors the same trust boundary `VerificationStatus` already enforces for text: structural plausibility is not the same as editorial fact-checking, and an AI-generated image of a place would carry exactly the same risk of looking authoritative while being wrong.

## 11. What This Phase Did Not Touch

Per the Phase 12 brief: no placeholder photography was replaced with real photography (not asked for — "no placeholder removal required today"), no AI image generation was added, no Supabase migration was written, no auth/payments/analytics changes were made, and `alt` text remains a plain string (not widened to `LocalizedText` — see §8). Every change in this phase is additive TypeScript types, a small normalization/caption-resolution library, mock-data backfill for `FoodFind`/`CultureNote` hero images, presentational component updates (`MasonryGallery`, shared `HERO_HEIGHT`), the homepage selector module, comment updates to the PDF architecture, and this document.

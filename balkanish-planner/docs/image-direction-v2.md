# Image Direction v2 — Editorial Photography System

**Product:** Balkanish Planner
**Version:** 2.0 — Phase 6, Photography & Visual Identity System
**Relationship to v1:** `docs/image-direction.md` is the *mood and styling brief* — light, color grade, composition, what to avoid, per-section feel. It still stands and is not duplicated here. This document is the *system architecture* layered on top of it: what image slots exist on every page, how an image's metadata (alt text, caption, credit) is modeled and stored, what the current visual-consistency audit found, and how the system is meant to grow (multilingual captions, PDF photography, eventually real photography). Read v1 for *how an image should look*. Read this for *where images live in the code and how they're described*.

---

## 1. The Unified Photography System — Image Categories

Every photo on the site now falls into one of four **structural categories**, regardless of section. A page combines these the way a magazine combines a cover shot, a pull-photo, and a contact sheet:

| Category | What it is | Aspect ratio | Carries `PhotoCredit`? |
|---|---|---|---|
| **Hero** | One large, scene-setting image per page/feature — full-bleed or near-full-bleed, often with a text overlay | 16:9–ish (homepage, destination/food-find heroes) | Yes |
| **Feature Lead** | A large image-and-overlay card used to break up a grid (one per list page) | 4:3 → 16:10 at `sm:` | Yes |
| **Gallery** | Multiple supporting images beneath a hero, viewed *after* the reader is already committed to the page | 4:3 | Yes (each image) |
| **Card / Grid** | The small thumbnail used in every list and recommendation grid | 4:3 (3:4 for Premium Guide covers) | No — credits would clutter a thumbnail; see §4 |

Mapped against the seven areas named in the Phase 6 brief:

- **Hidden Gems** — Card (list grid) → Feature Lead (homepage "Hidden Gems" section, `FeatureLead` in `app/page.tsx`) → Hero + Gallery (`app/hidden-gems/[slug]/page.tsx`).
- **Food Finds** — Card (`FoodFindCard`) → Hero (`app/food-finds/[slug]/page.tsx`). No gallery yet — food finds are single-dish stories, not multi-image places; see §2 for why the `ImageAsset` pattern wasn't extended here yet.
- **Culture Notes** — Card (`CultureNoteCard`) → in-flow essay image (`app/culture-notes/[slug]/page.tsx`, 16:9, no full-bleed overlay — deliberately different, see §4).
- **Secret Swap** — Two Hero-weight images side by side (famous spot vs. alternative), `app/secret-swap/page.tsx` and the homepage Secret Swap section.
- **Matchmaker** — Card-weight result imagery (`components/matchmaker/quiz-flow.tsx`), same 4:3 as the Hidden Gems grid — a matchmaker result is still a destination card, just arrived at differently.
- **Planner PDFs** — No real images today; reserved layout slots exist for Cover, Daily Itinerary, Day Trips, Map Overview, and Food Recommendations. See §3.
- **Destination Detail Pages** (`app/hidden-gems/[slug]/page.tsx`) — the richest page: Hero with `PhotoCredit` + `LocationTag`, then a Gallery section, the only page in the system currently exercising every structural category at once.

## 2. Image Metadata Architecture

### The new types (`lib/types.ts`)

```ts
export interface ImageCredit {
  photographer: string;
  source: string;
  license?: string;
}

export interface ImageAsset {
  url: string;
  alt: string;
  caption?: string;
  credit: ImageCredit;
}
```

`Destination` gained two fields built on `ImageAsset`:

```ts
hero_image: ImageAsset;
gallery_images: ImageAsset[];
```

### Why additive, not a replacement

The Supabase migration (`supabase/migrations/0001_init_schema.sql`) defines real `hero_image_url text` and `gallery_image_urls text[]` columns on `destinations`. Phase 6 explicitly rules out Supabase changes. Rather than retype those columns (which would either break the live schema or require a migration), `hero_image` / `gallery_images` were added as **new, parallel fields**:

- `hero_image_url` and `gallery_image_urls` are untouched and still the fields a live Supabase row provides. Anything still reading them (list cards) keeps working unmodified.
- `hero_image` / `gallery_images` are populated for all 35 mock destinations (`lib/data/destinations-mock.ts`) with placeholder `ImageAsset` objects, and are what the upgraded destination detail page and homepage feature spots render.
- This mirrors a pattern already in the codebase: `travel_types`, `latitude`, and `longitude` were added to the `Destination` type in an earlier phase with **no corresponding migration at all** — the mock-data layer (gated by `isSupabaseConfigured()`) is the established place for the type system to run ahead of the database. `hero_image`/`gallery_images` follow that same precedent.
- When a real Supabase-backed `hero_image`/`gallery_images` column lands, the migration would add `jsonb` columns matching the `ImageAsset` shape and the data layer (`lib/data/destinations.ts`) would stop needing to special-case anything — the type already expects it.

### Why only `Destination`, for now

The brief says "every destination should support…", not every content type. `FoodFind`, `CultureNote`, `SecretSwap`, and `PremiumGuide` keep their existing flat `hero_image_url` strings. The pattern is intentionally generalizable — any of those types could gain `hero_image: ImageAsset` (and `gallery_images: ImageAsset[]` where relevant, e.g. `FoodFind`) the same way, and a future pass should do it for `FoodFind` first, since it's the most likely candidate for a credited hero on its detail page. Doing it now for four more content types, when the brief only asked for destinations, would have been scope creep.

### Placeholder honesty

Every placeholder `alt` reads as a transparent placeholder — e.g. *"Editorial placeholder image for Vis, Dalmatian Islands — to be replaced with real on-location photography."* — rather than a fabricated description of what a random `picsum.photos` stock image happens to show. v1's own alt-text rule ("descriptive and specific to the actual image content") is followed literally: a placeholder's only honest "actual content" is that it's a placeholder. When real photography is sourced, every `alt` and `caption` in `destinations-mock.ts` needs a pass to describe the real photo — this is a known, tracked debt, not an oversight.

### `PhotoCredit`

A new component in `components/brand/editorial.tsx`: a small, low-opacity "Photo: {photographer} · {source}" pill, visually matched to the existing `LocationTag` component (`rounded-full`, `bg-charcoal/30`, `backdrop-blur-sm`). It's deliberately used only on Hero/Feature Lead/Gallery images — never on Card/Grid thumbnails — the same restraint a real magazine uses: feature photography gets a byline, thumbnails don't.

## 3. PDF Image Architecture (Cover / Destination / Map / Food)

`components/planner/itinerary-pdf.tsx` now documents — but does not render — four photography slots, exactly where the Phase 6 brief asked for them:

1. **Cover page** — a full-bleed slot behind the title block, sourced from the first map stop's destination.
2. **Destination sections** — the Daily Itinerary day blocks and the Day Trips cards, each able to resolve a destination slug (`itinerary.map_points` for days, `trip.destination_slug` directly for day trips) and look up `hero_image`.
3. **Map section** — a thumbnail slot replacing the numbered marker in each Map Overview legend row.
4. **Food section** — a thumbnail slot beside each Food Recommendations line item, conditional on `FoodFind` eventually gaining its own `ImageAsset` (see §2).

Each slot is a `StyleSheet` entry (`coverImageSlot`, `destinationThumb`, `mapStopThumb`, `foodItemThumb`) plus an inline comment at the exact JSX location showing the future `<Image style={...} src={...} />` call and where its `src` would come from. **No `Image` import was added and no network fetch happens.** `@react-pdf/renderer`'s `Image` resolves `src` over the network at render time — wiring it today against `picsum.photos` placeholders would make every PDF export depend on a third-party host staying up, which is a reliability change, not an architecture one. The layout math (dimensions, radius, spacing) is decided now so wiring real images later is a one-line `<Image>` per slot, not a redesign.

## 4. Visual Consistency Audit

A code-level pass across every page that renders a photo (no live browser was available this session — findings below are from reading component source and Tailwind classes, not a rendered screenshot).

**Aspect ratios — consistent within category, by design:**
- Card/Grid: `DestinationCard`, `FoodFindCard`, `CultureNoteCard` all use the exact same wrapper (`rounded-xl border border-border bg-card`, `aspect-[4/3]`, identical `sizes` prop, identical hover-scale `imageClassName`). This is the strongest consistency finding in the system — these three components are near-identical by construction, not by coincidence.
- `GuideCard` uses `aspect-[3/4]` (book-cover proportions for Premium Guides) — an intentional, documented exception, not drift.
- `FeatureLead` is the one place an aspect ratio itself changes responsively (`aspect-[4/3] sm:aspect-[16/10]`) rather than just the container height — appropriate since it spans 2 grid columns at `lg:` and would otherwise crop awkwardly.

**Hero banner heights — inconsistent across detail pages, and that inconsistency is unreviewed:**
- Homepage: `h-[62vh] min-h-[460px] sm:h-[72vh]`
- Hidden Gems detail: `h-[38vh] min-h-[280px] sm:h-[50vh] sm:min-h-[360px]`
- Food Finds detail: `h-[34vh] min-h-[240px] sm:h-[42vh] sm:min-h-[300px]`
- Culture Notes detail: no full-bleed hero at all — an in-flow `aspect-[16/9]` image inside a `max-w-2xl` article column.

The homepage hero being tallest is intentional (first impression). The gap between Hidden Gems (50vh) and Food Finds (42vh) detail heroes has no documented reason — recommend converging on one detail-page hero height in a future pass rather than three independently-tuned values. Culture Notes' in-flow treatment is **not** a bug: it's an essay-format page (first-letter drop cap, `max-w-2xl` reading column), and a full-bleed photo hero would fight the reading rhythm v1 §4 calls for ("reflective, a little documentary"). Worth stating explicitly so a future contributor doesn't "fix" it into matching the other two.

**Spacing around photography:** consistently `p-4 sm:p-5` for card text blocks, consistently `mt-6 sm:mt-8` (or equivalent `gap-5 sm:gap-6`) between an image and the content that follows it, site-wide. No drift found.

**Mobile responsiveness:** every `EditorialImage` usage sits inside a `next/image` `fill` wrapper with a responsive container (`w-full`, `max-w-*`, or a CSS grid track) — no hardcoded pixel widths were found on any image wrapper (the only hardcoded `w-[...]` values in the codebase are border widths and box-shadow values, not layout widths). All `sizes` props follow the same `(min-width: 1024px) Xvw, 100vw` shape. This is a static/code-level audit only — no live mobile browser was available to confirm rendered behavior at 390/430/768/1024px; see the Phase 6 implementation report for the same disclosure applied project-wide.

**Caught and fixed during this audit:** the homepage Postcards interlude (`app/page.tsx`) is the one spot where `LocationTag` and the new `PhotoCredit` sit on the *same* image at the same time, and the card itself is capped at `max-w-xs` (320px) — narrower than every other place `PhotoCredit` appears. Placing them at opposite bottom corners (the pattern used for hero images, which have much more width to spare) risked the two pills' text overlapping in the middle on small viewports. Fixed by stacking both pills together at bottom-left instead, and by shortening the placeholder credit text site-wide (`"Unassigned — placeholder" / "Picsum (placeholder)"` → `"Unassigned" / "Picsum"`) so a single credit pill stays comfortably short everywhere it appears, not just on this card.

## 5. Future Multilingual Image Caption Architecture (Notes Only — Not Implemented)

No language switching exists in this codebase, and this section implements none. It documents how `ImageAsset.alt` / `.caption` would extend to English, German, Italian, and Croatian without a breaking change:

```ts
// Future shape — not implemented:
type LocalizedText = Partial<Record<"en" | "de" | "it" | "hr", string>> & { en: string };

interface ImageAsset {
  url: string;
  alt: string | LocalizedText;       // string today; widens to LocalizedText
  caption?: string | LocalizedText;
  credit: ImageCredit;               // photographer/source names don't need translation
}
```

- **Why a union, not a hard cutover:** every existing `alt: string` in `destinations-mock.ts` stays valid. A locale-aware renderer would do `typeof alt === "string" ? alt : alt[locale] ?? alt.en`, so the migration is data-only — add `de`/`it`/`hr` keys to existing `ImageAsset` objects over time, no component changes required on day one.
- **`en` is required, others optional:** guarantees there's always a fallback string to render even for partially-translated entries, which matters for alt text specifically — an accessibility feature should never silently render `undefined`.
- **Credits don't localize:** a photographer's name and a source ("Picsum (placeholder)" today, an agency or photographer's own site later) stay as-is across locales — `ImageCredit` is left untouched by this proposal.
- **Where this would plug in:** `EditorialImage`, `PhotoCredit`, and `FeatureLead` already take `alt`/`credit` as props rather than reaching into a global — once a `locale` is available (e.g. via Next.js i18n routing, itself out of scope for this phase), each call site resolves the right string before passing it down. No prop-shape change needed in the components themselves.
- **Scope boundary:** this is the *image-caption* slice only. Translating destination `description`, `why_we_love_it`, culture note `body` text, etc. is a larger content-localization problem this document does not attempt to solve.

## 6. What This Phase Did Not Touch

Per the Phase 6 brief: no auth, payments, memberships, analytics, multilingual implementation, additional databases, Supabase schema changes, OpenAI changes, external APIs, or real image sourcing. Every change in this phase is additive TypeScript types, mock-data backfill, presentational components, and documentation/architecture notes. `npm run typecheck`, `lint`, and `build` were run after this phase's changes — see the Phase 6 implementation report for results.

# Share Asset Engine — Architecture Reference

Phase 27 — Shareability & Organic Growth Loop

---

## Overview

The Share Asset Engine lets users generate shareable images from their saved itineraries, download them, or send them via the native OS share sheet. It is:

- **Client-side only** — no images are uploaded to any server
- **User-initiated only** — no auto-publish, no background jobs
- **Exit-ready** — all brand attribution is centralized; a single config change rebrands all share assets
- **No SDK dependencies** — uses the Web Share API with graceful download fallback

---

## Architecture Map

```
SavedItinerary (DB row)
        │
        ▼
  buildTripShareSnapshot()       ← lib/share/sanitizer.ts
  (privacy boundary)
        │
        ▼
  TripShareSnapshot              ← lib/share/types.ts
        │
        ├──► TripShareCard (preview)    ← components/share/trip-share-card.tsx
        │      (CSS-scaled visual)
        │
        └──► TripShareCard (capture)    ← same component, forwardRef
               (off-screen, full size)
                      │
                      ▼
               html-to-image toPng()
                      │
                      ├──► download (always available)
                      └──► navigator.share() (when supported)
```

---

## Data Model: TripShareSnapshot

Defined in `lib/share/types.ts`. Produced by the sanitizer from a `SavedItinerary`.

```typescript
interface TripShareSnapshot {
  tripId: string;          // stable ID (user's own data)
  title: string;           // user-renamed or AI-generated title
  durationDays: number;    // nights
  month: string;           // "June"
  paceLabel: string;       // "Relaxed" | "Balanced" | "Explorer"
  countryLabel: string;    // "Croatia" or "The Balkans"
  routeText: string | null; // "Split → Dubrovnik → Kotor" (max 4 stops)
  stopCount: number;
  dayTripCount: number | null;
  totalDistanceKm: number | null;
  brandConfig: ShareBrandConfig;
}
```

### Privacy guarantees
- No private notes
- No user email or user_id
- No internal confidence scores or provenance metadata
- No exact current location
- `totalDistanceKm` is only set when `route_summary.total_distance_km > 0` (never fabricated)

---

## Sanitizer: `buildTripShareSnapshot()`

`lib/share/sanitizer.ts`

```typescript
buildTripShareSnapshot(
  itinerary: SavedItinerary,
  brandConfig?: ShareBrandConfig  // defaults to DEFAULT_SHARE_BRAND_CONFIG
): TripShareSnapshot
```

**Key logic:**
- `countryLabel = gen.country ?? "The Balkans"` — single-country or multi-country fallback
- `routeText` = non-day-trip map_points, sorted by `day`, consecutive-deduplicated, max 4 stops (3 + "…")
- `paceLabel` mapped via `PACE_LABELS: { relaxed: "Relaxed", balanced: "Balanced", active: "Explorer" }`
- `totalDistanceKm` = `Math.round(total_distance_km)` only when `route_summary` exists and value > 0

---

## Format Registry

Three output formats from one data model:

| Format | Aspect ratio | CSS dimensions | Export @2× |
|--------|-------------|----------------|------------|
| `story` | 9:16 | 360×640 | 720×1280 |
| `feed` | 1:1 | 400×400 | 800×800 |
| `postcard` | 4:5 | 400×500 | 800×1000 |

Defined in `SHARE_CARD_DIMENSIONS` in `lib/share/types.ts`.

**How to add a new format:**
1. Add the format string to `ShareFormat` union in `lib/share/types.ts`
2. Add an entry to `SHARE_CARD_DIMENSIONS`
3. Add it to `formats` array in the relevant `SHARE_TEMPLATES` entries
4. Add a case in each template renderer in `trip-share-card.tsx` (or reuse the nearest-matching layout)
5. Add labels/hints to all 4 locale `share.json` files under `formats`

---

## Template Registry

Three templates:

| ID | Label key | Supported formats | Visual character |
|----|-----------|-------------------|-----------------|
| `JOURNEY_SUMMARY` | `templates.journeySummary` | story, feed, postcard | Bold numbers, dark-on-cream |
| `BALKAN_STORY` | `templates.balkanStory` | story, feed, postcard | Italic, cream warmth |
| `POSTCARD` | `templates.postcard` | postcard, feed | Stamp + postmark aesthetic |

Defined in `SHARE_TEMPLATES` in `lib/share/templates.ts`. Default: `JOURNEY_SUMMARY`.

**How to add a new template:**
1. Add the template ID to `ShareTemplateId` union in `lib/share/types.ts`
2. Add an entry to `SHARE_TEMPLATES` with `id`, `labelKey`, and `formats`
3. Add a case in `renderTemplate()` in `trip-share-card.tsx`
4. Add the i18n label key to all 4 locale `share.json` files under `templates`

---

## Renderer Architecture: TripShareCard

`components/share/trip-share-card.tsx`

- `forwardRef<HTMLDivElement>` — exposes a DOM ref for html-to-image capture
- Fixed `style={{ width, height }}` from `SHARE_CARD_DIMENSIONS[format]`
- **No external images** — pure CSS gradients + inline SVG (LogoMark). This is mandatory to prevent CORS failures in html-to-image.
- No Tailwind classes that depend on external resources (no `bg-[url(...)]`)

**Why two instances in ShareModal:**

1. **Visible preview** — wrapped in `scale(PREVIEW_SCALE)` CSS transform to fit the dialog
2. **Hidden capture target** — fixed off-screen at `-9999px`, no parent transform, receives the `ref`

This solves a known html-to-image issue: `getBoundingClientRect()` returns the visual (scaled) size, not the CSS size, causing the export to be too small. By pointing the ref at the off-screen instance (no parent transform), `toPng()` sees the correct CSS dimensions.

`toPng()` is called with explicit `width` and `height` options as an additional safety measure:
```typescript
toPng(captureRef.current, {
  cacheBust: true,
  pixelRatio: 2,
  width: dims.width,
  height: dims.height,
})
```

---

## ShareBrandConfig: Centralized Attribution

`lib/share/brand-config.ts`

```typescript
interface ShareBrandConfig {
  productName: string;        // full product name
  attributionLine: string;    // shown on share images (max ~50 chars)
  shortAttribution: string;   // tight-space version
  websiteLabel: string;       // domain shown on assets
  websiteUrl: string;         // canonical URL
  logoAsset: string | null;   // null = use LogoMark SVG
  shareMark: string | null;   // optional brand mark
  ownerBrand: string | null;  // operator name (null = don't show separately)
  attributionEnabled: boolean;
  templateVariant: "warm" | "minimal" | "editorial";
}
```

**Naming note:** "Balkanish" as a standalone word has an existing use by an external lifestyle/merch brand. The product is called "Balkanish Travel Planner". Attribution always uses the full product name to avoid brand confusion.

### How to rebrand all share assets

**Change only `DEFAULT_SHARE_BRAND_CONFIG` in `lib/share/brand-config.ts`.**

No renderer, component, or template code needs to change. Every share card reads `brandConfig.shortAttribution` and `brandConfig.attributionEnabled` from the snapshot.

Example:
```typescript
export const DEFAULT_SHARE_BRAND_CONFIG: ShareBrandConfig = {
  productName: "Your New Brand",
  attributionLine: "Planned with Your New Brand",
  shortAttribution: "Your New Brand",
  // ...rest unchanged
};
```

---

## Mobile Web Share API

`lib/share/use-web-share.ts`

Feature detection at runtime (not build time):
```typescript
const canShare =
  typeof navigator !== "undefined" &&
  typeof navigator.share === "function" &&
  typeof navigator.canShare === "function";
```

**Flow:**
1. Convert PNG data URL → `Blob` → `File` via `fetch(dataUrl)`
2. Check `navigator.canShare({ files: [file] })` — some browsers support `share` but not file sharing
3. Call `navigator.share({ title, files: [file] })`
4. `AbortError` (user cancelled the share sheet) → returns `false` without error state
5. Any other error → `status = { state: "error", message }` — UI shows fallback message

**Fallback strategy:**
- `canShare = false` → Share button is hidden; Download button is always shown
- This means the UX always works regardless of browser/OS support

---

## Privacy Design

| Concern | Mitigation |
|---------|-----------|
| Trip data leaked to server | The PNG is generated entirely client-side; no upload |
| Private notes in share image | `buildTripShareSnapshot()` never includes notes |
| Auto-sharing | Share is always triggered by an explicit user tap |
| PII in analytics | Events carry `format` and `template` only; no trip content, no note text, no user email |
| External service dependency | No Instagram/TikTok SDK; no social login; no OAuth for sharing |

---

## Analytics Events

Defined in `lib/analytics.ts`, tracked via Plausible:

| Event | When | Props |
|-------|------|-------|
| `Share Asset Created` | ShareModal opens | `itinerary_id` |
| `Share Format Selected` | User changes format | `format` |
| `Share Native Opened` | User taps Share (Web Share API) | `format`, `template` |
| `Share Downloaded` | User taps Save image | `format`, `template` |

---

## i18n

The `share` namespace is the 14th namespace in `lib/i18n/dictionaries.ts`.

Files: `locales/{en,de,it,hr}/share.json`

Key groups:
- `modal.*` — dialog labels, button text, privacy note
- `formats.*` — format names and hints
- `templates.*` — template display names
- `card.*` — unit labels (nights, stops, km, etc.)
- `entry.*` — the Share button label and tooltip in itinerary list

**Note:** The `TripShareCard` renderer currently uses inline English strings. A future iteration can use the dictionary via a passed `t()` function if multilingual share cards become a requirement.

---

## Share Entry Points

| Surface | Component | How it opens the modal |
|---------|-----------|----------------------|
| Saved itinerary card | `components/my-balkans/saved-itineraries.tsx` | "Share" button → `setShareItinerary(saved)` |

Additional entry points (future phases):
- After itinerary generation (planner flow)
- Post-trip reflection completion screen

---

## Exit Readiness

If this product is sold, rebranded, or white-labelled:

1. Change `DEFAULT_SHARE_BRAND_CONFIG` in `lib/share/brand-config.ts` — all share images rebrand instantly
2. Update pdf.json `cover.brand` and `footer.tagline` in all 4 locales — PDF headers/footers rebrand
3. No other files need to change for a brand-name-only rebrand

No `BabicADesigns` or founder identity appears in any share-rendered output.

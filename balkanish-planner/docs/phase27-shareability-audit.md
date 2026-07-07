# Phase 27 — Shareability & Organic Growth Loop: Pre-Implementation Audit

**Audit conducted before writing Phase 27 code.**
Principle: AUDIT FIRST → REUSE SECOND → EXTEND THIRD → BUILD NEW ONLY WHERE REAL GAP EXISTS.

---

## Existing Feature Inventory

| Feature | Status | Location | Reusable? | Gap | Phase 27 action |
|---------|--------|----------|-----------|-----|-----------------|
| PNG export via html-to-image | ✅ Installed & used | `components/postcards/postcard-editor.tsx` + package.json (v1.11.11) | ✅ Yes — reuse same library and pattern | None — library already proven | **Reuse**: import `toPng` dynamically in ShareModal |
| Postcard PNG export flow | ✅ Working | `postcard-editor.tsx` `downloadPostcard()` | ✅ Yes — same capture → dataURL → `<a>` download pattern | None — copy pattern verbatim | **Reuse**: same two-step capture pattern |
| LogoMark SVG component | ✅ Working | `components/brand/logo-mark.tsx` | ✅ Yes — inline SVG, no external image load | None | **Reuse**: inline in share cards to avoid CORS |
| TravelStamp / Postmark brand components | ✅ Working | `components/brand/editorial.tsx` | ⚠️ Partial — styled with CSS classes that may not survive html-to-image in all contexts | May need to inline styles | **Reference**: stamp aesthetic used in PostcardStyleCard using raw inline styles |
| PostcardFrame component | ✅ Exists | `components/brand/editorial.tsx` | ⚠️ Partial — relies on background image URLs | Image URLs cause CORS issues with html-to-image | **Not used**: replaced with pure CSS gradient equivalent |
| Analytics events (POSTCARD_DOWNLOAD, PDF_*) | ✅ Existing | `lib/analytics.ts` | ✅ Pattern reused | New share-specific events needed | **Extend**: add SHARE_ASSET_CREATED, SHARE_FORMAT_SELECTED, SHARE_NATIVE_OPENED, SHARE_DOWNLOADED |
| i18n namespace pattern (13 namespaces) | ✅ Working | `lib/i18n/dictionaries.ts` | ✅ Yes — add 14th namespace using same pattern | New `share` namespace needed | **Extend**: add share.json for all 4 locales |
| Dialog / modal pattern | ✅ Working | `components/ui/dialog.tsx` (shadcn/ui) | ✅ Yes — same Dialog component | None | **Reuse**: ShareModal uses same Dialog |
| Web Share API | ❌ Not present anywhere | — | N/A | Entire feature missing | **Build new**: `lib/share/use-web-share.ts` |
| Trip share card component | ❌ Not present | — | N/A | Entire feature missing | **Build new**: `components/share/trip-share-card.tsx` |
| Share brand config (centralized attribution) | ❌ Not present | — | N/A | Attribution hardcoded in postcard-editor + pdf.json | **Build new**: `lib/share/brand-config.ts` |
| TripShareSnapshot (sanitized data model) | ❌ Not present | — | N/A | Renderers were direct DB row consumers | **Build new**: `lib/share/types.ts` + `lib/share/sanitizer.ts` |
| Template registry | ❌ Not present | — | N/A | No template concept existed | **Build new**: `lib/share/templates.ts` |
| Share entry point in saved itineraries | ❌ Not present | `components/my-balkans/saved-itineraries.tsx` | N/A | No sharing trigger from itinerary list | **Build new**: Share button + ShareModal wire-up |
| "BabicADesigns" in pdf.json locales | ⚠️ Hardcoded | `locales/*/pdf.json` cover.brand + footer.tagline | N/A | External brand name hardcoded in 4 files | **Fix**: replace with "Balkanish Travel Planner" |
| "Balkanish" in postcard-editor.tsx | ⚠️ Hardcoded | `components/postcards/postcard-editor.tsx:171` | N/A | Brand attribution not centralized | **Fix**: use DEFAULT_SHARE_BRAND_CONFIG.shortAttribution |

---

## What Was Reused (from Audit Findings)

1. **html-to-image v1.11.11** — already installed; no new package needed
2. **PNG capture → dataURL → `<a download>`** pattern — verbatim from postcard-editor
3. **LogoMark SVG** — inline SVG renders cleanly in html-to-image without CORS
4. **shadcn/ui Dialog** — ShareModal wraps the same Dialog component
5. **analytics.track() pattern** — extended with 4 new events, same fire-and-forget style
6. **i18n dictionary pattern** — 14th namespace added using the established pattern
7. **SavedItinerary type** — existing DB type; sanitizer converts it to TripShareSnapshot

## What Was Extended (from Audit Findings)

1. **`lib/analytics.ts`** — 4 new Phase 27 events appended
2. **`lib/i18n/dictionaries.ts`** — 14th namespace `share` added for all 4 locales
3. **`locales/en/pdf.json`** (+ de, it, hr) — brand name corrected from "BabicADesigns" to "Balkanish Travel Planner"
4. **`components/postcards/postcard-editor.tsx`** — attribution now uses `DEFAULT_SHARE_BRAND_CONFIG.shortAttribution`
5. **`components/my-balkans/saved-itineraries.tsx`** — Share button + ShareModal wired in

## What Was Built New (identified as real gaps)

1. **`lib/share/brand-config.ts`** — `ShareBrandConfig` interface + `DEFAULT_SHARE_BRAND_CONFIG`
2. **`lib/share/types.ts`** — `ShareFormat`, `ShareTemplateId`, `SHARE_CARD_DIMENSIONS`, `TripShareSnapshot`, `ShareTemplate`
3. **`lib/share/sanitizer.ts`** — `buildTripShareSnapshot()` privacy boundary
4. **`lib/share/templates.ts`** — `SHARE_TEMPLATES` registry + `DEFAULT_TEMPLATE_ID`
5. **`lib/share/use-web-share.ts`** — `useWebShare()` hook with feature detection + graceful fallback
6. **`components/share/trip-share-card.tsx`** — DOM capture target with 3 templates × 3 formats
7. **`components/share/share-modal.tsx`** — Format picker, template picker, preview, download, native share
8. **`locales/en/share.json`** (+ de, it, hr) — 14th i18n namespace, 4 locales

---

## Decisions Not Taken (and Why)

| Option considered | Decision | Reason |
|-------------------|----------|--------|
| Instagram / TikTok SDK | ❌ Rejected | No native app, SDK adds dependency, Web Share API covers all app targets |
| External image in share cards | ❌ Rejected | html-to-image CORS: cross-origin image resources fail silently |
| Auto-publish on save | ❌ Rejected | Privacy: user-initiated only |
| "Made with Balkanish" attribution | ❌ Rejected | External brand conflict (standalone "Balkanish" is a lifestyle/merch brand); use full product name |
| Hardcoded "BabicADesigns" / founder identity | ❌ Rejected | Exit-readiness: centralized config makes rebrand a config-only change |
| Separate preview and capture components | Considered but solved differently | Two instances of same TripShareCard: one CSS-scaled for preview, one off-screen at 1× for capture |
| PostcardFrame component | Not used | Background image URL causes CORS failure in html-to-image; replaced with pure CSS gradient |

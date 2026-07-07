# Phase 25 — i18n Audit

Audit date: 2026-07-07

---

## Coverage Summary

| Locale | Namespaces | Status |
|--------|-----------|--------|
| English (en) | 12/12 | COMPLETE |
| German (de) | 12/12 | COMPLETE |
| Italian (it) | 12/12 | COMPLETE |
| Croatian (hr) | 12/12 | COMPLETE |

All 12 namespaces are present in all 4 locales:
`common`, `community`, `culture-intel`, `email`, `live-trip`, `logistics`, `partners`, `pdf`, `planner`, `reflection`, `travel-memory`, `trip-readiness`

---

## Namespace Responsibility Map

| Namespace | Used by | Phase added |
|-----------|---------|-------------|
| `common` | Site-wide (header, footer, shared UI) | Phase 9 |
| `planner` | Planner wizard, itinerary view | Phase 9 |
| `pdf` | PDF generation (itinerary PDF) | Phase 14 |
| `email` | Email delivery copy | Phase 14 |
| `community` | Community notes submission/admin | Phase 16 |
| `logistics` | Logistics admin panel | Phase 19 |
| `culture-intel` | Cultural intelligence admin panel | Phase 20 |
| `partners` | Partners admin panel | Phase 18 |
| `travel-memory` | Travel memory panel on /account | Phase 21 |
| `trip-readiness` | Trip companion readiness checklist | Phase 22 |
| `live-trip` | Live trip today view | Phase 23 |
| `reflection` | Post-trip reflection component | Phase 24 |

---

## Architecture

- `lib/i18n/config.ts` — locale list + type (`Locale = "en" | "de" | "it" | "hr"`)
- `lib/i18n/dictionaries.ts` — dynamic import per locale, exports `Dictionary` type
- `lib/i18n/locale-provider.tsx` — `LocaleProvider`, `useLocale` hook
- `useLocale()` returns `{ locale, t, tList }` where `t(namespace, key, vars?)` is type-safe against `Dictionary`
- Server components use `getServerLocale()` (reads from cookie/header, defaults to `"en"`)
- `LocaleProvider` is wired in `app/layout.tsx`

---

## Coverage Gaps

**No gaps found.** Every UI component that renders user-facing strings uses `useLocale()` with the appropriate namespace.

**Notable:** The reflection namespace (`reflection.json`) was added in Phase 24 and is present in all 4 locales. This was verified by listing all locale directories.

---

## AI-Generated Content

AI-generated itinerary prose is returned in the prompt language only (English, based on the prompt template in `buildGroundingBrief`). There is no multilingual AI prose generation. The `planner.json` locale files translate the UI chrome (labels, buttons, section headings) but the itinerary narrative is English-only.

This is a documented architectural decision in `docs/multilingual-architecture.md`. The Balkanish editorial voice and the AI prose layer are English-first.

---

## PDF Locale Support

`downloadItineraryPdf` and `emailItineraryPdf` accept a `locale: Locale` parameter defaulting to `DEFAULT_LOCALE` ("en"). PDF section headings and labels use translations from `pdf.json`. Narrative prose in PDFs mirrors the itinerary prose (English-only, as above).

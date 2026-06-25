# Multilingual Architecture — Phase 9

**Product:** Balkanish Planner
**Status:** Infrastructure implemented and shipped. UI chrome (navigation, footer, planner wizard, PDF structural labels) is translatable today across English, German, Italian, and Croatian. No destination, itinerary, or AI-generated content is translated — that is explicitly out of scope for this phase, per the brief, and is the subject of §3–4 below.

---

## 1. What was built

A dependency-free i18n layer, chosen over a library like `next-intl` to avoid restructuring every route under `app/[locale]/...` — consistent with this project's existing pattern of hand-rolling lightweight solutions rather than pulling in framework-shaped dependencies.

- **`lib/i18n/config.ts`** — the four supported locales (`en`, `de`, `it`, `hr`), the default (`en`), and the cookie name (`NEXT_LOCALE`) that is the single source of truth for the active locale.
- **`lib/i18n/dictionaries.ts`** — imports the JSON translation files and exposes `getDictionary(locale)`, `translate(dictionary, namespace, key, vars?)` (dot-notation lookup with `{var}` interpolation), and `translateList(...)` (for string arrays, e.g. translated month names).
- **`lib/i18n/server.ts`** — `getServerLocale()` reads the `NEXT_LOCALE` cookie via `next/headers` in Server Components.
- **`lib/i18n/locale-provider.tsx`** — `LocaleProvider` + `useLocale()` client context. Switching locale writes the cookie and calls `router.refresh()`, so Server Components re-render with the new locale on the next request without a full client-side translation runtime.
- **`/locales/{en,de,it,hr}/{common,planner,pdf}.json`** — namespaced translation dictionaries. `common` covers nav/header/footer, `planner` covers the wizard, `pdf` covers PDF export structural labels.
- **`components/layout/language-switcher.tsx`** — the language selector, present in both the desktop header and the mobile menu.

Translated surfaces: site header, site footer, primary nav, the planner wizard's own headings/descriptions/hints/buttons/errors, and every structural label in the exported PDF (cover, section eyebrows/titles, summary facts, day labels, map legend, footer).

## 2. What stays English, and why

This is a deliberate boundary, not an oversight:

- **Generated itinerary content** — `trip_title`, day narratives, `selection_reasons`, restaurant picks, hidden gems, culture notes. The brief is explicit: "Generated itinerary data remains English for now. Only UI strings become multilingual."
- **Shared label maps in `lib/types.ts`** (`PLANNER_STYLE_LABELS`, `TRIP_PACE_LABELS`, `BUDGET_TIER_LABELS`, `ROUTE_VARIANT_LABELS`, `ITINERARY_FOCUS_LABELS`, `COUNTRIES`, `INTEREST_OPTIONS`) — these are consumed across the planner, the web itinerary view, and the PDF, and several of them double as inputs the AI prose layer reads to construct *English* sentences (e.g. `PLANNER_STYLE_LABELS[input.plannerStyle]` is interpolated directly into prompt context in `lib/ai/itinerary.ts`). Translating the label without translating what it feeds into would desynchronize the UI from the content it describes, so both sides of that boundary move together in a later phase, not independently now.
- **The web itinerary output (`itinerary-view.tsx`)** — the brief names only the PDF for structural-label translation (requirement #6) and only the wizard for question/label translation (requirement #5); the on-screen result view renders the same English-content fields named above and was left untouched to keep the scope boundary consistent across both output surfaces.
- **Minor brand microcopy** — the "The Balkanish AI Way" script tagline and similar one-off brand flourishes were left as-is; they're brand identity marks, not instructional UI text, and weren't in the brief's example list (Planner, Destinations, Day Trips, Food Finds, Culture Notes, Hidden Gems, Generate Itinerary).

The cookie + dictionary architecture already supports translating any of the above later — it's a content decision deferred to a future phase, not a missing capability.

## 3. Destination content strategy (future)

Today, `lib/data/destinations-mock.ts` holds a single English `Destination` record per place — `description`, `why_we_love_it`, gallery captions, etc. are all plain English strings. Two paths exist for making this language-aware, and neither requires re-architecting the i18n layer built in this phase:

**Option A — Parallel locale fields.** Extend `Destination`'s narrative fields to per-locale records, e.g. `description: Record<Locale, string>`, falling back to `description.en` wherever a translation hasn't been authored yet. Cheapest to query (no joins, no extra fetch), but bloats the mock/seed data file and means every new destination needs all four languages authored before it's "complete," with English-only as the permanent interim state.

**Option B — A separate translation table/lookup keyed by `(slug, locale, field)`.** Mirrors how the UI dictionaries in this phase are namespaced and looked up by key — `getDictionary(locale)` is already exactly this pattern, just for UI strings instead of destination content. This scales better once destination content is database-backed (Supabase) rather than a static mock file, since missing translations are just absent rows, not `undefined` fields scattered through a giant object literal.

Either way, the **lookup call site stays identical to what this phase already established**: a component asks for content "in the current locale," gets a string back, and silently falls back to English if the target-language version doesn't exist yet. The destination data model is the only thing that changes; `useLocale()`, `getDictionary()`, and `translate()` stay exactly as built. This phase deliberately did not pick A or B, since picking one is a data-modeling decision tied to whether/when destination narratives move into Supabase — out of scope for "infrastructure only."

## 4. AI-generated narrative compatibility (future)

The AI prose layer in `lib/ai/itinerary.ts` (`PROSE_SYSTEM_PROMPT`, `applyProse`) currently asks the model to narrate in English around a deterministic, data-grounded skeleton (`buildSkeleton`) — see `docs/planner-intelligence.md` for the full grounding/prose split. Extending this to EN/DE/IT/HR output requires no changes to the deterministic grounding module and no changes to the i18n architecture built in this phase — only two additions at the prose boundary:

1. **Locale-aware prompt selection.** `PROSE_SYSTEM_PROMPT` becomes one of four prompts (or one prompt parameterized with a `Respond in {language}.` instruction), selected by the same `Locale` value already flowing through `useLocale()` / `getServerLocale()`. The grounded skeleton's facts (place names, coordinates, drive times, scores) are never translated by the model — only the connective prose around them is, preserving the "AI narrates, never invents facts" guarantee from the grounding architecture.
2. **Locale threading into the generation call.** `generateItinerary`/`applyProse` would accept the request's `Locale` (already available wherever `PlannerInput` is constructed) and pass it through to prompt selection. No new field on `GeneratedItinerary` is needed structurally — the same English-shaped fields (`trip_title`, `overview`, day text, etc.) simply contain text in a different language when the locale isn't `en`.

What this phase already provides for that future work: the `Locale` type, the cookie-backed "current locale" signal available in both Server and Client Components, and a working precedent (`itinerary-pdf.tsx`'s `locale` prop, threaded from `planner-flow.tsx` through `generateItineraryPdfBlob()`) for passing a locale value from a UI surface into a content-generating function. The AI prose layer would follow the identical threading pattern, just with a prompt-language switch instead of a translation-dictionary lookup.

## 5. What does NOT change in this phase

- No machine translation was used or added as a dependency. Every string in `/locales/**/*.json` was hand-authored.
- No destination, itinerary, or restaurant/hidden-gem/culture-note content was translated.
- No Supabase schema changes, no auth changes, no payment changes.
- `lib/ai/itinerary.ts` and `lib/ai/grounding.ts` are untouched — the AI prose layer still narrates only in English today.

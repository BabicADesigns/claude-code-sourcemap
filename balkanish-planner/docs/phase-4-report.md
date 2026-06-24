# Phase 4 Implementation Report — Membership Foundation

Scope: transform BabicADesigns from a content experience into a member
platform — authentication, profiles, saved content, a personal dashboard,
AI Planner persistence, newsletter capture, an analytics foundation, and an
affiliate data foundation. All existing branding, layouts, editorial
styling, the six-metric scorecard, signature motifs, content blocks, and
mobile optimizations from Phases 1–3 are preserved untouched; nothing was
redesigned or removed. No payments were introduced.

Migrations `0003_destination_scores.sql` (Phase 3, already unapplied) and
the new `0004`–`0007` membership migrations below all remain **unapplied** —
`.env.local` has no real Supabase project, so every feature degrades
gracefully to its pre-membership behavior via `isSupabaseConfigured()` /
`isSupabaseAdminConfigured()` checks already established in the codebase.

## 1. Architecture summary

Membership is layered on top of the existing `@supabase/ssr` setup with no
new dependencies and no changes to routing, design tokens, or page
structure:

- **Auth** — `lib/supabase/server.ts` gained `getCurrentUser()`, a thin
  wrapper around `supabase.auth.getUser()` that returns `null` whenever
  Supabase isn't configured or no session exists. `app/layout.tsx` calls it
  once per request and passes a minimal `{ email } | null` shape down to
  `SiteHeader`, which conditionally renders Sign In vs. My Balkans/Account/
  Sign Out in both desktop and mobile nav. Sign-up/sign-in/sign-out all run
  client-side through `createSupabaseBrowserClient()` (`components/auth/
  auth-form.tsx`, `components/auth/sign-out-button.tsx`), matching the
  pattern already used elsewhere in the app.
- **Data/action layering** — every membership feature follows the
  established split: `lib/data/*.ts` (read, server-side, used by Server
  Components) and `lib/actions/*.ts` (`"use server"` mutations called
  directly from client components via manually-built `FormData`). New:
  `lib/data/profile.ts`, `lib/data/favorites.ts`, `lib/data/postcards.ts`,
  `lib/data/itineraries.ts`, and `lib/actions/profile.ts`,
  `lib/actions/favorites.ts`, `lib/actions/postcards.ts`,
  `lib/actions/itineraries.ts`, `lib/actions/newsletter.ts`.
- **Saved Content System** — one polymorphic `favorites` table (already in
  the base schema) keyed by `(user_id, entity_type, entity_id)`, extended to
  cover `secret_swap` in addition to the original three entity types. A
  single `SaveButton` client component (`components/save/save-button.tsx`)
  in `icon` (image overlay) and `pill` (plain background) variants is wired
  into every content card and detail page.
- **My Balkans Dashboard** (`/my-balkans`) fetches all saved entities in
  parallel, filters the existing mock-data lists by the saved-ID sets, and
  renders six sections via a shared `DashboardSection` empty-state wrapper.
  Saved itineraries and postcards get small dedicated client components
  (`saved-itineraries.tsx`, `saved-postcards.tsx`) so delete/reopen
  interactivity stays isolated from the server-rendered page, consistent
  with how `SaveButton` is isolated elsewhere.
- **AI Planner Persistence** — `ItineraryView` was extracted from
  `planner-flow.tsx` into its own component so the live planner result and
  the dashboard's "reopen" dialog share one rendering path instead of two
  copies. Save/delete/regenerate all route through the existing
  `generated_itineraries` table.
- **Newsletter** — `NewsletterSignup` ("Join the Hidden List") is a single
  reusable client component that tags every submission with a `sourcePage`
  string, calling the pre-existing `subscribeToNewsletter` action. No
  email-provider integration; this is capture only.
- **Analytics** — `lib/analytics.ts` exports a typed `track()` helper around
  `window.plausible`, which is a no-op on the server or whenever the script
  hasn't loaded. `PlausibleScript` (`components/analytics/plausible-script.tsx`)
  loads Plausible's tracker only when `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` is set,
  otherwise renders nothing. Because Plausible is fundamentally
  client-side, every tracking call lives in client code: `TrackView` (mount
  effect) for destination/food-find/culture-note page views, a
  `useEffect` keyed on the selected swap inside `SwapFinder` for secret-swap
  views, and direct `track()` calls inside `PostcardEditor` (on download),
  `PlannerFlow` (on generation), `SaveButton` (on save), and
  `NewsletterSignup` (on signup). The one Server Action that originally
  tried to call `track()` (`lib/actions/favorites.ts`) had that call removed
  — it would have always silently no-op'd server-side — and the equivalent
  tracking was relocated to `SaveButton`'s client-side handler.
- **Affiliate Foundation** — `hotels`, `tours`, `experiences`, and
  `restaurants` tables exist as schema only. RLS is enabled with no
  policies, so nothing but the service role can touch them; no UI reads
  from them yet.

## 2. Database changes (all unapplied)

| Migration | Purpose |
|---|---|
| `0004_membership_profile_fields.sql` | Adds `country`, `travel_style`, `favorite_region` to the existing `profiles` table. Additive only. |
| `0005_membership_favorites_and_itineraries.sql` | Extends `favorites_entity_type_check` to allow `'secret_swap'`. Adds owner-insert/owner-delete RLS policies on `generated_itineraries` (previously read-only via RLS). |
| `0006_newsletter_subscribers.sql` | New `newsletter_subscribers` table (`email` unique, `source_page`, optional `user_id`, `subscribed_at`/`unsubscribed_at`). RLS enabled with an insert-only policy — no select policy, so the list can't be enumerated via the anon key. |
| `0007_affiliate_schema.sql` | New `hotels`, `tours`, `experiences`, `restaurants` tables, each `destination_id`-indexed, `is_active` defaulted `false`. RLS enabled, zero policies (service-role only). |

`profiles`, `favorites`, `generated_itineraries`, and `postcards` themselves
were already part of the Phase-1 base schema (`0001_init_schema.sql`) —
Phase 4 only extends them.

## 3. New routes

| Route | Description |
|---|---|
| `/my-balkans` | Protected dashboard — saved Hidden Gems, Food Finds, Culture Notes, Secret Swaps, Postcards, and AI Itineraries. Redirects to `/sign-in` when signed out; shows a graceful message when Supabase isn't configured. |
| `/account` | *(pre-existing from an earlier segment of this phase)* — editable profile form. |

No other new top-level routes were added — membership features were
layered onto existing pages (cards, detail pages, the planner, postcards,
secret-swap) rather than creating new ones, per the "build on top of
current architecture" directive.

## 4. Mobile audit

No browser/screenshot tooling is available in this environment, so the
audit combined (a) live HTTP checks against a running dev server for every
new/changed route, confirming 200 responses and correct conditional
rendering (graceful Supabase-not-configured messaging on `/my-balkans` and
`/account`; `SiteHeader`'s signed-out state; all five `NewsletterSignup`
placements present in the rendered HTML; `PlausibleScript` correctly absent
with no domain configured), and (b) a structured code review of every new
or modified component's Tailwind classes against 390/430/768px viewports —
mobile-first base classes, `sm:`/`lg:` gating, flex-wrap on button rows,
and the codebase's established `min-h-11`/`h-11` 44px tap-target
convention.

**Result: no new mobile issues found.** Specifically checked: `/my-balkans`'s
section grids collapse to one column below `sm`; `DashboardSection`'s empty
state padding scales correctly; `SavedItineraries`' per-row button group
(`View`/`Regenerate`/`Delete`) wraps safely via `flex-wrap` on narrow
screens; `ItineraryView`'s day-detail and list-section grids are
`sm:grid-cols-2` gated; `NewsletterSignup`'s form is `flex-col` on mobile
and `sm:flex-row` above; `SiteHeader`'s mobile menu toggle and nav items
hit the existing 44px convention; the new Sign Out button inherits
whichever className context places it (header's existing tap-target
sizing in both desktop and mobile nav).

One pre-existing, out-of-scope observation carried over from before this
phase: `SaveButton`'s `icon` variant is 36×36px, below the 44px convention
used elsewhere — acceptable as a photo-overlay control given the card's
larger touch area, and unchanged by this phase.

## 5. Build validation

- `npx tsc --noEmit` — clean, no errors.
- `npx eslint .` — clean (one pre-existing unused-import warning in
  `sign-out-button.tsx` found and fixed during this pass).
- `npm run build` — all 38 routes compile and generate successfully,
  including the new `/my-balkans` route and every modified detail page.
- Supabase migrations `0003`–`0007` — confirmed unapplied; no real Supabase
  project is configured in `.env.local`, so every membership feature has
  been verified running in its graceful-degradation mode only.

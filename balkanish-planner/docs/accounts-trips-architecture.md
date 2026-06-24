# Accounts + Saved Trips Architecture — Phase 10

**Product:** Balkanish Planner
**Status:** Shipped. Authentication, profiles, saved trips (with rename), favorites, and a dedicated `/my-trips` dashboard are live. No payments, no subscriptions, no email automation, no AI expansion — all explicitly out of scope per the brief.

---

## 1. What was already in place (Phase 4)

Most of this phase's literal requirements were built during Phase 4's "membership foundation" and are reused as-is, not rebuilt:

- **Supabase Auth** — `lib/supabase/client.ts` (browser client), `lib/supabase/server.ts` (server client + `getCurrentUser()`), `lib/supabase/admin.ts` (service-role, server-only), `middleware.ts` (session-cookie refresh on every request).
- **Email + password sign up / sign in / sign out** — `app/sign-in/page.tsx`, `app/sign-up/page.tsx`, `components/auth/auth-form.tsx`, `components/auth/sign-out-button.tsx`.
- **Profiles extending `auth.users`** — `profiles` is keyed 1:1 on `auth.users.id`. There is deliberately no duplicate `public.users` table and no `email` column on `profiles`; email is always read from the Supabase Auth session via `getCurrentUser().email`.
- **`handle_new_user()` trigger** — fires `after insert on auth.users`, inserting a matching `profiles` row from `raw_user_meta_data`.
- **Saved trips** — `generated_itineraries` already stored the full planner input (`duration_days`, `month`, `budget`, `travel_style`, `interests`) and the full AI output (`itinerary_json`, containing `trip_title`, `days`, `hidden_gems`, `culture_notes`, `day_trips`, `map_points`). `lib/actions/itineraries.ts` already had `saveItinerary` / `deleteItinerary`; `lib/data/itineraries.ts` already had `getSavedItineraries()`.
- **Favorites** — a single polymorphic `favorites` table keyed on `(user_id, entity_type, entity_id)`, with `entity_type` already covering `destination`, `food_find`, `culture_note`, and `secret_swap`. `toggleFavorite()` and `getSavedEntityIds()` in `lib/actions/favorites.ts` / `lib/data/favorites.ts` are reused unchanged. ("Hidden Gems" is this app's brand name for the `destination` content type — favoriting a hidden gem and favoriting a destination are the same row.)
- **RLS** — every user-owned table already had owner-scoped `select`/`insert`/`delete` policies keyed on `auth.uid() = user_id`.
- **The "not signed in" prompt** — both `SaveButton` and the planner's `handleSaveItinerary()` already redirect to `/sign-in` on an auth error. This phase reuses that convention rather than introducing a second pattern.

## 2. What Phase 10 actually added

The gaps between the Phase 4 foundation and this phase's specific requirements:

- **`profiles.preferred_language`** (migration `0008`) — a `not null` column, default `'en'`, constrained to the four locales from Phase 9 (`en`/`de`/`it`/`hr`). Seeded at sign-up from the locale the visitor was browsing in (`components/auth/auth-form.tsx` passes `preferred_language: locale` into `supabase.auth.signUp`'s `options.data`; `handle_new_user()` reads it with a safe fallback to `'en'`), and editable afterward from a new "Preferred language" field on `/account` (`components/account/profile-form.tsx` → `lib/actions/profile.ts`). This is distinct from the `NEXT_LOCALE` cookie that drives the anonymous/logged-out UI locale — it's the language a known user has told us they prefer, ready for future per-user content (newsletters, AI narrative locale — see Phase 9's `docs/multilingual-architecture.md` §4) without re-deriving it from the cookie every time.
- **`generated_itineraries.title`** (migration `0008`) — a nullable user-chosen label, distinct from the AI-generated `itinerary_json.trip_title`. Display always resolves through one helper, `tripName(saved) => saved.title ?? saved.itinerary_json.trip_title`, defined once in `components/my-balkans/saved-itineraries.tsx` rather than scattered at each call site.
- **Owner-update RLS policy on `generated_itineraries`** (migration `0008`) — the table had owner select/insert/delete from Phases 4–5 but no update policy, which would have made renaming silently no-op under RLS for real users. Added `generated_itineraries are owner updatable`.
- **`renameItinerary(id, title)`** server action (`lib/actions/itineraries.ts`) — trims the input, stores `null` if empty (falling back to the AI title), and is owner-scoped via `.eq("user_id", user.id)` in addition to RLS.
- **Inline rename UI** — `components/my-balkans/saved-itineraries.tsx` now renders each trip's title as a click-to-edit field (pencil icon on hover, Enter to save, Escape to cancel) instead of static text, on both `/my-balkans` and the new `/my-trips`.
- **`/my-trips`** (`app/my-trips/page.tsx`) — a new protected route satisfying requirement #5's named dashboard directly, structured exactly as named in the brief: **Recent Trip** (the single most-recently-saved itinerary, highlighted), **All Trips** (the full saved-itinerary list, reusing `SavedItineraries`), and **Favorites** (saved Hidden Gems and Food Finds, reusing `DestinationCard` / `FoodFindCard` / `DashboardSection` from `/my-balkans` unmodified). It follows the identical protected-route shape as `/my-balkans` and `/account`: `isSupabaseConfigured()` early-return, `getCurrentUser()` + `redirect("/sign-in")`, parallel `Promise.all()` data fetching.

### Why `/my-balkans` was not renamed to `/my-trips`

`/my-balkans` already existed as the all-saved-content dashboard (Hidden Gems, Food Finds, Culture Notes, Secret Swaps, Postcards, AI Itineraries) across 13 files, including all four Phase 9 translation dictionaries. Renaming it would have meant touching i18n keys, `lib/nav.ts`, every `revalidatePath` call site, and the printable itinerary view, for a route the brief never asked to be removed. Instead, `/my-trips` is a new, narrower, purpose-built page scoped to exactly what requirement #5 names — recent trips, saved trips, favorites — while `/my-balkans` remains the broader "everything you've saved" hub, linked alongside it in the header.

## 3. Social login readiness (documented, not built)

The brief asks to "prepare architecture for future social login," not to ship OAuth buttons. No UI work was done because none is required to make this true:

- `app/auth/callback/route.ts` already exchanges an OAuth `code` for a session via `supabase.auth.exchangeCodeForSession(code)` — it does not branch on provider, so it works unmodified for Google, GitHub, or any other provider Supabase Auth supports.
- `createSupabaseBrowserClient()` already returns a real `@supabase/ssr` client, so adding a button is a matter of calling `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: ".../auth/callback" } })` from `components/auth/auth-form.tsx` — no new files, no schema change, no new RLS policy.
- `handle_new_user()` already populates `profiles` from `raw_user_meta_data` regardless of how the row in `auth.users` was created, so a social sign-up produces a normal profile row through the exact same trigger.

Turning this on is a future, scoped task: enable a provider in the Supabase dashboard, add a button that calls `signInWithOAuth`. Nothing in this phase's schema or server code needs to change first.

## 4. Future readiness

None of the following are built. Each one is a future, additive phase — listed here so the data model and code already accommodate them without a rewrite:

- **Shared / public itineraries.** `postcards.is_public` (Phase 4) is the existing precedent for a user-owned row being selectively visible to others: a boolean flag plus a public-read RLS policy alongside the owner-only policies. `generated_itineraries` would gain the same `is_public boolean default false` column and a matching `select` policy (`using (is_public or auth.uid() = user_id)`) — no change to `itinerary_json`'s shape, no change to `SavedItineraries` beyond a share toggle.
- **Collaborative planning.** Would need a join table (e.g. `itinerary_collaborators(itinerary_id, user_id, role)`) and an RLS policy extending `generated_itineraries`' owner check to `auth.uid() = user_id or auth.uid() in (select user_id from itinerary_collaborators where itinerary_id = id)`. The single-owner model today doesn't block this; it's additive.
- **PDF delivery (email).** `lib/pdf/generate-itinerary-pdf.tsx`'s `generateItineraryPdfBlob()` already returns a `Blob` rather than triggering a download directly — `planner-flow.tsx`'s Print button is one consumer of that blob today. An email-delivery feature would be a second consumer: pass the same blob to an email provider as an attachment. No PDF-generation code changes.
- **Subscriptions / premium.** `profiles` has no premium flag yet, but `generated_itineraries.is_premium_export` (Phase 5) already exists as a precedent for gating a feature per-row rather than per-user. A `profiles.is_premium boolean default false` column plus a check in the relevant server actions is the expected shape when billing is introduced — explicitly not part of this phase, per the brief ("No payments. No Stripe. No subscriptions.").
- **Per-user language for generated content.** `profiles.preferred_language`, added this phase, is the field a future AI-narrative localization feature (Phase 9 §4) would read to select a prompt language for a signed-in user's planner runs, instead of relying solely on the anonymous `NEXT_LOCALE` cookie.

## 5. What does NOT change in this phase

- No Stripe, no payment fields, no subscription tables or columns.
- No newsletter automation changes — `newsletter_subscribers` (Phase 4) is untouched.
- No AI prompt, grounding, or prose changes — `lib/ai/itinerary.ts` and `lib/ai/grounding.ts` are untouched.
- No OAuth provider was enabled or wired into the UI — see §3.
- All Phase 1–9 migrations, columns, and policies are untouched; migration `0008` is additive-only.

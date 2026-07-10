# Phase 25 — Architecture Debt

Audit date: 2026-07-07

Items here are not bugs. They are known limitations, design tradeoffs, or accumulating technical debt that should inform future development decisions.

---

## AD-01 — AI Planner grounding never reads from Supabase

**Location:** `lib/ai/grounding.ts`

The grounding module imports `mockDestinations`, `mockDayTrips`, `mockFoodFinds`, and `mockCultureNotes` statically. Destinations added to the production Supabase database (including promoted AI discoveries) are not visible to the planner.

**Why it exists:** The grounding module is synchronous and runs inside an async planner flow. Making it async to read from Supabase was deferred for simplicity.

**Impact:** Editors who promote a discovered destination in the admin UI will not see it appear in future planner outputs until the mock dataset is manually updated and redeployed.

**Resolution path:** Convert `buildGroundedItinerary` to async; fetch destinations from DB with mock fallback; add caching layer (ISR or edge cache) to avoid latency.

---

## AD-02 — Anonymous itinerary rows have no TTL or cleanup

**Location:** `app/api/planner/route.ts:43`, `supabase/migrations/0002_rls_policies.sql`

Anonymous rows (null `user_id`) accumulate in `generated_itineraries` indefinitely. They are not user-accessible (RLS blocks them) but consume database space and count toward Supabase row limits.

**Resolution path:** Add a Supabase scheduled function or pg_cron job to delete anonymous rows older than 30 days.

---

## AD-03 — Admin routes have no auth guard when Supabase is not configured

**Location:** `app/admin/*/page.tsx` (logistics, cultural, partners, community, discoveries)

When `!isSupabaseConfigured()`, admin pages render demo data without any authentication check. This is acceptable in development but creates a risk in misconfigured production deployments.

**Resolution path:** Add a minimal guard in the `!isSupabaseConfigured()` branch that returns a plain "admin unavailable" page instead of the full panel.

---

## AD-04 — Matchmaker quiz results are not persisted

**Location:** `components/matchmaker/quiz-flow.tsx`

Quiz results exist only in React state. A user who completes the quiz and navigates away loses their result. There is no `matchmaker_results` table or server action.

**Resolution path:** On quiz completion, call a server action to save `{ destination_slug, quiz_answers }` to a `matchmaker_results` table (or add as a column to `profiles`). Wire into travel memory signals (source: `QUIZ_RESULT` is already in the allowlist).

---

## AD-05 — Silent AI fallback gives no user feedback

**Location:** `lib/ai/itinerary.ts:fetchProse`

When OpenAI fails (API error, rate limit, timeout), the planner returns a deterministic skeleton silently. The user sees a valid-looking itinerary but without AI narrative.

**Resolution path:** Return a `ai_prose_applied: boolean` flag in the itinerary JSON. Surface a subtle "Generated without AI prose — basic itinerary shown" indicator in `ItineraryView`.

---

## AD-06 — Guide detail page not implemented

**Location:** `app/guides/page.tsx`, `GuideCard` component

The premium guides listing renders `GuideCard` components but there is no `/guides/[slug]` detail page. Clicking a guide card has no destination route.

**Resolution path:** Build `app/guides/[slug]/page.tsx` with `getPremiumGuideBySlug`. Add purchase/access gate if guides are premium-only.

---

## AD-07 — No navigation prompt after saving an itinerary

**Location:** `lib/actions/itineraries.ts:saveItinerary`, `components/planner/itinerary-view.tsx`

After `saveItinerary` succeeds, the user stays on the planner page with no link or toast guiding them to My Trips. New users may not discover the companion/today/reflection flow.

**Resolution path:** Return `{ tripId }` from `saveItinerary` and use it to show a "View in My Trips →" link or navigate automatically.

---

## AD-08 — PDF images are placeholder-only

**Location:** `lib/pdf/`, picsum.photos references

All PDF cover and destination images use `picsum.photos` placeholder URLs. These images are not branded and change on every regeneration (different seed = different image).

**Resolution path:** Implement Supabase Storage uploads for destination images. Update `hero_image_url` and `gallery_image_urls` with real photography. PDF rendering picks up real images automatically.

---

## AD-09 — No breadcrumb or flow indicator across companion→today→reflection

**Location:** `app/trips/[tripId]/*/page.tsx`

The three trip sub-pages (companion, today, reflection) link to each other only via isolated "← My Trips" links. There is no visual indication that these three views form a sequential journey arc.

**Resolution path:** Add a trip lifecycle progress bar or step indicator component shared across the three pages.

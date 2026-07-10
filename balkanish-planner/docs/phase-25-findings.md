# Phase 25 — Findings Register

Audit date: 2026-07-07  
Branch: `claude/balkanish-planner-platform-9a0ks4`  
Auditor: Claude Code (Phase 25 — Full Product, Architecture & End-to-End Reality Audit)

---

## Severity Definitions

| Level | Meaning |
|-------|---------|
| CRITICAL | Data exposure, cost bleed, or security breach possible without further conditions |
| HIGH | Reachable failure in a production scenario; blocks real user journeys or creates material risk |
| MEDIUM | Functional gap or policy weakness that degrades experience or safety but requires additional conditions to trigger |
| LOW | Architecture debt, UX gap, silent failure, or missing guardrail that is low-risk today but accumulates |

---

## CRITICAL Findings

### P25-C01 — Planner API has no authentication or rate limiting

**File:** `app/api/planner/route.ts:11`  
**Status:** FIXED (see fix log below)

The `POST /api/planner` route calls OpenAI `gpt-4o-mini` (paid API) for every request. Authentication is optional: `user = isSupabaseConfigured() ? await getCurrentUser() : null`. When Supabase is configured (i.e., in any real deployment), the route still proceeds with `user = null` and calls OpenAI without gating. No rate limiting, IP throttling, or abuse prevention exists.

**Failure scenario:** An unauthenticated actor sends a loop of POST requests to `/api/planner`. Every request triggers three `generateItinerary` calls (conservative/balanced/explorer), each making one OpenAI completion request. 1,000 requests × 3 calls = 3,000 paid OpenAI completions with no defence.

**Fix:** When Supabase is configured, require an authenticated user before calling OpenAI. Unauthenticated requests return 401. This preserves the "no Supabase = local dev demo mode" contract while closing the production attack surface.

---

## HIGH Findings

### P25-H01 — Admin routes serve content to unauthenticated requests when Supabase is not configured

**Files:** `app/admin/logistics/page.tsx:12`, `app/admin/cultural/page.tsx:13`, `app/admin/partners/page.tsx:13`  
**Status:** DOCUMENTED (acceptable in dev; document for production checklist)

All five admin pages (`/admin/discoveries`, `/admin/logistics`, `/admin/cultural`, `/admin/community`, `/admin/partners`) check `isEditorEmail(user.email)` server-side — but only after calling `getCurrentUser()`. The `!isSupabaseConfigured()` early-return branch renders the page content (with mock data) without any auth check.

**Failure scenario:** In a misconfigured production deployment where Supabase env vars are absent or temporarily unset, the admin pages become publicly accessible. Demo data is clearly labelled, but the admin UI and moderation controls would be visible to any visitor.

**Mitigation already in place:** All mock data is labelled `demo_only: true`. No real customer data is involved. Admin routes are not linked from public navigation.

**Recommended action:** Add a guard at the top of the `!isSupabaseConfigured()` branch in admin pages that returns a minimal "admin unavailable" response without rendering the panel content. Tracked in `phase-25-architecture-debt.md`.

---

## MEDIUM Findings

### P25-M01 — Community note submission has no spam/abuse protection

**File:** `lib/actions/community-notes.ts:submitCommunityNote`  
**Status:** DOCUMENTED

Any visitor can submit community notes (min 10, max 500 chars) without authentication. The only defence is editorial moderation before approval. No captcha, IP rate limiting, or session requirement exists.

**Failure scenario:** An automated script submits thousands of notes per hour. All land in `pending` status but consume DB space and require human moderation time to clear.

**Note:** This is intentional by design (public participation). The risk is operational (moderation overhead), not a data breach. Tracking as MEDIUM given no mitigation beyond moderation exists.

---

### P25-M02 — Planner AI fallback is silent

**File:** `lib/ai/itinerary.ts:544`  
**Status:** DOCUMENTED

When `isOpenAIConfigured()` returns false, the planner generates a deterministic skeleton without AI prose and returns it silently. The UI shows a valid itinerary, but all day/slot text is template-level only (destination names, food find names, no narrative). No indicator tells the user they received a degraded result.

**Failure scenario:** `OPENAI_API_KEY` is unset or expired in production. Every planner generation silently returns a bare skeleton. Users see itineraries but without the prose that makes the product distinctive.

---

### P25-M03 — Matchmaker quiz results are not persisted

**File:** `app/matchmaker/page.tsx`, `components/matchmaker/quiz-flow.tsx`  
**Status:** DOCUMENTED

The matchmaker quiz computes a destination match entirely client-side. No result is saved to `favorites`, `profiles`, or any other table. A user who completes the quiz and navigates away loses their result permanently.

**Failure scenario:** A user takes the quiz on mobile, taps a link to the matched destination, then hits back. They land on the matchmaker landing page, not their result. The quiz must be retaken.

---

### P25-M04 — Anonymous itinerary rows accumulate without cleanup

**File:** `app/api/planner/route.ts:43`, `supabase/migrations/0002_rls_policies.sql`  
**Status:** DOCUMENTED

The planner API inserts anonymous rows (null `user_id`) into `generated_itineraries` for analytics logging. The SELECT RLS policy requires `auth.uid() = user_id`, so anonymous rows are only readable via the admin client. No TTL, archival, or cleanup mechanism exists for these rows.

**Failure scenario:** After months of production traffic, the `generated_itineraries` table grows significantly with unowned rows that cannot be queried by users and have no delete pathway.

---

## LOW Findings

### P25-L01 — `private_note` field in trip_reflections is protected by RLS but not redacted at the application layer

**File:** `supabase/migrations/0021_phase24_post_trip_reflection.sql`  
**Status:** DOCUMENTED

The `private_note` column stores free-text reflection notes. It is never returned in public API responses or shared surfaces. However, it is returned by Supabase queries without any application-layer stripping — any code path that does `SELECT *` on `trip_reflections` will include `private_note` in the result object. The reflection page server component receives the full row.

**Current protection:** The page server component passes `existingReflection` (which includes `private_note`) only to `<PostTripReflection>`. That component is the user's own UI. Private notes are never logged, never sent to analytics, never shared.

**Risk:** If a future developer adds a "share my reflection" feature without auditing the passed prop, `private_note` could leak. Low risk today; worth noting for future work.

---

### P25-L02 — Engagement signals table allows unlimited anonymous inserts

**File:** `supabase/migrations/0013_phase16_community_intelligence.sql`  
**Status:** DOCUMENTED, BY DESIGN

The `engagement_signals` table has a policy `"engagement_signals can be inserted by anyone"`. The server action (`lib/actions/engagement.ts`) uses the admin client for inserts. This is correct for anonymous analytics. But the table policy itself allows inserts by any authenticated session too, meaning the DB policy alone doesn't restrict volume.

**Risk:** Signals are stored but not currently read to affect public rankings (documented in the server action). Low risk today.

---

### P25-L03 — Itinerary generation logs three OpenAI calls per planner submission

**File:** `lib/ai/itinerary.ts:generateItineraryVariants`  
**Status:** DOCUMENTED

Each `/api/planner` request calls `generateItinerary` three times in parallel (conservative, balanced, explorer). All three make independent OpenAI completion requests. This is 3× the cost of a single-variant approach.

**Note:** This is intentional product design (variant selection). No bug. Listed as LOW for cost awareness in production planning.

---

## Fix Log

| ID | Finding | Status | Commit |
|----|---------|--------|--------|
| P25-C01 | Planner API auth gate | Fixed | (see validation section) |
| P25-H01 | Admin no-supabase auth | Documented | — |
| P25-M01 | Community note spam | Documented | — |
| P25-M02 | Silent AI fallback | Documented | — |
| P25-M03 | Matchmaker persistence | Documented | — |
| P25-M04 | Anonymous row accumulation | Documented | — |
| P25-L01 | private_note redaction | Documented | — |
| P25-L02 | Engagement signal volume | Documented | — |
| P25-L03 | 3× OpenAI calls per request | Documented | — |

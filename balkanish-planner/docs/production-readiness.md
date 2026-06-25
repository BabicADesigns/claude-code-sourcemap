# Production Readiness — Data Layer

**Product:** Balkanish Planner
**Version:** 1.0 — Phase 13, Production Data Layer
**Scope:** This phase connects the platform to a real Supabase project (Auth, Database, Storage) and makes the connection observable and safe to operate. It does not touch payments, subscriptions, or Stripe — none exist in this codebase, and none were added.

Every prior phase built this app to run convincingly on mock data while a real Supabase project sat unconnected. That "safe fallback" architecture (`isSupabaseConfigured()` guards on every read/write) is the reason this phase could focus entirely on *making the real connection trustworthy* rather than retrofitting basic functionality. This document is the operator's guide to that connection: what's wired, what's guarded, what to check before deploying, and what to do if something breaks.

---

## 1. Supabase Project Integration

Auth, Database, and Storage all go through the same three environment variables:

| Variable | Used by | Exposed to browser |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `lib/supabase/client.ts`, `server.ts`, `admin.ts`, `middleware.ts` | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `lib/supabase/client.ts`, `server.ts`, `middleware.ts` | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | `lib/supabase/admin.ts` only | No — server-only |

- **Auth** — `lib/supabase/client.ts` (browser client, used by `components/auth/auth-form.tsx`), `lib/supabase/server.ts` (server client + `getCurrentUser()`), `middleware.ts` (refreshes the session cookie on every request), and `app/auth/callback/route.ts` (OAuth/magic-link code exchange). All four read the same two `NEXT_PUBLIC_*` variables — there is one Supabase project, not separate auth/data configs.
- **Database** — every table read goes through `lib/data/*.ts`, every write through `lib/actions/*.ts` (`"use server"` actions) or `app/api/planner/route.ts`. None of these construct their own client; they all call `createSupabaseServerClient()` / `createSupabaseAdminClient()`.
- **Storage** — `lib/supabase/storage.ts` (new this phase, §4) wraps the four buckets created in migration `0010`. No existing page uploads to them yet (architecture only, per the brief) — see §4 for what's wired versus reserved.
- **Removed placeholder assumptions** — there were none to remove. No part of the app hardcoded a fake Supabase URL, a stub client, or a "demo mode" branch; the only placeholder behavior was already the safe-fallback pattern below, which is the correct production behavior for a misconfigured or not-yet-provisioned environment, not a prototype shortcut to delete.
- **Safe fallbacks kept, by design** — `isSupabaseConfigured()` (anon-key check) and `isSupabaseAdminConfigured()` (service-role check) gate every Supabase call. When unset:
  - Data reads (`lib/data/*.ts`) return the matching mock data from `lib/data/*-mock.ts`.
  - Data writes (`lib/actions/*.ts`) return `{ error: "Accounts aren't connected yet." }` (or a page-specific variant) instead of throwing.
  - `components/auth/auth-form.tsx` renders an explanatory message instead of a broken sign-in form.
  - The anonymous itinerary-logging insert in `app/api/planner/route.ts` is skipped entirely — the AI Planner still returns itineraries with no Supabase project at all.

  This means the app is always in one of exactly two states — fully mock-data demo mode, or fully live — never a half-connected state where some pages work and others 500.

## 2. Database Audit

Ten migrations, applied in order:

| # | File | Adds |
|---|---|---|
| 0001 | `0001_init_schema.sql` | Core schema: `profiles`, `destinations`, `food_finds`, `culture_notes`, `secret_swaps`, `premium_guides`, `saved_trips`, `generated_itineraries`, `postcards`, `favorites`; `handle_new_user()` trigger; `set_updated_at()` trigger |
| 0002 | `0002_rls_policies.sql` | RLS enabled + policies for every 0001 table (§3) |
| 0003 | `0003_destination_scores.sql` | `destinations`: 4 more score columns (slow_living, food, story, sunset) |
| 0004 | `0004_membership_profile_fields.sql` | `profiles`: `country`, `travel_style`, `favorite_region` |
| 0005 | `0005_membership_favorites_and_itineraries.sql` | `favorites`: `secret_swap` entity type; `generated_itineraries`: owner insert/delete policies |
| 0006 | `0006_newsletter_subscribers.sql` | `newsletter_subscribers` table + insert-only policy |
| 0007 | `0007_affiliate_schema.sql` | `hotels`, `tours`, `experiences`, `restaurants` — RLS enabled, no policies (service-role-only, reserved for a future phase) |
| 0008 | `0008_phase10_accounts_trips.sql` | `profiles.preferred_language`; `generated_itineraries.title` + owner-update policy; `handle_new_user()` updated to seed `preferred_language` |
| 0009 | `0009_phase13_schema_alignment.sql` | **Schema-parity fix — see below.** `destinations`: `travel_types`, `latitude`, `longitude`, `hero_image`, `gallery_images`. `food_finds`/`culture_notes`: `hero_image` |
| 0010 | `0010_phase13_storage_buckets.sql` | Storage buckets + policies (§4) |

Migrations must run in this numeric order — `0008` adds a column `0009` doesn't touch, `0009`'s new columns are read by `0010`'s comment context only (no FK relationship), and Supabase's own migration runner (`supabase db push` / the SQL editor run in order) already enforces filename-lexical ordering, so no separate ordering tool is needed as long as filenames keep their zero-padded numeric prefix.

**Audit finding — schema/type parity gap (fixed by 0009):** `lib/types.ts`'s `Destination`, `FoodFind`, and `CultureNote` interfaces have required `travel_types`, `latitude`, `longitude`, `hero_image`, and `gallery_images` fields since Phase 4/6/12 respectively. No migration ever added the matching columns — `docs/image-direction-v2.md` documents this as a known, accepted gap because Supabase had never been connected, so a real query selecting `*` would have returned rows silently missing those fields the moment a real connection was made. Migration `0009` closes the gap additively (new nullable/defaulted columns; nothing existing is altered or dropped). As defense in depth, `lib/media/normalize.ts` was hardened in the same change to synthesize a placeholder `ImageAsset` from the legacy `hero_image_url`/`gallery_image_urls` columns (or a deterministic `picsum.photos` URL as a last resort) for any row where the new `hero_image`/`gallery_images` columns are still null — so even a database that's behind on migrations degrades to a placeholder image instead of a thrown exception.

**Audit finding — `saved_trips` is schema-only.** The table and its full RLS policy set have existed since `0001`/`0002`, but no file under `lib/data/`, `lib/actions/`, or `app/` reads or writes it — `generated_itineraries` is the table actually used for "My Trips" (`/my-trips`, `/my-balkans`). `saved_trips` was superseded by the richer `generated_itineraries` model before this phase and is kept as-is (reserved schema, not dead weight to drop) per the brief's "future media tables" framing — removing a table is a destructive, hard-to-reverse operation that wasn't asked for here.

**Audit finding — `hotels`/`tours`/`experiences`/`restaurants` (0007) and `newsletter_subscribers` (0006) are write-only or unread from the app today.** Both are documented in their own migration files as intentionally reserved for future phases (affiliate monetization, email provider integration). No code change was needed; this is confirmed-intentional, not a gap.

## 3. Row Level Security Audit

Every table has RLS **enabled**. Policy coverage, table by table:

| Table | Public read | Owner read | Owner write | Notes |
|---|---|---|---|---|
| `profiles` | No | Yes (`auth.uid() = id`) | Update only, self | No self-insert policy — rows are created exclusively by the `handle_new_user()` trigger (`security definer`), so a user can never create a profile for another `id` |
| `destinations`, `food_finds`, `culture_notes`, `secret_swaps` | Yes (all rows) | — | No (service role only) | Editorial content; writes are a content-ops task done via the dashboard/service role, not end-user actions |
| `premium_guides` | Yes, `is_published = true` only | — | No | Unpublished drafts are invisible to anon/authenticated roles |
| `saved_trips` | No | Yes | Insert/update/delete, self | Schema-only — see §2 |
| `generated_itineraries` | No | Yes | Insert/update/delete, self | `user_id` is nullable — anonymous AI Planner inserts (no `user_id`) are written exclusively via `createSupabaseAdminClient()` from `app/api/planner/route.ts`, which uses the service role and bypasses RLS entirely; no policy grants anon/authenticated insert with a null `user_id`, so this path cannot be reached from the browser |
| `postcards` | Partial — `is_public = true` rows only | Yes (own, public or not) | Insert/update/delete, self | |
| `favorites` | No | Yes | Insert/delete, self (no update — a favorite is toggled, not edited) | |
| `newsletter_subscribers` | No | No select policy at all | Insert only, open to anon | Deliberate: no select policy means only the service role can list subscriber emails, preventing enumeration via the anon key even though inserts are public |
| `hotels`, `tours`, `experiences`, `restaurants` | No | — | No | RLS enabled, zero policies — service-role-only by construction, reserved for a future affiliate-monetization phase |

**Verification method:** read every `create policy` statement across all ten migrations and cross-referenced each one against the `user_id`/`auth.uid()` predicate and the table's RLS-enabled status. Every table that holds user-specific data (`profiles`, `saved_trips`, `generated_itineraries`, `postcards`, `favorites`) scopes both its read and write policies to `auth.uid()` — there is no table where one user can read or modify another user's profile, itinerary, favorite, or trip. This was not re-verified against a live database in this phase (no live Supabase project was connected to test against); it is a static read of the policy SQL, which is the full source of truth for RLS since Supabase has no separate policy configuration outside these `create policy` statements.

## 4. Storage Architecture

Four buckets, created in `0010_phase13_storage_buckets.sql`, covering the four needs in the brief:

| Bucket | Public | Ownership model | Purpose |
|---|---|---|---|
| `destination-images` | Yes | Service-role write | Editorial hero images for destinations |
| `gallery-images` | Yes | Service-role write | Editorial gallery images for destination detail pages |
| `itinerary-pdfs` | No | `${userId}/...` path prefix | Future generated trip PDF exports, one user's own trips only |
| `user-uploads` | No | `${userId}/...` path prefix | Reserved for future user-submitted media (e.g. postcard photos) |

- **Public buckets** follow the same "RLS enabled, no write policy = service-role-only" convention as the `hotels`/`tours`/`experiences`/`restaurants` tables (0007) — anyone can read, only the service role can write, so editorial image management stays a content-ops task done outside the app, exactly like the editorial database tables it sits beside.
- **Private buckets** use a path-prefix ownership convention, `(storage.foldername(name))[1] = auth.uid()::text`, mirroring how every user-scoped *table* in this schema already scopes rows by a `user_id` column — here the "row" is a file path instead of a column, so a user can only read, write, or delete objects under their own `${userId}/` folder.
- **`lib/supabase/storage.ts`** wraps both models: `getPublicAssetUrl()` for the two public buckets, `uploadOwnerAsset()` / `getOwnerAssetSignedUrl()` for the two private ones (signed URLs, not public links, since the bucket itself is private).
- **Architecture only, as scoped.** No existing picsum.photos placeholder image was migrated into `destination-images`/`gallery-images` — `hero_image_url` keeps pointing wherever it already points, whether that's picsum or a real bucket object, once content-ops uploads real photography. No PDF export currently writes to `itinerary-pdfs`, and no upload UI currently writes to `user-uploads` — both buckets and their policies exist and are ready, but nothing calls `uploadOwnerAsset()` yet. Wiring either is additive: write the file, store the returned path, no schema or policy change needed.

## 5. Environment Validation

`lib/env.ts` provides a synchronous, network-free check of every environment variable the app reads, callable from anywhere (server components, API routes, scripts):

```ts
export type SupabaseEnvStatus = "not_configured" | "misconfigured" | "configured";
```

- **`not_configured`** — both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are unset. This is the supported mock-data mode, not an error.
- **`misconfigured`** — exactly one of the two is set, or the URL fails `new URL(...)` parsing. This is always a mistake (a typo, a half-pasted `.env`) and is reported as such.
- **`configured`** — both look structurally valid. This deliberately does **not** mean "connected" — `lib/env.ts` makes no network call, so a `configured` project with a revoked key or a deleted project still reports `configured` here. Live reachability is a separate, async concern (next bullet).

`instrumentation.ts` (new this phase) runs once when the Next.js server process starts and calls `getEnvironmentReport()`:

- `not_configured` → a console warning (expected in local/demo mode, not an error).
- `misconfigured` → a console error listing exactly which variable is missing/invalid.
- `configured` → an async `fetch` to the project's `/auth/v1/health` endpoint (a 5-second timeout via `AbortSignal.timeout`), logging whether Supabase actually answered. This is the one place in the app that does a real "is Supabase connected" check, separate from the per-request shape check above.
- Also flags a missing `SUPABASE_SERVICE_ROLE_KEY` (admin features silently disabled) and a missing `OPENAI_API_KEY` (AI Planner falls back to deterministic generation) as warnings, not failures — both are optional dependencies with documented fallback behavior, not requirements.

No silent failures: every one of these three states produces a log line at startup, and every Supabase call site downstream either short-circuits via `isSupabaseConfigured()`/`isSupabaseAdminConfigured()` (returning a typed fallback) or throws a clear, named error (`createSupabaseServerClient()`/`createSupabaseAdminClient()` throw "Supabase is not configured — set ..." if called despite the guard being skipped).

## 6. Seed Strategy

| Environment | Source | Workflow |
|---|---|---|
| **Local development** | `supabase/seed.sql` | Run automatically by `supabase db reset` (or manually via `supabase db execute -f supabase/seed.sql` against a local Supabase instance). Mirrors `lib/data/*-mock.ts` field-for-field, including the Phase 13 `travel_types`/`latitude`/`longitude` backfill, so the app renders identically whether `NEXT_PUBLIC_SUPABASE_URL` points at this local instance or is unset entirely (mock-data fallback). **Never** run this against staging or production — it's development sample content, not real editorial copy, and the `on conflict do nothing` / fixed-slug inserts in it are written for a clean local database, not for merging into live data. |
| **Staging** | Hand-curated, via the Supabase dashboard or a one-off authenticated script using `createSupabaseAdminClient()` | Staging should hold a *small, deliberately curated* subset of real editorial content (a handful of real destinations/food finds/culture notes), entered by content ops the same way production content will be — not a bulk copy of `seed.sql`. The goal is testing the real authoring workflow (including image upload to `destination-images`/`gallery-images`, §4) end-to-end before it's used on production. |
| **Production** | Content ops, via the Supabase dashboard (table editor) or a future internal authoring tool | No seed script targets production, intentionally — every production row should be a deliberate editorial decision (a real destination worth recommending, real photography, a real score), not a scripted insert. `generated_itineraries`/`favorites`/`postcards`/`profiles` need no seeding at all; they're created by real user activity from day one. |

Local and staging/production diverge on purpose: local needs to *look* like production for development and screenshots, so it's scripted and disposable; staging and production need to *be* curated editorial content, so they're hand-entered and permanent. Promoting a destination from a draft/AI-discovered candidate to a real published row already has a documented human-review step — see `docs/ai-discovery-architecture.md`'s Stage 3 promotion flow — and that's the same path staging/production content should go through, never a direct SQL seed.

## 7. Error Handling

Every failure mode the brief asks about, and where it's caught:

| Failure | Caught at | User sees | Logged as |
|---|---|---|---|
| Auth: sign-in/sign-up rejected | `components/auth/auth-form.tsx` (`error.message` from `supabase.auth.*`) | Inline form error | Not logged server-side — already in front of the user, client-side only |
| Auth: OAuth/magic-link callback fails | `app/auth/callback/route.ts` | Redirected to `/sign-in?error=auth_callback_failed`, which renders "That sign-in link didn't work — it may have expired. Please sign in again." | `logError("auth.callback.exchangeCodeForSession", error)` |
| Auth: Supabase not configured | `components/auth/auth-form.tsx` (`isSupabaseConfigured()` guard) | "Accounts aren't connected yet" explainer, no broken form | Not an error — expected state |
| Database: read fails (any `lib/data/*.ts`) | Per-function `if (error) logError(...)` before falling back | Mock/empty data — page renders normally, never a 500 | `logError("data.<module>.<function>", error, { ...context })` |
| Database: write fails (any `lib/actions/*.ts`) | Per-action `if (error) logError(...)` before returning | `{ error: "Couldn't save/delete/rename ... Please try again." }`, rendered by the calling form/button | `logError("actions.<module>.<function>", error, { userId, ...context })` |
| Database: anonymous itinerary log insert fails | `app/api/planner/route.ts` | Nothing — itinerary is still returned; this insert is best-effort logging, not user-facing data | `logError("api.planner.logGeneratedItinerary", error)` |
| AI Planner: generation throws | `app/api/planner/route.ts` | `502` JSON `{ error: "Could not generate an itinerary. Please try again." }` | `logError("api.planner.generate", error, { durationDays })` |
| Storage: upload/signed-URL failure | `lib/supabase/storage.ts` (`uploadOwnerAsset`/`getOwnerAssetSignedUrl`) | `{ error: string }` / `null` return value — caller decides the UI | Not yet logged — no call site exists yet (§4); the next caller that's added should wrap its result in the same `logError` pattern as the actions above |
| Rendering/data error in any page or layout | `app/error.tsx` | Branded "We hit a snag putting this page together" screen with a Try Again button; header/footer chrome stays visible | `logError("app.error-boundary", error, { digest })` |
| Rendering error in the root layout itself | `app/global-error.tsx` | Minimal standalone fallback page (own `<html>`/`<body>`, can't rely on the root layout's chrome) | `logError("app.global-error-boundary", error, { digest })` |

The consistent shape across every layer: **catch close to the failure, never throw past a guarded boundary, always log before falling back, never block on a best-effort write.** No call site swallows an error without at least a `logError` call — the anonymous-itinerary-insert in `app/api/planner/route.ts` was found mid-phase to be doing exactly that (discarding `{ error }` from the insert with no destructuring at all) and was fixed as part of this audit.

## 8. Monitoring Readiness

`lib/monitoring/logger.ts` is a thin, dependency-free logging seam:

```ts
logError(scope: string, error: unknown, context?: LogContext): void
logWarning(scope: string, message: string, context?: LogContext): void
logEvent(scope: string, event: string, context?: LogContext): void
```

Every call site uses a `"<layer>.<file>.<function>"` scope string (e.g. `"actions.itineraries.saveItinerary"`, `"instrumentation.startup"`) so log lines are greppable by layer and by exact call site without parsing free-text messages. Today this is `console.error`/`console.warn`/`console.log` only — per the brief, no external service (Sentry, PostHog, Datadog, etc.) is wired up, and none is required for this phase.

This is the deliberate swap point for that future work:

- **Error logging** — swap `logError`'s body for a Sentry (or similar) `captureException` call; every existing call site already passes a real `Error`/`unknown` plus structured context, so no call site needs to change, only the function body.
- **Performance monitoring** — `instrumentation.ts`'s `register()` hook is also where Next.js expects OpenTelemetry/APM SDK initialization to happen (per Next.js's own instrumentation convention); this phase uses the hook for the environment check (§5) and the same hook is where a tracer would be initialized later.
- **Analytics** — `logEvent` exists alongside `logError`/`logWarning` precisely so product-analytics events (not just errors) have a home in the same module once needed, separate from the already-built Plausible pageview/event tracking (`components/analytics/plausible-script.tsx`, Phase 4) which covers client-side pageviews today.

## 9. Deployment Checklist

Before pointing a deployment at a real Supabase project:

1. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (from the Supabase project's API settings) in the hosting platform's environment variables.
2. Set `SUPABASE_SERVICE_ROLE_KEY` as a **server-only** secret (never `NEXT_PUBLIC_*`) — required for the anonymous-itinerary-logging insert in `app/api/planner/route.ts`; everything else degrades gracefully without it.
3. Set `NEXT_PUBLIC_SITE_URL` to the real production origin — used for `metadataBase` (OpenGraph/Twitter absolute URLs) and as the fallback Supabase auth redirect origin.
4. Set `OPENAI_API_KEY` if AI-generated (rather than deterministic fallback) itineraries are wanted in this environment.
5. Run every migration in `supabase/migrations/` in numeric order against the target project (see §10).
6. Confirm the four storage buckets from `0010` exist (`supabase db push` creates them; verify in the dashboard if the migration was applied via the SQL editor instead).
7. Deploy, then check the server startup logs for the `instrumentation.startup` lines (§5) — confirm `"Supabase is reachable."` appears, and there are no `misconfigured` or unexpected-warning lines.
8. Smoke-test: sign up, save a favorite, generate and save an itinerary, sign out, sign back in. Each of these exercises a different RLS policy (§3) — a passing run is a live confirmation that policies match what was audited statically.
9. **No payments/subscriptions/Stripe step exists here, intentionally** — none of that exists in this codebase, per the Phase 13 brief's explicit scope boundary.

## 10. Migration Checklist

1. Always apply migrations **in filename order** (`0001` → `0010`); Supabase's tooling does this automatically, but a manual SQL-editor run must respect it too, since later files assume earlier columns/tables/types exist.
2. Every migration in this codebase so far is **additive** (new tables/columns/policies; nothing dropped or renamed) — this is a deliberate convention, not an accident, because it means migrations can be re-applied to a database that's only partially caught up without a destructive step in between. Keep this convention for future migrations unless a specific destructive change is explicitly required and reviewed.
3. Before applying a new migration to staging/production: read it fully, confirm it has no `drop`/`alter ... drop column`/`truncate` unless that's the explicit intent, and confirm any new RLS-enabled table has the policies it needs *in the same migration* — `0007`'s tables show that "RLS enabled, no policy yet" is a valid and sometimes intentional end state (service-role-only), but it should be a decision, not an oversight.
4. After applying: spot-check `select * from pg_policies where schemaname = 'public'` (or the dashboard's Policies view) against §3 of this document for any new/changed table.
5. Keep `supabase/seed.sql` in sync with `lib/data/*-mock.ts` field-for-field when either changes — they're meant to render identical content (§6) and drift between them defeats the point of local dev mirroring mock-data mode.

## 11. Backup Strategy

This phase does not stand up new backup infrastructure — Supabase's managed Postgres already provides automatic daily backups (and point-in-time recovery on paid plans) with no additional configuration required from this codebase. What this phase establishes is what to back up and why:

- **Database** — every table in §2 is covered by Supabase's project-level backups automatically; no table opts out.
- **Storage** — the two public buckets (`destination-images`, `gallery-images`) hold curated editorial assets that should also exist in whatever source repository or DAM content ops uses to prepare them — treat the bucket as the *serving* copy, not the only copy, so a bucket-level incident doesn't mean re-shooting photography. The two private buckets (`itinerary-pdfs`, `user-uploads`) hold regenerable or user-resubmittable content (a PDF can always be re-rendered from `generated_itineraries.itinerary_json`; a user can always re-upload) — lower backup priority than the database itself.
- **Environment variables/secrets** — `SUPABASE_SERVICE_ROLE_KEY` and `OPENAI_API_KEY` are not stored anywhere in this repository (see `.env.example` — every value is blank) and must be retained separately, in the hosting platform's secret manager, by whoever provisions them. Losing the service-role key requires a Supabase dashboard regeneration, not a restore.

## 12. Rollback Strategy

- **Application code** — standard for this repository's workflow: revert the merge commit / redeploy the previous build. No database state is coupled to a specific app version in a way that would make an app-only rollback unsafe, because every schema change so far is additive (§10) — an older app build simply doesn't read the newer columns it doesn't know about.
- **A migration that turns out to be wrong** — because every migration so far is additive, the safe rollback is almost always a new additive migration that undoes the effect (e.g. drop the specific column/policy that was wrong) rather than trying to "revert" a file that may have already been applied to a database with rows depending on it. Write the undo as its own numbered migration; do not edit or delete an already-applied migration file.
- **A bad RLS policy change** — `drop policy "<name>" on public.<table>;` followed by re-creating the previous, correct policy, as its own migration. Because policies are independent objects (not baked into table structure), this is always a low-risk, fast rollback.
- **A bad seed/content change in staging or production** — content entered through the dashboard (§6) has no migration to roll back; rely on Supabase's point-in-time recovery (or a manual re-entry, for the small/curated volumes described in §6) rather than a code-level rollback.
- **Storage bucket policy change** — same pattern as RLS: `drop policy`, re-create the previous version, as a new migration. Bucket *creation* (`insert into storage.buckets`) is never rolled back by deleting a bucket that may already hold real objects; if a bucket was created in error, leave it empty and unused rather than risking data loss in a delete.

---

## What This Phase Did Not Touch

Per the brief's explicit scope: no payments, subscriptions, or Stripe integration of any kind. No mass upload of placeholder images into the new storage buckets (architecture only, as asked — §4). No live Supabase project was actually provisioned or connected during this phase (no credentials were available in this environment); every claim above about RLS coverage and the auth/database/storage wiring is a static audit of the migration SQL and the client code, not a live integration test against a running project — §9's deployment checklist's smoke-test step is what closes that gap once real credentials exist. No external monitoring service (Sentry, PostHog, Datadog) was integrated — `lib/monitoring/logger.ts` is the prepared seam, not the integration itself (§8).

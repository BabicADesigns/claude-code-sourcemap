# Phase 25 — Deployment Readiness

Audit date: 2026-07-07

---

## Required Environment Variables

| Variable | Required for | Default | Notes |
|----------|-------------|---------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | All authenticated features | — | Without: demo mode |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Auth + RLS-scoped reads | — | Without: demo mode |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin client (memory, PDFs, engagement) | — | Without: admin features disabled |
| `OPENAI_API_KEY` | Itinerary AI prose, discovery | — | Without: deterministic skeleton only |
| `EDITOR_EMAILS` | Admin route authorization | — | Without: no one can access admin routes |
| `NEXT_PUBLIC_SITE_URL` | Email links, canonical URLs | — | Recommended for production |
| `EMAIL_FROM` | PDF email delivery | — | Optional; email feature disabled if absent |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | SMTP email delivery | — | Optional; email feature disabled if absent |
| `PLAUSIBLE_DOMAIN` | Analytics | — | Optional; analytics disabled if absent |

---

## Supabase Migrations

All 21 migrations must be run in order against the production Supabase project:

```
0001_init_schema.sql
0002_rls_policies.sql
0003_destination_scores.sql
0004_membership_profile_fields.sql
0005_membership_favorites_and_itineraries.sql
0006_newsletter_subscribers.sql
0007_affiliate_schema.sql
0008_phase10_accounts_trips.sql
0009_phase13_schema_alignment.sql
0010_phase13_storage_buckets.sql
0011_phase14_pdf_delivery.sql
0012_phase15_ai_expansion_engine.sql
0013_phase16_community_intelligence.sql
0014_phase17_personalization.sql
0015_phase18_local_partners.sql
0016_phase19_logistics.sql
0017_phase20_cultural_intelligence.sql
0018_phase21_travel_memory.sql
0019_phase22_trip_readiness.sql
0020_phase23_live_trip.sql
0021_phase24_post_trip_reflection.sql
```

All migrations are `IF NOT EXISTS` — safe to re-run if needed.

---

## Supabase Storage Buckets

Migration 0010 creates bucket definitions. The actual storage buckets must be created in the Supabase dashboard:
- `itinerary-pdfs` (private, 10MB max)
- `destination-guides` (private, 10MB max)
- `user-uploads` (private, 5MB max)

---

## Security Checklist

- [x] RLS enabled on all 26 tables
- [x] Admin client (service-role) only used server-side
- [x] `"server-only"` import in `lib/data/travel-memory.ts` (prevents client-side import)
- [x] Editor authorization via `EDITOR_EMAILS` env var (server-side check)
- [x] Planner API requires auth when Supabase is configured (P25-C01 fix)
- [x] Private note field never exposed in public API responses
- [x] Memory domains blocked list enforced at write time
- [x] Memory signal source allowlist enforced at write time
- [ ] Community note submission has no rate limiting (P25-M01 — documented, operational risk only)
- [ ] Anonymous itinerary row cleanup not implemented (P25-M04)

---

## Feature Flags by Environment

| Feature | Supabase absent | Supabase present, no OpenAI | Fully configured |
|---------|----------------|---------------------------|-----------------|
| Editorial browse | Mock data | Live data | Live data |
| AI Planner (generation) | Returns 401* | Deterministic skeleton | AI prose + skeleton |
| AI Planner (save) | Error message | Works | Works |
| Trip Companion | Disabled message | Works | Works |
| Live Trip | Disabled message | Works | Works |
| Post-Trip Reflection | Disabled message | Works | Works |
| Travel Memory | Disabled message | Works | Works |
| PDF generation | Disabled | Works (no email) | Works |
| Admin routes | Demo data (no auth) | Protected | Protected |

*After P25-C01 fix: when Supabase is configured, planner requires auth.

---

## Admin Route Access in Production

Admin routes (`/admin/*`) are protected by `isEditorEmail(user.email)` server-side. The `EDITOR_EMAILS` env var must be set to a comma-separated list of authorized editor email addresses. Without it, `isEditorEmail` returns false for all users and admin routes are inaccessible.

**Known gap (P25-H01):** If `NEXT_PUBLIC_SUPABASE_URL` is unset in production, the `!isSupabaseConfigured()` branch runs, rendering demo data without auth. Mitigation: ensure env vars are always present in production deployments.

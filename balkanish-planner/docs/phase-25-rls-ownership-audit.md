# Phase 25 — RLS & Ownership Audit

Audit date: 2026-07-07

---

## RLS Coverage Matrix

| Table | SELECT | INSERT | UPDATE | DELETE | Client | Notes |
|-------|--------|--------|--------|--------|--------|-------|
| `profiles` | owner only | — | owner only | — | user | 0002 |
| `destinations` | public | admin only | admin only | admin only | user/admin | 0002 |
| `food_finds` | public | admin only | admin only | admin only | user/admin | 0002 |
| `culture_notes` | public | admin only | admin only | admin only | user/admin | 0002 |
| `secret_swaps` | public | admin only | admin only | admin only | user/admin | 0002 |
| `premium_guides` | published only | admin only | admin only | admin only | user/admin | 0002 |
| `saved_trips` | owner only | owner only | owner only | owner only | user | 0002 |
| `generated_itineraries` | owner only | owner only | owner only | owner only | user/admin | 0002, 0005, 0008 |
| `postcards` | owner or public | owner only | owner only | owner only | user | 0002 |
| `favorites` | owner only | owner only | — | owner only | user | 0002 |
| `newsletter_subscribers` | — | anyone | — | — | admin | 0006 |
| `community_notes` | approved public | admin only | admin only | — | admin | 0013 |
| `engagement_signals` | — | anyone | — | — | admin | 0013 |
| `discovered_destinations` | public | admin only | admin only | — | admin | 0012 |
| `local_partners` | public active | admin only | admin only | — | admin | 0015 |
| `logistics_connections` | public active | admin only | admin only | — | admin | 0016 |
| `cultural_insights` | public approved | admin only | admin only | — | admin | 0017 |
| `founder_notes` | public active | admin only | admin only | — | admin | 0017 |
| `local_phrases` | public active | admin only | admin only | — | admin | 0017 |
| `travel_memory_signals` | owner only | owner only | owner only | owner only | admin | 0018 |
| `trip_readiness_items` | owner only | owner only | owner only | owner only | user | 0019 |
| `live_trip_item_states` | owner only | owner only | owner only | owner only | user | 0020 |
| `trip_reflections` | owner only | owner only | owner only | owner only | user | 0021 |
| `trip_reflection_items` | owner only | owner only | owner only | owner only | user | 0021 |
| `trip_learning_candidates` | owner only | owner only | owner only | owner only | user | 0021 |
| `pdf_documents` | owner only | admin only | admin only | — | admin | 0011 |
| `pdf_deliveries` | owner only | admin only | — | — | admin | 0011 |

---

## Key Observations

### Ownership enforcement at the data layer

All user-owned data is double-locked:
1. **RLS policy:** `USING (auth.uid() = user_id)` — enforced by the database
2. **Application layer:** `getSavedItineraryById(user.id, tripId)` — adds `.eq("user_id", user.id)` to every query

The application-layer redundancy means even if RLS were inadvertently disabled (e.g., a misconfigured table), the data layer would still scope reads to the owner.

### Admin client usage

The following operations legitimately bypass RLS via the admin (service-role) client:
- `travel_memory_signals` writes (`recordTravelMemorySignal`)
- `pdf_documents` and `pdf_deliveries` writes (PDF delivery actions)
- `engagement_signals` inserts (analytics)
- `community_notes` inserts (public submission) and updates (moderation)
- `discovered_destinations` updates (moderation/promotion)
- `newsletter_subscribers` upserts

Admin client access is gated by `isSupabaseAdminConfigured()` (checks `SUPABASE_SERVICE_ROLE_KEY` env var). The admin client is created in `lib/supabase/admin.ts` and is only instantiated server-side.

### `travel_memory_signals` — admin client only

This table uses the admin client exclusively (marked `"server-only"` at the import). This is intentional: the memory system must be manipulation-resistant — users cannot directly write to it. All writes go through `recordTravelMemorySignal`, which enforces:
- `BLOCKED_MEMORY_DOMAINS` hard rejection
- `ALLOWED_MEMORY_SIGNAL_SOURCES` allowlist
- Rejection cooldown logic
- Strength/confidence computation

### `postcards` — semi-public SELECT

The postcards SELECT policy allows `is_public = true OR auth.uid() = user_id`. Public postcards are intentionally world-readable. The `is_public` flag defaults to `false` in the mock data.

### `generated_itineraries` — anonymous rows

The API route writes rows with `user_id = null` via the admin client. RLS SELECT policy (`auth.uid() = user_id`) does not match null, so anonymous rows are unreadable by authenticated users and invisible to RLS. They exist only for analytics. No user can access or delete them via the app.

---

## Migration Gaps

### 0014_phase17_personalization.sql — No new tables, no RLS needed

This migration only adds columns to `profiles` (which already has RLS) and `destinations` (same). No new RLS needed.

### No other RLS gaps found

Every table created across all 21 migrations has RLS enabled and at least a SELECT policy.

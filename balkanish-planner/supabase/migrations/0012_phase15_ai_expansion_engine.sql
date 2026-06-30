-- Phase 15 — AI Expansion Engine.
--
-- discovered_destinations is the shared, deduplicated registry behind Layer B (AI discovery,
-- docs/ai-discovery-architecture.md). Every place lib/ai/discovery.ts proposes — after passing
-- the deterministic structural check in lib/ai/verification.ts — is upserted here, keyed by
-- `normalized_key` (a slugified "name|region|country"), so the same real place suggested across
-- many itinerary requests (by the same user or different ones) accumulates into one row instead
-- of creating duplicates. This is what makes a human review workflow possible at all: an editor
-- reviews one row, not one row per itinerary.
--
-- moderation_status is intentionally a different axis from verification_status:
--   * verification_status (text, copied from the per-itinerary candidate) is an automated,
--     structural/geographic plausibility check, computed once per suggestion.
--   * moderation_status here is a human, editorial decision — pending until an editor acts,
--     then approved/rejected — and persists across every future itinerary that proposes the
--     same place again. Editors are gated by the EDITOR_EMAILS allow-list (lib/actions/
--     discovered-destinations.ts), not a database role, matching the codebase's existing
--     env-var-driven feature-gating convention (no admin/role system exists anywhere else).
--
-- promoted_destination_id is set once an editor uses the one-action "convert to Official
-- Destination" workflow (requirement #6) — see promoteDiscoveredDestination, which inserts a
-- full row into the existing public.destinations table using neutral 5.0 default scores and the
-- same picsum.photos + "Unassigned" placeholder-image pattern lib/media/normalize.ts already uses
-- for legacy/missing photography. Promotion is one-way; nothing here ever auto-promotes itself.
--
-- This table follows the "editorial content" RLS shape from 0002_rls_policies.sql (destinations,
-- food_finds, culture_notes): public read, no insert/update/delete policy, so only the
-- RLS-bypassing service-role client (lib/supabase/admin.ts) can write. There's no single owning
-- user to check against — every planner request, anonymous or signed-in, can reinforce the same
-- shared row — so the owner-RLS pattern used by favorites/saved_trips doesn't apply here.

create table public.discovered_destinations (
  id uuid primary key default gen_random_uuid(),
  normalized_key text not null unique,
  name text not null,
  region text not null,
  country text not null,
  latitude numeric(9, 6) not null,
  longitude numeric(9, 6) not null,
  source text not null default 'ai_suggested' check (source in ('curated', 'ai_suggested')),
  confidence_score numeric(3, 2) not null check (confidence_score between 0 and 1),
  verification_status text not null check (verification_status in ('unverified', 'structurally_checked', 'rejected')),
  rationale text not null,
  matched_focus text[] not null default '{}',
  moderation_status text not null default 'pending' check (moderation_status in ('pending', 'approved', 'rejected')),
  times_suggested integer not null default 1,
  times_saved integer not null default 0,
  promoted_destination_id uuid references public.destinations (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index discovered_destinations_moderation_idx on public.discovered_destinations (moderation_status);
create index discovered_destinations_promoted_idx on public.discovered_destinations (promoted_destination_id);

create trigger discovered_destinations_set_updated_at before update on public.discovered_destinations
  for each row execute procedure public.set_updated_at();

alter table public.discovered_destinations enable row level security;

create policy "discovered_destinations are publicly readable" on public.discovered_destinations
  for select using (true);

-- ---------------------------------------------------------------------------
-- favorites — extend entity_type to allow favoriting a discovered destination
-- (requirement #8, Future Learning Layer: saved discoveries are a ranking signal
-- alongside times_saved on the registry row itself, incremented by
-- incrementDiscoveredDestinationSaves in lib/data/discovered-destinations.ts).
-- ---------------------------------------------------------------------------
alter table public.favorites
  drop constraint favorites_entity_type_check;
alter table public.favorites
  add constraint favorites_entity_type_check
  check (entity_type in ('destination', 'food_find', 'culture_note', 'secret_swap', 'discovered_destination'));

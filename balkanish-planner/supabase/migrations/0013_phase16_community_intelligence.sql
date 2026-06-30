-- Phase 16 — Community Intelligence & Founder's Picks.
--
-- This migration is entirely additive: no existing tables, columns, constraints, or policies
-- are modified. All new tables follow the established patterns from prior migrations:
--   * uuid primary key via gen_random_uuid()
--   * timestamptz created_at / updated_at (updated_at via the set_updated_at() trigger)
--   * RLS enabled; public read, service-role-only write (same as destinations, food_finds, etc.)
--   * text check constraints for enum-like columns rather than a Postgres ENUM type
--     (avoids the ALTER TYPE migration risk when new values are added later)
--
-- founders — editorial identity object behind FoundersPicks. Multiple founders supported.
-- founders_picks — destination-linked personal recommendation from a founder. Human-authored only.
-- community_notes — user-submitted travel tips, pending moderation by default.
-- local_heroes — editorial character study of a real local. Not a business directory.
-- balkanish_stories — multilingual cultural narratives (jsonb title/body/excerpt).
-- engagement_signals — raw ranking signals; never exposed as scores or rankings yet.

-- ---------------------------------------------------------------------------
-- founders
-- ---------------------------------------------------------------------------
create table public.founders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  bio text not null,
  signature text,
  photo jsonb,
  social_links jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger founders_set_updated_at before update on public.founders
  for each row execute procedure public.set_updated_at();

alter table public.founders enable row level security;

create policy "founders are publicly readable" on public.founders
  for select using (true);

-- ---------------------------------------------------------------------------
-- founders_picks
-- ---------------------------------------------------------------------------
create table public.founders_picks (
  id uuid primary key default gen_random_uuid(),
  destination_slug text not null,
  founder_id uuid not null references public.founders (id) on delete cascade,
  title text not null,
  body text not null,
  portrait jsonb,
  signature_override text,
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index founders_picks_destination_idx on public.founders_picks (destination_slug);
create index founders_picks_founder_idx on public.founders_picks (founder_id);

create trigger founders_picks_set_updated_at before update on public.founders_picks
  for each row execute procedure public.set_updated_at();

alter table public.founders_picks enable row level security;

create policy "founders_picks are publicly readable" on public.founders_picks
  for select using (true);

-- ---------------------------------------------------------------------------
-- community_notes
-- ---------------------------------------------------------------------------
create table public.community_notes (
  id uuid primary key default gen_random_uuid(),
  destination_slug text not null,
  content text not null,
  category text not null check (category in ('sunset_spot', 'parking', 'coffee', 'local_etiquette', 'seasonal', 'food_tip', 'transport', 'other')),
  author_name text,
  language text not null default 'en' check (language in ('en', 'de', 'it', 'hr')),
  moderation_status text not null default 'pending' check (moderation_status in ('pending', 'approved', 'rejected')),
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index community_notes_destination_idx on public.community_notes (destination_slug);
create index community_notes_moderation_idx on public.community_notes (moderation_status);
create index community_notes_category_idx on public.community_notes (category);

create trigger community_notes_set_updated_at before update on public.community_notes
  for each row execute procedure public.set_updated_at();

alter table public.community_notes enable row level security;

-- Only approved notes are readable by the public.
create policy "approved community_notes are publicly readable" on public.community_notes
  for select using (moderation_status = 'approved');

-- Anyone (including anonymous users) may submit a community note; it lands in pending.
create policy "community_notes can be inserted by anyone" on public.community_notes
  for insert with check (moderation_status = 'pending');

-- ---------------------------------------------------------------------------
-- local_heroes
-- ---------------------------------------------------------------------------
create table public.local_heroes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  profession text not null,
  story text not null,
  photo jsonb,
  destination_slug text not null,
  website text,
  social_links jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index local_heroes_destination_idx on public.local_heroes (destination_slug);

create trigger local_heroes_set_updated_at before update on public.local_heroes
  for each row execute procedure public.set_updated_at();

alter table public.local_heroes enable row level security;

create policy "local_heroes are publicly readable" on public.local_heroes
  for select using (true);

-- ---------------------------------------------------------------------------
-- balkanish_stories
-- ---------------------------------------------------------------------------
create table public.balkanish_stories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title jsonb not null,
  body jsonb not null,
  excerpt jsonb,
  category text not null check (category in ('coffee_culture', 'traditions', 'island_life', 'local_customs', 'food_rituals', 'festivals')),
  hero_image jsonb,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index balkanish_stories_category_idx on public.balkanish_stories (category);

create trigger balkanish_stories_set_updated_at before update on public.balkanish_stories
  for each row execute procedure public.set_updated_at();

alter table public.balkanish_stories enable row level security;

create policy "balkanish_stories are publicly readable" on public.balkanish_stories
  for select using (true);

-- ---------------------------------------------------------------------------
-- engagement_signals — ranking foundation (requirement #7).
-- Data collected now; rankings NOT exposed to end users in this phase.
-- user_id is nullable — anonymous views are valid signals.
-- ---------------------------------------------------------------------------
create table public.engagement_signals (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('destination', 'food_find', 'culture_note', 'secret_swap', 'discovered_destination', 'story', 'local_hero', 'founders_pick')),
  entity_id text not null,
  signal_type text not null check (signal_type in ('view', 'like', 'bookmark', 'planner_usage', 'community_confirmation')),
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index engagement_signals_entity_idx on public.engagement_signals (entity_type, entity_id);
create index engagement_signals_signal_type_idx on public.engagement_signals (signal_type);
create index engagement_signals_user_idx on public.engagement_signals (user_id) where user_id is not null;

alter table public.engagement_signals enable row level security;

-- Anyone may insert a signal (anonymous signals have null user_id).
create policy "engagement_signals can be inserted by anyone" on public.engagement_signals
  for insert with check (true);

-- Signals are never read back to end users directly — only aggregated server-side.

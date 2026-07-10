-- Phase 19: Trip Logistics & Getting Around Engine
-- Adds logistics_connections table and transport_preferences column to profiles.
-- All demo fixtures are inserted with active = false, demo_only = true and must
-- never surface in production itinerary guidance.

-- ─── logistics_connections ─────────────────────────────────────────────────────
create table if not exists logistics_connections (
  id                       text primary key,
  from_destination_slug    text not null,
  to_destination_slug      text not null,
  primary_mode             text not null,
  alternative_modes        text[] default '{}',
  road_distance_km         numeric,
  drive_time_estimate      text,
  transit_time_estimate    text,
  -- practicality is stored as a jsonb object { rating, reason, confidence }
  practicality             jsonb not null,
  editorial_note           text,
  ferry_info               jsonb,
  border_info              jsonb,
  camper_info              jsonb,
  sources                  jsonb default '[]',
  active                   boolean not null default false,
  demo_only                boolean not null default true,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- Index for fast slug-pair lookup during itinerary generation
create index if not exists idx_logistics_connections_from_to
  on logistics_connections (from_destination_slug, to_destination_slug);

-- ─── RLS ───────────────────────────────────────────────────────────────────────
alter table logistics_connections enable row level security;

-- Anyone can read active, non-demo connections (logistics guidance is public content)
create policy "logistics_connections_select_active"
  on logistics_connections for select
  using (active = true and demo_only = false);

-- Service-role / admin writes bypass RLS via service role key
create policy "logistics_connections_admin_all"
  on logistics_connections for all
  using (auth.role() = 'service_role');

-- ─── transport_preferences on profiles ────────────────────────────────────────
alter table profiles
  add column if not exists transport_preferences text[] default '{}';

-- ─── updated_at trigger ────────────────────────────────────────────────────────
create or replace function update_logistics_connections_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists logistics_connections_updated_at on logistics_connections;
create trigger logistics_connections_updated_at
  before update on logistics_connections
  for each row execute function update_logistics_connections_updated_at();

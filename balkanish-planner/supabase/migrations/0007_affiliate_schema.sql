-- Phase 4 — Affiliate Foundation: data architecture only. No affiliate
-- links, no monetization UI, nothing in the app reads from these tables
-- yet — this is schema reserved for a future phase.

create table public.hotels (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid references public.destinations (id) on delete set null,
  name text not null,
  description text,
  partner_url text,
  price_range text,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.tours (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid references public.destinations (id) on delete set null,
  name text not null,
  description text,
  partner_url text,
  price_range text,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.experiences (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid references public.destinations (id) on delete set null,
  name text not null,
  description text,
  partner_url text,
  price_range text,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid references public.destinations (id) on delete set null,
  food_find_id uuid references public.food_finds (id) on delete set null,
  name text not null,
  description text,
  partner_url text,
  price_range text,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create index hotels_destination_idx on public.hotels (destination_id);
create index tours_destination_idx on public.tours (destination_id);
create index experiences_destination_idx on public.experiences (destination_id);
create index restaurants_destination_idx on public.restaurants (destination_id);

-- Locked down by default: RLS is enabled with no policies, so only the
-- service role can read or write until a future phase defines access.
alter table public.hotels enable row level security;
alter table public.tours enable row level security;
alter table public.experiences enable row level security;
alter table public.restaurants enable row level security;

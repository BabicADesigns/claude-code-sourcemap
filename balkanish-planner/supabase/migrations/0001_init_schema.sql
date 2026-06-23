-- Balkanish Planner — initial schema
-- Note: Supabase Auth already provides `auth.users`. We deliberately do not
-- create a duplicate `public.users` table (anti-pattern); instead `profiles`
-- extends `auth.users` 1:1, which is the standard Supabase approach.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- enums
-- ---------------------------------------------------------------------------
create type destination_category as enum (
  'island_secrets',
  'quiet_escapes',
  'romantic_spots',
  'nature',
  'family_friendly',
  'local_favorites'
);

create type travel_style as enum (
  'slow_and_soulful',
  'food_and_wine',
  'active_outdoors',
  'culture_and_history',
  'romantic_getaway',
  'family_friendly'
);

-- ---------------------------------------------------------------------------
-- profiles (extends auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  is_premium boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- destinations
-- ---------------------------------------------------------------------------
create table public.destinations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  region text not null,
  country text not null default 'Croatia',
  category destination_category not null,
  summary text not null,
  description text not null,
  why_we_love_it text not null,
  best_season text not null,
  local_score numeric(3, 1) not null check (local_score between 0 and 10),
  crowd_score numeric(3, 1) not null check (crowd_score between 0 and 10),
  hero_image_url text,
  gallery_image_urls text[] not null default '{}',
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index destinations_category_idx on public.destinations (category);
create index destinations_featured_idx on public.destinations (is_featured);

-- ---------------------------------------------------------------------------
-- food_finds
-- ---------------------------------------------------------------------------
create table public.food_finds (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  region text not null,
  story text not null,
  history text not null,
  drink_pairing text not null,
  where_to_try text not null,
  hero_image_url text,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index food_finds_region_idx on public.food_finds (region);

-- ---------------------------------------------------------------------------
-- culture_notes
-- ---------------------------------------------------------------------------
create table public.culture_notes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null,
  body text not null,
  hero_image_url text,
  region text,
  is_featured boolean not null default false,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- secret_swaps
-- ---------------------------------------------------------------------------
create table public.secret_swaps (
  id uuid primary key default gen_random_uuid(),
  famous_name text not null,
  famous_region text not null,
  famous_image_url text,
  alternative_destination_id uuid not null references public.destinations (id) on delete cascade,
  why_text text not null,
  comparison_points jsonb not null default '[]', -- [{ "label": "Crowds", "famous": "...", "alternative": "..." }]
  created_at timestamptz not null default now()
);

create unique index secret_swaps_famous_alt_idx
  on public.secret_swaps (famous_name, alternative_destination_id);

-- ---------------------------------------------------------------------------
-- premium_guides
-- ---------------------------------------------------------------------------
create table public.premium_guides (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  cover_image_url text,
  price_eur numeric(6, 2) not null default 14.99,
  pdf_url text,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- saved_trips
-- ---------------------------------------------------------------------------
create table public.saved_trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  destination_ids uuid[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index saved_trips_user_idx on public.saved_trips (user_id);

-- ---------------------------------------------------------------------------
-- generated_itineraries (AI Planner output)
-- ---------------------------------------------------------------------------
create table public.generated_itineraries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  duration_days int not null check (duration_days between 1 and 30),
  month text not null,
  budget text not null,
  travel_style travel_style not null,
  interests text[] not null default '{}',
  itinerary_json jsonb not null, -- { days: [{ day, title, gems, restaurants, culture, packing }] }
  pdf_url text,
  is_premium_export boolean not null default false,
  created_at timestamptz not null default now()
);

create index generated_itineraries_user_idx on public.generated_itineraries (user_id);

-- ---------------------------------------------------------------------------
-- postcards
-- ---------------------------------------------------------------------------
create table public.postcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  destination_name text not null,
  mood text not null,
  quote text not null,
  image_url text,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create index postcards_public_idx on public.postcards (is_public);

-- ---------------------------------------------------------------------------
-- favorites (polymorphic: destination | food_find | culture_note)
-- ---------------------------------------------------------------------------
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entity_type text not null check (entity_type in ('destination', 'food_find', 'culture_note')),
  entity_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, entity_type, entity_id)
);

create index favorites_user_idx on public.favorites (user_id);

-- ---------------------------------------------------------------------------
-- updated_at helper trigger
-- ---------------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger destinations_set_updated_at before update on public.destinations
  for each row execute procedure public.set_updated_at();
create trigger food_finds_set_updated_at before update on public.food_finds
  for each row execute procedure public.set_updated_at();
create trigger saved_trips_set_updated_at before update on public.saved_trips
  for each row execute procedure public.set_updated_at();
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();

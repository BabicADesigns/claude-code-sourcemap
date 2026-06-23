-- Row Level Security: public editorial content is readable by everyone,
-- user-owned content (trips, itineraries, postcards, favorites, profile) is
-- only readable/writable by its owner.

alter table public.profiles enable row level security;
alter table public.destinations enable row level security;
alter table public.food_finds enable row level security;
alter table public.culture_notes enable row level security;
alter table public.secret_swaps enable row level security;
alter table public.premium_guides enable row level security;
alter table public.saved_trips enable row level security;
alter table public.generated_itineraries enable row level security;
alter table public.postcards enable row level security;
alter table public.favorites enable row level security;

-- profiles: a user can read/update only their own profile
create policy "profiles are self-readable" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles are self-updatable" on public.profiles
  for update using (auth.uid() = id);

-- editorial content: public read, writes restricted to service role only
create policy "destinations are publicly readable" on public.destinations
  for select using (true);
create policy "food_finds are publicly readable" on public.food_finds
  for select using (true);
create policy "culture_notes are publicly readable" on public.culture_notes
  for select using (true);
create policy "secret_swaps are publicly readable" on public.secret_swaps
  for select using (true);
create policy "published premium_guides are publicly readable" on public.premium_guides
  for select using (is_published = true);

-- saved_trips: owner only
create policy "saved_trips are owner readable" on public.saved_trips
  for select using (auth.uid() = user_id);
create policy "saved_trips are owner writable" on public.saved_trips
  for insert with check (auth.uid() = user_id);
create policy "saved_trips are owner updatable" on public.saved_trips
  for update using (auth.uid() = user_id);
create policy "saved_trips are owner deletable" on public.saved_trips
  for delete using (auth.uid() = user_id);

-- generated_itineraries: owner only, but allow anonymous inserts with null user_id
-- (the AI Planner can be used without an account; anonymous rows are written
-- via the service role from the API route, never directly from the client)
create policy "generated_itineraries are owner readable" on public.generated_itineraries
  for select using (auth.uid() = user_id);

-- postcards: owner can manage their own; anyone can read public postcards
create policy "public postcards are readable by anyone" on public.postcards
  for select using (is_public = true or auth.uid() = user_id);
create policy "postcards are owner writable" on public.postcards
  for insert with check (auth.uid() = user_id);
create policy "postcards are owner updatable" on public.postcards
  for update using (auth.uid() = user_id);
create policy "postcards are owner deletable" on public.postcards
  for delete using (auth.uid() = user_id);

-- favorites: owner only
create policy "favorites are owner readable" on public.favorites
  for select using (auth.uid() = user_id);
create policy "favorites are owner writable" on public.favorites
  for insert with check (auth.uid() = user_id);
create policy "favorites are owner deletable" on public.favorites
  for delete using (auth.uid() = user_id);

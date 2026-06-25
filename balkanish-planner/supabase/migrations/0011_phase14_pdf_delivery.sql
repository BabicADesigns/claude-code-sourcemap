-- Phase 14 — PDF Delivery & Email Experience.
--
-- pdf_documents tracks every PDF actually rendered for a signed-in user — itinerary
-- exports today, destination guides and premium guides once those flows exist.
-- `source_id` is polymorphic (no FK) for the same reason favorites.entity_id is:
-- it points at a different table depending on document_type, and every candidate
-- table (generated_itineraries, destinations, premium_guides) uses a uuid PK.
--
-- pdf_deliveries is an append-only log of every download/email send against a
-- pdf_documents row — "sent date + delivery status" and "download history" from
-- the Phase 14 brief are the same table, distinguished by `channel`. Resending
-- inserts a new row rather than mutating an old one, so the log stays a true history.
--
-- Both tables follow the owner-RLS convention from 0002 (saved_trips, favorites):
-- every row is only visible to, and only writable by, auth.uid() = user_id. Writes
-- happen through the user's own session via lib/actions/pdf-delivery.ts, never the
-- service-role client, so no insert/update policy is omitted the way editorial
-- content's is.

create table public.pdf_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  document_type text not null check (document_type in ('itinerary', 'destination_guide', 'premium_guide')),
  source_id uuid not null,
  locale text not null default 'en' check (locale in ('en', 'de', 'it', 'hr')),
  storage_path text,
  file_size_bytes integer,
  generated_at timestamptz not null default now(),
  -- Signed download URLs from lib/supabase/storage.ts expire after an hour, but the
  -- stored object itself doesn't — this is a separate, longer-lived "is this PDF still
  -- worth reusing" cutoff the app checks before deciding to serve vs. regenerate.
  expires_at timestamptz default (now() + interval '30 days'),
  created_at timestamptz not null default now()
);

create index pdf_documents_user_idx on public.pdf_documents (user_id);
create index pdf_documents_source_idx on public.pdf_documents (document_type, source_id);

alter table public.pdf_documents enable row level security;

create policy "pdf_documents are owner readable" on public.pdf_documents
  for select using (auth.uid() = user_id);
create policy "pdf_documents are owner writable" on public.pdf_documents
  for insert with check (auth.uid() = user_id);
create policy "pdf_documents are owner updatable" on public.pdf_documents
  for update using (auth.uid() = user_id);
create policy "pdf_documents are owner deletable" on public.pdf_documents
  for delete using (auth.uid() = user_id);

create table public.pdf_deliveries (
  id uuid primary key default gen_random_uuid(),
  pdf_document_id uuid not null references public.pdf_documents (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  channel text not null check (channel in ('download', 'email')),
  status text not null check (status in ('pending', 'sent', 'failed')),
  recipient_email text,
  error_message text,
  created_at timestamptz not null default now()
);

create index pdf_deliveries_user_idx on public.pdf_deliveries (user_id);
create index pdf_deliveries_document_idx on public.pdf_deliveries (pdf_document_id);

alter table public.pdf_deliveries enable row level security;

create policy "pdf_deliveries are owner readable" on public.pdf_deliveries
  for select using (auth.uid() = user_id);
create policy "pdf_deliveries are owner writable" on public.pdf_deliveries
  for insert with check (auth.uid() = user_id);

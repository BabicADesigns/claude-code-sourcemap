-- Phase 4 — Membership Foundation: Email Capture. Subscribers are stored
-- for a future email-provider integration; nothing reads or sends from
-- this table yet.

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source_page text,
  user_id uuid references auth.users (id) on delete set null,
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

alter table public.newsletter_subscribers enable row level security;

-- Anyone (including anonymous visitors) can subscribe; no select policy
-- is defined, so reading the list is restricted to the service role —
-- this prevents email-address enumeration via the anon key.
create policy "anyone can subscribe to the newsletter" on public.newsletter_subscribers
  for insert with check (true);

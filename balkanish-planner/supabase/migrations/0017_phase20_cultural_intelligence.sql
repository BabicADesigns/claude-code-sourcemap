-- Phase 20: Living Local & Cultural Intelligence Engine
-- Cultural insights, local phrases, founder notes, personal connection stories, and community contributions.

-- ─── Cultural Insights ────────────────────────────────────────────────────────

create type cultural_insight_scope as enum ('DESTINATION', 'REGION', 'COUNTRY');
create type cultural_insight_category as enum (
  'LOCAL_RHYTHM', 'SOCIAL_CUSTOM', 'FOOD_CULTURE', 'COFFEE_CULTURE', 'MARKET_CULTURE',
  'RELIGIOUS_OBSERVANCE', 'DRESS_CODE', 'TIPPING_ETIQUETTE', 'BARGAINING_NORMS',
  'NOISE_AND_PACE', 'HOSPITALITY_CUSTOMS', 'FAMILY_AND_COMMUNITY', 'SEASONAL_RHYTHM',
  'FESTIVAL_AND_CELEBRATION', 'LANGUAGE_TIPS', 'GETTING_AROUND_LOCALLY',
  'SAFETY_AWARENESS', 'DIGITAL_AND_CONNECTIVITY', 'MONEY_AND_PAYMENT',
  'PHOTOGRAPHY_ETIQUETTE', 'ENVIRONMENTAL_NORMS', 'LGBTQ_CONTEXT', 'ACCESSIBILITY_CONTEXT'
);
create type cultural_confidence as enum (
  'EDITORIAL_VERIFIED', 'LOCAL_CONTEXT', 'GENERAL_GUIDANCE', 'VERIFY_CURRENT_CONTEXT'
);
create type cultural_sensitivity as enum (
  'NONE', 'NEEDS_REVIEW', 'HISTORICALLY_SENSITIVE', 'POLITICALLY_SENSITIVE'
);

create table if not exists cultural_insights (
  id                text primary key,
  scope             cultural_insight_scope not null,
  scope_slug        text not null,
  category          cultural_insight_category not null,
  headline          text not null,
  body              text not null,
  nuance            text,
  confidence        cultural_confidence not null default 'GENERAL_GUIDANCE',
  sensitivity       cultural_sensitivity not null default 'NONE',
  seasonal_tag      text,
  active            boolean not null default false,
  demo_only         boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists cultural_insights_scope_slug_idx on cultural_insights (scope, scope_slug);
create index if not exists cultural_insights_category_idx on cultural_insights (category);
create index if not exists cultural_insights_active_idx on cultural_insights (active, demo_only);

-- ─── Local Phrases ────────────────────────────────────────────────────────────

create type local_phrase_category as enum (
  'GREETING', 'THANKS', 'FOOD_ORDER', 'DIRECTIONS', 'SHOPPING', 'EMERGENCY', 'COURTESY', 'NUMBERS'
);

create table if not exists local_phrases (
  id                        text primary key,
  language_code             text not null,
  language_name             text not null,
  category                  local_phrase_category not null,
  phrase                    text not null,
  transliteration           text,
  translation               text not null,
  pronunciation_tip         text,
  applicable_country_codes  text[] not null default '{}',
  active                    boolean not null default false,
  demo_only                 boolean not null default false
);

create index if not exists local_phrases_language_idx on local_phrases (language_code);
create index if not exists local_phrases_country_codes_idx on local_phrases using gin (applicable_country_codes);

-- ─── Founder Notes ────────────────────────────────────────────────────────────

create type founder_note_scope as enum ('DESTINATION', 'REGION', 'COUNTRY', 'GENERAL');

create table if not exists founder_notes (
  id            text primary key,
  scope         founder_note_scope not null default 'GENERAL',
  scope_slug    text,
  headline      text not null,
  body          text not null,
  attribution   text,
  image_key     text,
  active        boolean not null default false,
  demo_only     boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists founder_notes_scope_slug_idx on founder_notes (scope, scope_slug);

-- ─── Personal Connection Stories ─────────────────────────────────────────────

create type personal_connection_status as enum ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

create table if not exists personal_connection_stories (
  id                    text primary key default gen_random_uuid()::text,
  destination_slug      text not null,
  author_display_name   text not null,
  story                 text not null,
  connection_type       text,
  status                personal_connection_status not null default 'SUBMITTED',
  created_at            timestamptz not null default now()
);

create index if not exists personal_stories_destination_idx on personal_connection_stories (destination_slug, status);

-- ─── Cultural Contributions ───────────────────────────────────────────────────

create type cultural_contribution_status as enum ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

create table if not exists cultural_contributions (
  id                        text primary key default gen_random_uuid()::text,
  destination_slug          text,
  region_slug               text,
  country_code              text,
  category                  cultural_insight_category not null,
  suggested_headline        text not null,
  suggested_body            text not null,
  contributor_display_name  text,
  contributor_user_id       uuid references auth.users(id) on delete set null,
  status                    cultural_contribution_status not null default 'SUBMITTED',
  reviewer_note             text,
  created_at                timestamptz not null default now()
);

create index if not exists cultural_contributions_status_idx on cultural_contributions (status);

-- RLS: all tables readable by authenticated users; inserts restricted to own contributions
alter table cultural_insights enable row level security;
alter table local_phrases enable row level security;
alter table founder_notes enable row level security;
alter table personal_connection_stories enable row level security;
alter table cultural_contributions enable row level security;

create policy "cultural_insights_public_read" on cultural_insights for select using (active = true and demo_only = false);
create policy "local_phrases_public_read" on local_phrases for select using (active = true and demo_only = false);
create policy "founder_notes_public_read" on founder_notes for select using (active = true and demo_only = false);
create policy "personal_stories_approved_read" on personal_connection_stories for select using (status = 'APPROVED');
create policy "personal_stories_insert" on personal_connection_stories for insert with check (true);
create policy "cultural_contributions_insert" on cultural_contributions for insert with check (true);
create policy "cultural_contributions_own_read" on cultural_contributions for select using (contributor_user_id = auth.uid());

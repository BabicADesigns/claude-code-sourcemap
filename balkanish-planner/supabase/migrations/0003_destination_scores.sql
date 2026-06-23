-- Brand Layer Phase 1 — extend the destination scorecard from 2 metrics to 6.
-- Additive only: existing local_score / crowd_score columns are untouched.

alter table public.destinations
  add column slow_living_score numeric(3, 1) not null default 5.0 check (slow_living_score between 0 and 10),
  add column food_score numeric(3, 1) not null default 5.0 check (food_score between 0 and 10),
  add column story_score numeric(3, 1) not null default 5.0 check (story_score between 0 and 10),
  add column sunset_score numeric(3, 1) not null default 5.0 check (sunset_score between 0 and 10);

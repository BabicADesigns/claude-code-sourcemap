-- Phase 13 — Production Data Layer: schema-parity fix.
--
-- Database audit finding: the Destination / FoodFind / CultureNote TypeScript
-- interfaces (lib/types.ts) have required travel_types, latitude, longitude,
-- hero_image, and gallery_images fields. Mock data (lib/data/*-mock.ts) has
-- always populated them. No migration ever added the matching columns, so a
-- real Supabase connection would silently return rows missing these fields —
-- normalizeImageAsset() would throw on the missing hero_image, and
-- travel_types / latitude / longitude would come back undefined with no error.
-- This has never surfaced because Supabase has never been connected.
--
-- Additive only: existing columns, tables, and policies are untouched. The
-- legacy hero_image_url / gallery_image_urls text columns are kept — the
-- normalization layer (lib/media/normalize.ts) now synthesizes an ImageAsset
-- from them when the new jsonb columns are null, so older or partially
-- migrated rows still render correctly instead of crashing.

alter table public.destinations
  add column travel_types text[] not null default '{}',
  add column latitude numeric(9, 6),
  add column longitude numeric(9, 6),
  add column hero_image jsonb,
  add column gallery_images jsonb not null default '[]'::jsonb;

alter table public.food_finds
  add column hero_image jsonb;

alter table public.culture_notes
  add column hero_image jsonb;

create index destinations_travel_types_idx on public.destinations using gin (travel_types);

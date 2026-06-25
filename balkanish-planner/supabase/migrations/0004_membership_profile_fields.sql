-- Phase 4 — Membership Foundation: extend profiles with the fields the
-- /account page needs. Additive only; existing columns are untouched.

alter table public.profiles
  add column country text,
  add column travel_style travel_style,
  add column favorite_region text;

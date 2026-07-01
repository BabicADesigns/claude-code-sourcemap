-- Phase 17: Smart Personalization Engine
-- Adds personalization preference columns to profiles.
-- Adds seasonal intelligence and crowd-level columns to destinations.
-- All additions are nullable / additive — no existing rows are touched.

-- Profile personalization preferences
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS travel_pace         text    CHECK (travel_pace IN ('relaxed', 'balanced', 'active')),
  ADD COLUMN IF NOT EXISTS interests           text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS mobility            text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS budget_preference   text    CHECK (budget_preference IN ('budget', 'mid_range', 'premium', 'luxury')),
  ADD COLUMN IF NOT EXISTS cuisine_preferences text[]  DEFAULT '{}';

-- Destination seasonal intelligence and crowd tier
ALTER TABLE public.destinations
  ADD COLUMN IF NOT EXISTS seasonal_data jsonb,
  ADD COLUMN IF NOT EXISTS crowd_level   text  CHECK (crowd_level IN ('busy', 'moderate', 'quiet'));

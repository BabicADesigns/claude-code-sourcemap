-- Phase 23: Live Trip Mode & On-the-Road Companion
-- Creates live_trip_item_states — one row per (trip_id, item_key), idempotent.
-- RLS: users own all CRUD on their own states (no service-role bypass needed).
--
-- item_key format: "day{N}:{slot}" e.g. "day1:morning", "day3:evening"
-- Slots: morning | afternoon | evening | food | day_overview
-- This is the only stable per-day-slot identity we have — ItineraryDay has no
-- structured activity items, only prose slots (morning/afternoon/evening text).

CREATE TABLE IF NOT EXISTS live_trip_item_states (
  id                      uuid          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                 uuid          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trip_id                 uuid          NOT NULL REFERENCES generated_itineraries(id) ON DELETE CASCADE,

  -- Stable item key: "day{N}:{slot}" — day is 1-indexed, slot is one of the prose slots.
  -- This key is deterministic and stable across page reloads; it is not tied to any DB row
  -- in the itinerary — it is computed from day number + prose slot name.
  item_key                text          NOT NULL,

  -- LiveItemStatus: PLANNED | DONE | SKIPPED | SAVED_FOR_LATER
  status                  text          NOT NULL DEFAULT 'PLANNED',

  -- Optional free-form note the traveller adds on the road (e.g. "moved to tomorrow")
  note                    text,

  -- ISO 8601 date string (YYYY-MM-DD) when this state was last meaningfully changed.
  -- Stored as text to avoid timezone ambiguity; always set client-side in local date.
  changed_on_date         text,

  created_at              timestamptz   NOT NULL DEFAULT now(),
  updated_at              timestamptz   NOT NULL DEFAULT now()
);

-- Idempotent upsert key: one row per (trip, item_key)
CREATE UNIQUE INDEX IF NOT EXISTS live_trip_item_states_trip_key_idx
  ON live_trip_item_states (trip_id, item_key);

CREATE INDEX IF NOT EXISTS live_trip_item_states_user_idx ON live_trip_item_states (user_id);
CREATE INDEX IF NOT EXISTS live_trip_item_states_trip_idx ON live_trip_item_states (trip_id);

-- Reuse the shared set_updated_at() trigger from migration 0001
CREATE TRIGGER live_trip_item_states_set_updated_at
  BEFORE UPDATE ON live_trip_item_states
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- RLS
ALTER TABLE live_trip_item_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own live trip states"
  ON live_trip_item_states FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own live trip states"
  ON live_trip_item_states FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own live trip states"
  ON live_trip_item_states FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own live trip states"
  ON live_trip_item_states FOR DELETE
  USING (user_id = auth.uid());

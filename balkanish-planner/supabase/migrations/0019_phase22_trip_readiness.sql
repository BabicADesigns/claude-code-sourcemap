-- Phase 22: Trip Companion & Pre-Trip Readiness Engine
-- Extends generated_itineraries with an optional departure_date and creates
-- trip_readiness_items — one row per (trip, rule_key), idempotent.
-- RLS: users own all CRUD on their readiness items (no service-role bypass needed
-- since these are interactive user-managed records, not server-ingested signals).

-- 1. Departure date on generated_itineraries (nullable; set when user tells us their trip date)
ALTER TABLE generated_itineraries
  ADD COLUMN IF NOT EXISTS departure_date date;

-- 2. trip_readiness_items
CREATE TABLE IF NOT EXISTS trip_readiness_items (
  id                      uuid          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                 uuid          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trip_id                 uuid          NOT NULL REFERENCES generated_itineraries(id) ON DELETE CASCADE,

  -- Stable rule identifier — prevents duplicate rows across re-generations.
  -- Format: "category.rule_name" e.g. "documents.passport", "ferry.booking"
  rule_key                text          NOT NULL,

  -- ReadinessCategory: DOCUMENTS | VISA | HEALTH | INSURANCE | ACCOMMODATION |
  --   TRANSPORT | FERRY | BORDER_CROSSING | MONEY | CONNECTIVITY | PACKING |
  --   WEATHER | LOCAL_CUSTOMS | EMERGENCY | LANGUAGE | ACTIVITIES | FOOD
  category                text          NOT NULL,

  -- ReadinessTimingWindow: NOW_URGENT | THIS_WEEK | THIS_MONTH | BEFORE_YOU_GO |
  --   PLANNING_PHASE | IN_DESTINATION | POST_TRIP | DO_NOW
  timing_window           text          NOT NULL,

  -- ReadinessStatus: PENDING | DONE | SKIPPED | NA
  status                  text          NOT NULL DEFAULT 'PENDING',

  -- ReadinessPriority: CRITICAL | HIGH | MEDIUM | LOW
  priority                text          NOT NULL DEFAULT 'MEDIUM',

  title                   text          NOT NULL,
  description             text          NOT NULL,

  -- Optional free-form notes added by the user
  notes                   text,

  -- BookingState: NOT_STARTED | PLANNED | USER_MARKED_BOOKED
  booking_state           text          NOT NULL DEFAULT 'NOT_STARTED',

  -- ReservationSensitivity: LOW | MEDIUM | HIGH | CRITICAL
  reservation_sensitivity text          NOT NULL DEFAULT 'LOW',

  -- true for engine-generated items; false reserved for manual items (not yet surfaced in UI)
  is_auto_generated       boolean       NOT NULL DEFAULT true,

  -- Trip-specific context for the rule (e.g., which ferry segment triggered this)
  context_metadata        jsonb,

  created_at              timestamptz   NOT NULL DEFAULT now(),
  updated_at              timestamptz   NOT NULL DEFAULT now()
);

-- Idempotent upsert key: one row per (trip, rule)
CREATE UNIQUE INDEX IF NOT EXISTS trip_readiness_items_trip_rule_idx
  ON trip_readiness_items (trip_id, rule_key);

CREATE INDEX IF NOT EXISTS trip_readiness_items_user_idx ON trip_readiness_items (user_id);
CREATE INDEX IF NOT EXISTS trip_readiness_items_trip_status_idx ON trip_readiness_items (trip_id, status);

-- Reuse the shared set_updated_at() trigger from migration 0001
CREATE TRIGGER trip_readiness_items_set_updated_at
  BEFORE UPDATE ON trip_readiness_items
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- RLS
ALTER TABLE trip_readiness_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own readiness items"
  ON trip_readiness_items FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own readiness items"
  ON trip_readiness_items FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own readiness items"
  ON trip_readiness_items FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own readiness items"
  ON trip_readiness_items FOR DELETE
  USING (user_id = auth.uid());

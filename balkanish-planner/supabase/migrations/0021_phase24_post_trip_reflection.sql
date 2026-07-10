-- Phase 24: Post-Trip Reflection & Memory Loop
-- Three tables: trip_reflections (header), trip_reflection_items (per-slot ratings),
-- trip_learning_candidates (confirmed/rejected learning decisions).
-- All tables use the existing set_updated_at() trigger from migration 0001.
-- RLS: traveller owns all CRUD on their own rows (ownership verified via trip ownership chain).

-- ---------------------------------------------------------------------------
-- trip_reflections — one row per (user_id, trip_id); header-level reflection state.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trip_reflections (
  id                          uuid          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                     uuid          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trip_id                     uuid          NOT NULL REFERENCES generated_itineraries(id) ON DELETE CASCADE,

  -- TripReflectionStatus: NOT_STARTED | IN_PROGRESS | COMPLETED | DISMISSED
  status                      text          NOT NULL DEFAULT 'NOT_STARTED',

  -- OverallFeeling: LOVED_IT | GOOD_TRIP | MIXED | NOT_MY_TRIP | PREFER_NOT_TO_SAY
  overall_feeling             text,

  -- PaceReflection: TOO_SLOW | JUST_RIGHT | A_LITTLE_FULL | TOO_FULL | UNKNOWN
  pace_reflection             text,

  -- PlanningComfort: MORE_STRUCTURE | CURRENT_LEVEL | MORE_FLEXIBILITY | UNKNOWN
  planning_comfort            text,

  -- ReturnIntent: YES | MAYBE | NO | PREFER_NOT_TO_SAY
  return_intent               text,

  -- Optional free-text destination note when return_intent is YES/MAYBE
  return_intent_destination   text,

  -- Private free-text note — never read by AI, analytics, or any public surface.
  -- Stored server-side only; never returned in public-facing API responses.
  private_note                text,

  completed_at                timestamptz,
  created_at                  timestamptz   NOT NULL DEFAULT now(),
  updated_at                  timestamptz   NOT NULL DEFAULT now()
);

-- One reflection header per trip per user
CREATE UNIQUE INDEX IF NOT EXISTS trip_reflections_user_trip_idx
  ON trip_reflections (user_id, trip_id);

CREATE INDEX IF NOT EXISTS trip_reflections_user_idx ON trip_reflections (user_id);
CREATE INDEX IF NOT EXISTS trip_reflections_trip_idx ON trip_reflections (trip_id);

CREATE TRIGGER trip_reflections_set_updated_at
  BEFORE UPDATE ON trip_reflections
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE trip_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own trip reflections"
  ON trip_reflections FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own trip reflections"
  ON trip_reflections FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own trip reflections"
  ON trip_reflections FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own trip reflections"
  ON trip_reflections FOR DELETE
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- trip_reflection_items — per-slot ratings ("day1:morning" → LOVED/LIKED/etc.)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trip_reflection_items (
  id                          uuid          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                     uuid          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trip_id                     uuid          NOT NULL REFERENCES generated_itineraries(id) ON DELETE CASCADE,

  -- Same item_key format as live_trip_item_states: "day{N}:{slot}"
  -- Slots: morning | afternoon | evening | food | day_overview
  item_key                    text          NOT NULL,

  -- ItemReflection: LOVED | LIKED | NEUTRAL | WOULD_SKIP | NOT_EXPERIENCED
  value                       text          NOT NULL DEFAULT 'NOT_EXPERIENCED',

  created_at                  timestamptz   NOT NULL DEFAULT now(),
  updated_at                  timestamptz   NOT NULL DEFAULT now()
);

-- Idempotent upsert key: one rating per (trip, item_key) per user
CREATE UNIQUE INDEX IF NOT EXISTS trip_reflection_items_user_trip_key_idx
  ON trip_reflection_items (user_id, trip_id, item_key);

CREATE INDEX IF NOT EXISTS trip_reflection_items_user_idx ON trip_reflection_items (user_id);
CREATE INDEX IF NOT EXISTS trip_reflection_items_trip_idx ON trip_reflection_items (trip_id);

CREATE TRIGGER trip_reflection_items_set_updated_at
  BEFORE UPDATE ON trip_reflection_items
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE trip_reflection_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own reflection items"
  ON trip_reflection_items FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own reflection items"
  ON trip_reflection_items FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own reflection items"
  ON trip_reflection_items FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own reflection items"
  ON trip_reflection_items FOR DELETE
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- trip_learning_candidates — traveller's CONFIRMED / REJECTED / DEFERRED decisions
-- on memory promotion candidates derived from their reflection.
-- The candidate payload is stored as jsonb for portability; the engine re-derives
-- candidates deterministically so this table is a decision log, not the source of truth.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trip_learning_candidates (
  id                          uuid          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                     uuid          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trip_id                     uuid          NOT NULL REFERENCES generated_itineraries(id) ON DELETE CASCADE,

  -- Stable candidate key: "{tripId}:{domain}:{subject_slug}"
  candidate_key               text          NOT NULL,

  -- CandidateDecision: CONFIRMED | REJECTED | DEFERRED
  decision                    text          NOT NULL,

  -- ISO 8601 timestamp set by the client at decision time
  decided_at                  text          NOT NULL,

  -- Snapshot of the candidate at decision time (for audit; never re-read by the engine)
  candidate_snapshot          jsonb,

  created_at                  timestamptz   NOT NULL DEFAULT now(),
  updated_at                  timestamptz   NOT NULL DEFAULT now()
);

-- One decision per candidate key per trip per user (can be overwritten via upsert)
CREATE UNIQUE INDEX IF NOT EXISTS trip_learning_candidates_user_trip_key_idx
  ON trip_learning_candidates (user_id, trip_id, candidate_key);

CREATE INDEX IF NOT EXISTS trip_learning_candidates_user_idx ON trip_learning_candidates (user_id);
CREATE INDEX IF NOT EXISTS trip_learning_candidates_trip_idx ON trip_learning_candidates (trip_id);

CREATE TRIGGER trip_learning_candidates_set_updated_at
  BEFORE UPDATE ON trip_learning_candidates
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE trip_learning_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own learning candidates"
  ON trip_learning_candidates FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own learning candidates"
  ON trip_learning_candidates FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own learning candidates"
  ON trip_learning_candidates FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own learning candidates"
  ON trip_learning_candidates FOR DELETE
  USING (user_id = auth.uid());

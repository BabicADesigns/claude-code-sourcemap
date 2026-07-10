-- Phase 28 — Travel Find Resurfacing & Proximity Intelligence
-- Creates resurfacing_history table with RLS.
-- Records every in-product resurfacing event and all user actions on resurfaced finds.
-- Never stores GPS data, exact location, or private note content.

CREATE TABLE IF NOT EXISTS resurfacing_history (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  capture_id            UUID        NOT NULL REFERENCES inspiration_captures(id) ON DELETE CASCADE,
  trip_id               UUID        NOT NULL REFERENCES generated_itineraries(id) ON DELETE CASCADE,
  resurfaced_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  window                TEXT        NOT NULL,   -- ResurfacingWindow enum value
  reasons               TEXT[]      NOT NULL DEFAULT '{}',  -- ResurfacingReason[]
  confidence            TEXT        NOT NULL,   -- MatchConfidence: HIGH | MEDIUM | LOW
  action                TEXT,                   -- ResurfacingAction or NULL (shown, no action taken)
  action_at             TIMESTAMPTZ,
  suppressed_until      TIMESTAMPTZ,            -- Set when action = REMIND_ME_LATER
  permanently_dismissed BOOLEAN     NOT NULL DEFAULT false,  -- True when action = DISMISS or NOT_THIS_TRIP
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_resurfacing_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER resurfacing_history_updated_at
  BEFORE UPDATE ON resurfacing_history
  FOR EACH ROW EXECUTE FUNCTION update_resurfacing_history_updated_at();

-- Indexes for lookup patterns
-- Fatigue check: "has this capture been permanently dismissed for this trip?"
CREATE INDEX idx_resurfacing_history_user_capture_trip
  ON resurfacing_history(user_id, capture_id, trip_id);

-- Load history for a trip
CREATE INDEX idx_resurfacing_history_user_trip
  ON resurfacing_history(user_id, trip_id);

-- Suppression check (partial — only rows with an active suppression window)
CREATE INDEX idx_resurfacing_history_suppressed
  ON resurfacing_history(user_id, suppressed_until)
  WHERE suppressed_until IS NOT NULL;

-- RLS — users can only read/write their own history
ALTER TABLE resurfacing_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own resurfacing history"
  ON resurfacing_history
  FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

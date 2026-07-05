-- Phase 21: Travel Memory Signals
-- Private user data — RLS enforced. Service role required for INSERT (all writes go
-- through server actions). Users may read and update their own signals only.
-- See docs/travel-memory-engine.md for the full privacy and sensitivity policy.

CREATE TABLE IF NOT EXISTS travel_memory_signals (
  id                  uuid         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             uuid         NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- Signal source — must match ALLOWED_MEMORY_SIGNAL_SOURCES (lib/types.ts)
  source              text         NOT NULL,
  -- Preference domain — must match MemoryPreferenceDomain; BLOCKED_MEMORY_DOMAINS rejected at ingestion
  domain              text         NOT NULL,
  -- Human-readable description of the preference (e.g. "slow mornings and cafés")
  subject             text         NOT NULL,
  -- Optional specific value associated with the signal
  value               text,
  -- Signal direction: POSITIVE | NEGATIVE | NEUTRAL
  direction           text         NOT NULL DEFAULT 'POSITIVE',
  -- Computed strength 0–1 (source weight + repetition bonus, max 1.0)
  strength            numeric(4,3) NOT NULL DEFAULT 0.300 CHECK (strength >= 0 AND strength <= 1),
  -- Computed confidence 0–1 (source + repetition + confirmation status)
  confidence          numeric(4,3) NOT NULL DEFAULT 0.300 CHECK (confidence >= 0 AND confidence <= 1),
  -- The trip that first or most recently triggered this signal (nullable)
  source_trip_id      uuid         REFERENCES generated_itineraries(id) ON DELETE SET NULL,
  -- How many times this signal has been observed (incremented on repeat, never creates duplicate rows)
  occurrence_count    integer      NOT NULL DEFAULT 1 CHECK (occurrence_count >= 1),
  first_observed_at   timestamptz  NOT NULL DEFAULT now(),
  last_observed_at    timestamptz  NOT NULL DEFAULT now(),
  -- Trip context at time of observation: SOLO | COUPLE | FAMILY | FRIENDS | WORKATION | ROAD_TRIP
  trip_context        text,
  -- UNCONFIRMED | CONFIRMED | REJECTED
  confirmation_status text         NOT NULL DEFAULT 'UNCONFIRMED',
  -- For REJECTED signals: when the cooldown expires and new signals for this preference are accepted again
  rejected_until      timestamptz,
  active              boolean      NOT NULL DEFAULT true,
  created_at          timestamptz  NOT NULL DEFAULT now(),
  updated_at          timestamptz  NOT NULL DEFAULT now()
);

-- Unique constraint for upsert deduplication: one signal row per (user, domain, subject, direction)
-- Repeated observations increment occurrence_count instead of creating new rows.
CREATE UNIQUE INDEX IF NOT EXISTS travel_memory_signals_dedup_idx
  ON travel_memory_signals (user_id, domain, subject, direction);

-- Lookup index for active signal reads
CREATE INDEX IF NOT EXISTS travel_memory_signals_user_active_idx
  ON travel_memory_signals (user_id, active, confirmation_status);

-- RLS: Travel memory is private user data
ALTER TABLE travel_memory_signals ENABLE ROW LEVEL SECURITY;

-- Users may read only their own signals
CREATE POLICY "Users read own travel memory"
  ON travel_memory_signals FOR SELECT
  USING (auth.uid() = user_id);

-- Users may update their own signals (to confirm or reject from the UI)
CREATE POLICY "Users update own travel memory"
  ON travel_memory_signals FOR UPDATE
  USING (auth.uid() = user_id);

-- No INSERT policy for authenticated role — all ingestion goes through server-side
-- recordTravelMemorySignal() using createSupabaseAdminClient (service role).
-- This ensures the allowlist and sensitive-domain checks cannot be bypassed from the client.

-- Updated_at trigger
CREATE OR REPLACE FUNCTION handle_travel_memory_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER travel_memory_signals_updated_at
  BEFORE UPDATE ON travel_memory_signals
  FOR EACH ROW EXECUTE FUNCTION handle_travel_memory_updated_at();

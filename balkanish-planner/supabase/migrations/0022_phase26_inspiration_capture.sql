-- Phase 26: Inspiration Capture & Travel Intent Layer
-- Stores source-agnostic travel finds captured from URLs, social links,
-- screenshots, or manual recommendations.
-- Screenshots are NEVER persisted here — only structured extraction results.

CREATE TABLE IF NOT EXISTS public.inspiration_captures (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Source provenance (source-agnostic; provider is metadata, not architecture)
  source_type text NOT NULL,
  source_url text,
  source_provider text,
  source_creator text,
  original_source_reference text,

  -- Place resolution (populated progressively)
  place_name text,
  country_code text,
  region text,
  latitude numeric,
  longitude numeric,
  place_type text,

  -- User-authored content
  user_note text,

  -- System-extracted context and memory (deterministic, not AI-invented)
  capture_context text,
  memory_spark text,

  -- Resolution state
  resolution_confidence numeric NOT NULL DEFAULT 0 CHECK (resolution_confidence >= 0 AND resolution_confidence <= 1),
  resolution_status text NOT NULL DEFAULT 'UNRESOLVED',

  -- Provenance audit metadata (jsonb; see InspirationCaptureProvenance in lib/types.ts)
  provenance jsonb,

  -- Timestamps
  captured_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS inspiration_captures_user_id_idx
  ON public.inspiration_captures(user_id);

CREATE INDEX IF NOT EXISTS inspiration_captures_user_status_idx
  ON public.inspiration_captures(user_id, resolution_status);

CREATE INDEX IF NOT EXISTS inspiration_captures_user_captured_at_idx
  ON public.inspiration_captures(user_id, captured_at DESC);

-- Updated-at trigger (reuses set_updated_at from migration 0001)
CREATE TRIGGER set_updated_at_inspiration_captures
  BEFORE UPDATE ON public.inspiration_captures
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Row Level Security — users may only access their own captures
ALTER TABLE public.inspiration_captures ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view their own inspiration captures"
  ON public.inspiration_captures FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own inspiration captures"
  ON public.inspiration_captures FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own inspiration captures"
  ON public.inspiration_captures FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own inspiration captures"
  ON public.inspiration_captures FOR DELETE
  USING (auth.uid() = user_id);

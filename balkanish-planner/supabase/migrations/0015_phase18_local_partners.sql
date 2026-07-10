-- Phase 18 — Local Trust & Partner Recommendation System
-- Additive DDL: no existing tables or columns are modified.
--
-- Architecture rule (see docs/local-trust-recommendation-system.md):
--   "Editorial relevance comes first. Commercial relationships never buy recommendation rank."
--
-- The commercial_relationship column is a transparency record only.
-- It is never read by the recommendation scoring algorithm.

CREATE TABLE public.local_partners (
  id                       uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name                     text        NOT NULL,
  slug                     text        NOT NULL UNIQUE,

  -- Editorial trust tier: founder_pick > verified_local > community_favourite
  -- Trust level is assigned by the editorial team, not by any commercial signal.
  trust_level              text        NOT NULL
                             CHECK (trust_level IN ('founder_pick', 'verified_local', 'community_favourite')),

  -- Commercial relationship disclosure — stored for transparency, never used for ranking.
  commercial_relationship  text        NOT NULL DEFAULT 'none'
                             CHECK (commercial_relationship IN (
                               'none', 'affiliate', 'paid_partnership',
                               'founder_connection', 'owned_or_affiliated_project'
                             )),
  disclosure_text          text,

  -- Categorisation
  category                 text        NOT NULL,
  categories               text[]      DEFAULT '{}',

  -- Geographic relevance
  country                  text,
  region                   text,
  destination_slugs        text[]      DEFAULT '{}',

  -- Editorial copy
  short_description        text        NOT NULL,
  editorial_note           text,    -- internal only
  founder_note             text,    -- shown to users for Founder's Pick entries

  -- External links (all nullable — partners may not have all channels)
  website_url              text,
  instagram_url            text,
  booking_url              text,
  app_url                  text,
  contact_email            text,
  contact_phone            text,

  -- Contextual matching signals (used by lib/ai/partner-match.ts)
  traveler_interests       text[]      DEFAULT '{}',
  mobility_options         text[]      DEFAULT '{}',
  travel_moods             text[]      DEFAULT '{}',
  cuisine_types            text[]      DEFAULT '{}',
  trip_paces               text[]      DEFAULT '{}',
  family_suitable          boolean     DEFAULT false,
  accessibility_notes      text,
  best_months              integer[]   DEFAULT '{}',

  -- Media
  hero_image               jsonb,

  -- Editorial metadata
  priority                 integer     NOT NULL DEFAULT 50 CHECK (priority BETWEEN 0 AND 100),
  active                   boolean     NOT NULL DEFAULT false,
  demo_only                boolean     NOT NULL DEFAULT false,
  verified_at              timestamptz,
  verified_by              text,

  created_at               timestamptz DEFAULT now(),
  updated_at               timestamptz DEFAULT now()
);

-- RLS: public can read active, non-demo partners only.
-- Service role (admin, editorial tools) retains full access.
ALTER TABLE public.local_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active partners"
  ON public.local_partners FOR SELECT
  USING (active = true AND demo_only = false);

CREATE POLICY "Service role full access on local_partners"
  ON public.local_partners FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Performance indexes for contextual matching queries
CREATE INDEX idx_local_partners_country            ON public.local_partners (country);
CREATE INDEX idx_local_partners_active             ON public.local_partners (active, demo_only);
CREATE INDEX idx_local_partners_trust_level        ON public.local_partners (trust_level);
CREATE INDEX idx_local_partners_destination_slugs  ON public.local_partners USING GIN (destination_slugs);
CREATE INDEX idx_local_partners_traveler_interests ON public.local_partners USING GIN (traveler_interests);
CREATE INDEX idx_local_partners_travel_moods       ON public.local_partners USING GIN (travel_moods);
CREATE INDEX idx_local_partners_categories         ON public.local_partners USING GIN (categories);

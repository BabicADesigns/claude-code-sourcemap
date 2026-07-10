/**
 * Phase 18 — Contextual Partner Matching
 *
 * Ranks local partners against a traveller's trip context.
 * Commercial relationships are deliberately excluded from scoring —
 * they are a transparency record only, never a ranking signal.
 *
 * Architecture rule: "Editorial relevance comes first.
 * Commercial relationships never buy recommendation rank."
 */

import type {
  LocalPartner,
  PartnerMatchResult,
  Country,
  TravelMood,
  TravelerInterest,
  MobilityOption,
  CuisinePreference,
  TripPace,
} from "@/lib/types";

export interface PartnerMatchInput {
  country?: Country | null;
  destination_slugs?: string[];
  region?: string | null;
  travel_mood?: TravelMood | null;
  /** TravelerInterest keys from the user's profile — not the planner wizard string vocabulary. */
  interests?: TravelerInterest[] | null;
  cuisine_preferences?: CuisinePreference[] | null;
  mobility?: MobilityOption[] | null;
  pace?: TripPace | null;
  /** 1-indexed month number (1 = January). */
  month?: number | null;
  family_friendly?: boolean;
}

export interface PartnerDensityOptions {
  /** Maximum partners to return. Defaults to PARTNER_DENSITY.MAX_PER_ITINERARY. */
  maxResults?: number;
  /** Minimum relevance score 0–1 to include. Defaults to PARTNER_DENSITY.MIN_RELEVANCE_SCORE. */
  minScore?: number;
  /** Whether to include community_favourite partners (excluded by default — requires evidence). */
  allowCommunityFavourite?: boolean;
}

/** Hard limits that keep the planner feeling like a planner, not an advertising surface. */
export const PARTNER_DENSITY = {
  MAX_PER_ITINERARY: 2,
  MIN_RELEVANCE_SCORE: 0.4,
  FOUNDER_PICK_CAP: 1,
} as const;

function overlapRatio(a: string[] | undefined | null, b: string[] | undefined | null): number {
  if (!a?.length || !b?.length) return 0;
  return a.filter((x) => b.includes(x)).length / Math.min(a.length, b.length);
}

function computePartnerRelevance(partner: LocalPartner, input: PartnerMatchInput): number {
  // Hard geographic gate: if a partner declares a country, it must match the trip's country.
  // A partner with no country declared is considered globally relevant.
  if (partner.country && input.country && partner.country !== input.country) return 0;

  // Base score for passing the geographic gate.
  let score = 0.3;

  // Destination slug match — strongest geographic signal (0.25)
  if (partner.destination_slugs?.length && input.destination_slugs?.length) {
    const overlap = partner.destination_slugs.filter((s) =>
      input.destination_slugs!.includes(s)
    ).length;
    if (overlap > 0) score += 0.25;
  }

  // Sub-national region match (0.15)
  if (
    partner.region &&
    input.region &&
    partner.region.toLowerCase() === input.region.toLowerCase()
  ) {
    score += 0.15;
  }

  // Interest overlap — profile TravelerInterest keys (0–0.20)
  if (partner.traveler_interests?.length && input.interests?.length) {
    score += overlapRatio(partner.traveler_interests, input.interests) * 0.20;
  }

  // Travel mood alignment (0.10)
  if (partner.travel_moods?.length && input.travel_mood) {
    if ((partner.travel_moods as string[]).includes(input.travel_mood)) {
      score += 0.10;
    }
  }

  // Cuisine preference match (0.05)
  if (partner.cuisine_types?.length && input.cuisine_preferences?.length) {
    if (overlapRatio(partner.cuisine_types, input.cuisine_preferences) > 0) {
      score += 0.05;
    }
  }

  // Mobility match (0.05)
  if (partner.mobility_options?.length && input.mobility?.length) {
    if (overlapRatio(partner.mobility_options, input.mobility) > 0) {
      score += 0.05;
    }
  }

  // Pace match (0.05)
  if (partner.trip_paces?.length && input.pace) {
    if ((partner.trip_paces as string[]).includes(input.pace)) {
      score += 0.05;
    }
  }

  // Season fit (0.05)
  if (partner.best_months?.length && input.month) {
    if (partner.best_months.includes(input.month)) {
      score += 0.05;
    }
  }

  // Family match (0.05)
  if (input.family_friendly && partner.family_suitable) {
    score += 0.05;
  }

  // Apply editorial priority weight: maps [0, 100] → [0.5, 1.5]
  // Priority is editorial judgment — content quality, recency, regional relevance.
  // It is NOT influenced by commercial relationship (see commercial_relationship field).
  const priorityWeight = 0.5 + partner.priority / 100;
  return Math.min(1, score * priorityWeight);
}

function collectMatchReasons(partner: LocalPartner, input: PartnerMatchInput): string[] {
  const reasons: string[] = [];
  if (partner.country && input.country && partner.country === input.country) {
    reasons.push(`country:${partner.country}`);
  }
  if (
    partner.destination_slugs?.length &&
    input.destination_slugs?.some((s) => partner.destination_slugs!.includes(s))
  ) {
    reasons.push("destination:match");
  }
  if (partner.region && input.region && partner.region.toLowerCase() === input.region.toLowerCase()) {
    reasons.push(`region:${partner.region}`);
  }
  if (
    partner.travel_moods?.length &&
    input.travel_mood &&
    (partner.travel_moods as string[]).includes(input.travel_mood)
  ) {
    reasons.push(`mood:${input.travel_mood}`);
  }
  if (partner.family_suitable && input.family_friendly) {
    reasons.push("family:match");
  }
  if (partner.traveler_interests?.length && input.interests?.length) {
    const hits = partner.traveler_interests.filter((i) => input.interests!.includes(i));
    if (hits.length) reasons.push(`interests:${hits.join(",")}`);
  }
  return reasons;
}

/**
 * Match a list of local partners against the current trip context.
 * Returns ranked matches above the relevance threshold, capped to density limits.
 * Community Favourite partners are excluded by default — they require editorial evidence.
 */
export function matchPartnersToContext(
  partners: LocalPartner[],
  input: PartnerMatchInput,
  options?: PartnerDensityOptions
): PartnerMatchResult[] {
  const maxResults = options?.maxResults ?? PARTNER_DENSITY.MAX_PER_ITINERARY;
  const minScore = options?.minScore ?? PARTNER_DENSITY.MIN_RELEVANCE_SCORE;
  const allowCommunityFavourite = options?.allowCommunityFavourite ?? false;

  const candidates = partners
    .filter((p) => p.active && !p.demo_only)
    .filter((p) => allowCommunityFavourite || p.trust_level !== "community_favourite")
    .map((partner) => ({
      partner,
      relevance_score: computePartnerRelevance(partner, input),
      match_reasons: collectMatchReasons(partner, input),
    }))
    .filter((r) => r.relevance_score >= minScore)
    .sort((a, b) => b.relevance_score - a.relevance_score);

  const results: PartnerMatchResult[] = [];
  let founderPickCount = 0;

  for (const candidate of candidates) {
    if (results.length >= maxResults) break;
    if (candidate.partner.trust_level === "founder_pick") {
      if (founderPickCount >= PARTNER_DENSITY.FOUNDER_PICK_CAP) continue;
      founderPickCount++;
    }
    results.push(candidate);
  }

  return results;
}

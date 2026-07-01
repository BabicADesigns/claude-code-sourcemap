/**
 * Phase 17 — Internal Recommendation Score
 *
 * Computes a composite 0–1 score for a destination given a user's personalization preferences.
 * Used internally by the grounding and editorial layers to rank and surface content.
 * Never exposed as a public field or shown to the user directly.
 *
 * Scoring model (weights sum to 1):
 *   35%  Interest match      — how well the destination fits the traveller's stated interests
 *   25%  Seasonal fit        — whether the travel month falls in best/avoid/neutral window
 *   20%  Crowd fit           — crowd level vs. mood preference (quiet moods prefer quiet destinations)
 *   20%  Editorial quality   — local_score, story_score, inverse crowd_score (always on)
 */

import type { Destination, TravelerInterest, TravelMood, TripPace } from "@/lib/types";
import type { CuisinePreference } from "@/lib/types";

export interface RecommendationInput {
  interests?: TravelerInterest[] | null;
  travel_mood?: TravelMood | null;
  cuisine_preferences?: CuisinePreference[] | null;
  pace?: TripPace | null;
  month?: number;
}

export interface RecommendationScore {
  /** Composite 0–1 score. Higher is a stronger personal fit. */
  total: number;
  interest_match: number;
  season_fit: number;
  crowd_fit: number;
  editorial_quality: number;
}

const INTEREST_SCORE_MAP: Partial<Record<TravelerInterest, (d: Destination) => number>> = {
  food: (d) => d.food_score / 10,
  history: (d) => d.story_score / 10,
  beaches: (d) => d.sunset_score / 10,
  photography: (d) => (d.sunset_score + d.story_score) / 20,
  hiking: (d) => (d.travel_types.includes("national_park") || d.travel_types.includes("mountain_escape") ? 0.9 : 0.35),
  islands: (d) => (d.travel_types.includes("island_escape") ? 0.9 : 0.3),
  nightlife: (d) => (10 - d.slow_living_score) / 10,
  architecture: (d) => (d.story_score + d.local_score) / 20,
  hidden_gems: (d) => (10 - d.crowd_score) / 10,
  wine: (d) => (d.food_score + (d.travel_types.includes("wine_region") ? 2 : 0)) / 10,
  family: (d) => (d.slow_living_score + (10 - d.crowd_score)) / 20,
  wellness: (d) => d.slow_living_score / 10,
  adventure: (d) =>
    d.travel_types.some((t) => ["national_park", "mountain_escape"].includes(t)) ? 0.85 : 0.35,
};

function interestMatchScore(destination: Destination, interests: TravelerInterest[]): number {
  if (!interests.length) return 0.5;
  const scores = interests.map((i) => INTEREST_SCORE_MAP[i]?.(destination) ?? 0.5);
  return scores.reduce((s, v) => s + v, 0) / scores.length;
}

function seasonFitScore(destination: Destination, month: number): number {
  if (!destination.seasonal_data) return 0.5;
  const { best_months, avoid_months } = destination.seasonal_data;
  if (best_months.includes(month)) return 1;
  if (avoid_months?.includes(month)) return 0.1;
  return 0.55;
}

const QUIET_MOODS: TravelMood[] = ["slow_living", "digital_detox", "romantic", "wellness" as TravelMood];

function crowdFitScore(destination: Destination, mood?: TravelMood | null): number {
  const prefersQuiet = mood ? QUIET_MOODS.includes(mood) : false;
  if (destination.crowd_level) {
    if (destination.crowd_level === "quiet") return prefersQuiet ? 1 : 0.7;
    if (destination.crowd_level === "moderate") return prefersQuiet ? 0.55 : 0.65;
    return prefersQuiet ? 0.2 : 0.5;
  }
  // Fall back to numeric crowd_score
  const quietness = (10 - destination.crowd_score) / 10;
  return prefersQuiet ? quietness : 0.5 + quietness * 0.3;
}

function editorialQualityScore(destination: Destination): number {
  return Math.min(
    1,
    (destination.local_score + destination.story_score + (10 - destination.crowd_score) * 0.5) / 25
  );
}

/**
 * Compute a recommendation score for a destination given traveller preferences.
 * All inputs are optional — missing fields fall back to neutral (0.5) sub-scores.
 */
export function computeRecommendationScore(
  destination: Destination,
  input: RecommendationInput
): RecommendationScore {
  const month = input.month ?? 6;
  const interests: TravelerInterest[] = input.interests ?? [];

  const interest_match = interestMatchScore(destination, interests);
  const season_fit = seasonFitScore(destination, month);
  const crowd_fit = crowdFitScore(destination, input.travel_mood);
  const editorial_quality = editorialQualityScore(destination);

  const total =
    interest_match * 0.35 +
    season_fit * 0.25 +
    crowd_fit * 0.2 +
    editorial_quality * 0.2;

  return { total, interest_match, season_fit, crowd_fit, editorial_quality };
}

import type { ResurfacingReason, MatchConfidence } from "@/lib/types";

/**
 * Deterministic relevance weights per reason.
 * All weights are additive; the highest-weight reasons dominate the final score.
 * Change weights here only — no other code touches scoring.
 *
 * ON_ROUTE / NEAR_OVERNIGHT_STOP  45   — the find is directly on the planned path
 * UPCOMING_DAY_OPPORTUNITY        35   — relevant for tomorrow (highest urgency)
 * NEAR_DAY_STOP                   30   — near a day-trip stop
 * SAME_DESTINATION                25   — explicit name match to a map_point
 * NEAR_ROUTE                      20   — close but not at a named stop
 * TRIP_INTEREST_MATCH             15   — place_type aligns with saved interests
 * SAME_REGION                     10   — country match only; weakest signal
 */
const REASON_WEIGHTS: Record<ResurfacingReason, number> = {
  ON_ROUTE: 45,
  NEAR_OVERNIGHT_STOP: 45,
  UPCOMING_DAY_OPPORTUNITY: 35,
  NEAR_DAY_STOP: 30,
  SAME_DESTINATION: 25,
  NEAR_ROUTE: 20,
  TRIP_INTEREST_MATCH: 15,
  SAME_REGION: 10,
};

/** Confidence multiplier applied after summing reason weights. */
const CONFIDENCE_MULTIPLIERS: Record<MatchConfidence, number> = {
  HIGH: 1.0,
  MEDIUM: 0.75,
  LOW: 0.5,
};

/**
 * Computes a deterministic relevance score (0–100).
 *
 * Algorithm:
 *   1. Sum weights for all reasons present
 *   2. Apply confidence multiplier
 *   3. Add resolution confidence bonus (capture quality × 10, max 10 pts)
 *   4. Clamp to [0, 100]
 */
export function computeRelevanceScore(
  reasons: ResurfacingReason[],
  confidence: MatchConfidence,
  resolutionConfidence: number
): number {
  const reasonSum = reasons.reduce((sum, r) => sum + (REASON_WEIGHTS[r] ?? 0), 0);
  const multiplied = reasonSum * CONFIDENCE_MULTIPLIERS[confidence];
  const qualityBonus = Math.min(resolutionConfidence, 1) * 10;
  return Math.min(100, Math.round(multiplied + qualityBonus));
}

/** Derives MatchConfidence from the set of reasons present. */
export function deriveConfidence(reasons: ResurfacingReason[]): MatchConfidence {
  const strong: ResurfacingReason[] = [
    "ON_ROUTE",
    "NEAR_OVERNIGHT_STOP",
    "NEAR_DAY_STOP",
    "UPCOMING_DAY_OPPORTUNITY",
  ];
  const medium: ResurfacingReason[] = ["NEAR_ROUTE", "SAME_DESTINATION"];
  if (reasons.some((r) => strong.includes(r))) return "HIGH";
  if (reasons.some((r) => medium.includes(r))) return "MEDIUM";
  return "LOW";
}

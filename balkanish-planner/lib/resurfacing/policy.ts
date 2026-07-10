import type { ResurfacingPolicyConfig } from "@/lib/types";

/**
 * Central configuration for all resurfacing thresholds.
 * Change this object to tune matching sensitivity — no engine code changes needed.
 *
 * Score thresholds (0–100):
 *   minScoreToSurface     30   — below this, skip silently
 *   strongScoreThreshold  70   — at or above this, show in Trip Companion
 *
 * Cooldown windows (days):
 *   cooldownAfterRemindLaterDays  7   — re-surface after "Remind me later"
 *   cooldownAfterViewDays         3   — brief quiet period after "View Find"
 *
 * Geographic thresholds (km, straight-line haversine):
 *   nearRouteMaxDistanceKm  30  — qualifies for NEAR_ROUTE reason
 *   nearStopMaxDistanceKm   15  — qualifies for NEAR_*_STOP reason
 *
 * Rate limiting:
 *   maxResurfacedFindsShown   2   — max cards in Trip Companion per page load
 */
export const DEFAULT_RESURFACING_POLICY: ResurfacingPolicyConfig = {
  minScoreToSurface: 30,
  strongScoreThreshold: 70,
  cooldownAfterRemindLaterDays: 7,
  cooldownAfterViewDays: 3,
  maxResurfacedFindsShown: 2,
  nearRouteMaxDistanceKm: 30,
  nearStopMaxDistanceKm: 15,
  minCaptureConfidenceForGeo: 0.4,
};

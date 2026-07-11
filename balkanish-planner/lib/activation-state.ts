import type { SavedItinerary } from "@/lib/types";
import { computeLifecycle } from "@/lib/ai/live-trip";

/**
 * Phase 31 — First Journey Activation State Model.
 *
 * Six canonical states aligned with the user journey:
 *
 * A  ANONYMOUS       — not authenticated (handled at route level; not in this type)
 * B  first_time      — authenticated, 0 saved content, 0 trips
 * C  browsing_only   — authenticated, has saved content, 0 trips
 * D  planning        — has trips, all in PLANNING lifecycle (no departure active)
 * E  active_trip     — at least one trip in PRE_TRIP / DEPARTURE_DAY / IN_TRIP
 * F  completed_trip  — all trips COMPLETED; none active
 *
 * "returning" is a catch-all for users with trips in mixed lifecycle states
 * (some completed, some planning) that don't match a single canonical state.
 *
 * Per-workspace approximation:
 * - My Balkans: pass itineraries=[] since that page does not fetch itineraries.
 *   Result will always be "first_time" or "browsing_only".
 * - My Trips: pass savedContentCount=0 since that page does not fetch saved content.
 *   Result will be "first_time", "planning", "active_trip", "completed_trip", or "returning".
 */
export type ActivationState =
  | "first_time"
  | "browsing_only"
  | "planning"
  | "active_trip"
  | "completed_trip"
  | "returning";

export function computeActivationState({
  savedContentCount,
  itineraries,
  todayString,
}: {
  savedContentCount: number;
  itineraries: SavedItinerary[];
  todayString: string;
}): ActivationState {
  if (itineraries.length === 0) {
    return savedContentCount === 0 ? "first_time" : "browsing_only";
  }

  const lifecycles = itineraries.map((t) =>
    computeLifecycle(t.departure_date, t.duration_days, todayString)
  );

  const hasActive = lifecycles.some(
    (l) => l === "PRE_TRIP" || l === "DEPARTURE_DAY" || l === "IN_TRIP"
  );
  if (hasActive) return "active_trip";

  const allCompleted = lifecycles.every((l) => l === "COMPLETED");
  if (allCompleted) return "completed_trip";

  const allPlanning = lifecycles.every((l) => l === "PLANNING");
  if (allPlanning) return "planning";

  return "returning";
}

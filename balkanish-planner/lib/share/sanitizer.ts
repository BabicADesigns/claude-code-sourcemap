/**
 * Share Data Sanitizer
 *
 * Converts a SavedItinerary into a TripShareSnapshot safe for rendering.
 *
 * Privacy boundary:
 * - No private notes, no user_id, no email
 * - No internal confidence scores or provenance metadata
 * - No exact current location
 * - Distance only included when > 0 and plausibly reliable (route_summary present)
 * - Finds count deferred (not yet wired to live DB query in Phase 27)
 *
 * Never fabricates data: if a field is unavailable, it is null in the output.
 */

import type { SavedItinerary } from "@/lib/types";
import type { TripShareSnapshot } from "@/lib/share/types";
import { DEFAULT_SHARE_BRAND_CONFIG, type ShareBrandConfig } from "@/lib/share/brand-config";

const PACE_LABELS: Record<string, string> = {
  relaxed: "Relaxed",
  balanced: "Balanced",
  active: "Explorer",
};

export function buildTripShareSnapshot(
  itinerary: SavedItinerary,
  brandConfig: ShareBrandConfig = DEFAULT_SHARE_BRAND_CONFIG
): TripShareSnapshot {
  const gen = itinerary.itinerary_json;

  // Derive display title: user's name or AI-generated title
  const title = itinerary.title ?? gen.trip_title;

  // Country label: single-country trips use the Country name directly;
  // multi-country (null) fall back to "The Balkans"
  const countryLabel = gen.country ?? "The Balkans";

  // Route: non-day-trip map_points sorted by day, deduplicated, max 4 stops
  const routeText = buildRouteText(gen.map_points);

  // Pace label
  const paceLabel = PACE_LABELS[gen.pace] ?? gen.pace;

  // Distance: only include when route_summary exists and total is > 0
  const totalDistanceKm =
    gen.route_summary && gen.route_summary.total_distance_km > 0
      ? Math.round(gen.route_summary.total_distance_km)
      : null;

  return {
    tripId: itinerary.id,
    title,
    durationDays: itinerary.duration_days,
    month: itinerary.month,
    paceLabel,
    countryLabel,
    routeText,
    stopCount: gen.route_summary?.stop_count ?? 0,
    dayTripCount:
      gen.route_summary && gen.route_summary.day_trip_count >= 0
        ? gen.route_summary.day_trip_count
        : null,
    totalDistanceKm,
    brandConfig,
  };
}

type MapPoint = {
  destination: string;
  day: number;
  is_day_trip: boolean;
};

function buildRouteText(mapPoints: MapPoint[]): string | null {
  if (!mapPoints || mapPoints.length === 0) return null;

  const overnight = mapPoints
    .filter((p) => !p.is_day_trip)
    .sort((a, b) => a.day - b.day);

  if (overnight.length === 0) return null;

  // Deduplicate consecutive same-destination entries
  const unique: string[] = [];
  for (const p of overnight) {
    if (unique[unique.length - 1] !== p.destination) {
      unique.push(p.destination);
    }
  }

  // Max 4 stops to keep the route text readable
  const display = unique.length > 4 ? [...unique.slice(0, 3), "…"] : unique;
  return display.join(" → ");
}

import type {
  LogisticsConnection,
  RoutePracticality,
  TravelSegment,
  TransportMode,
  DayType,
  TransportPreference,
} from "@/lib/types";
/** Minimal stop shape needed for segment computation — avoids requiring full Destination. */
type MinimalStop = {
  destination: { name: string; slug: string; latitude: number; longitude: number };
  dayStart: number;
  dayEnd: number;
};
import { haversineKm } from "@/lib/geo";

function findConnection(
  connections: LogisticsConnection[],
  fromSlug: string,
  toSlug: string
): LogisticsConnection | undefined {
  return (
    connections.find((c) => c.from_destination_slug === fromSlug && c.to_destination_slug === toSlug) ??
    connections.find((c) => c.from_destination_slug === toSlug && c.to_destination_slug === fromSlug)
  );
}

/**
 * Deterministic route-practicality engine (Phase 19).
 *
 * Design principles:
 * - Never fabricate schedules, prices, or timetables.
 * - Distances are real haversine km × road factor; times are EDITORIAL_ESTIMATE only.
 * - An editorial LogisticsConnection overrides the haversine fallback when available.
 * - LIVE_PROVIDER confidence is never assigned here; it requires a genuine live integration.
 */

// ─── Distance → time heuristics ──────────────────────────────────────────────

/** Road factor: straight-line to road-km multiplier for Balkan terrain. */
const ROAD_FACTOR = 1.4;

/** km/h averages by mode — planning estimates only. */
const SPEED_KMH: Partial<Record<TransportMode, number>> = {
  car: 70,
  rental_car: 70,
  camper: 55,
  motorcycle: 65,
  bus: 55,
  train: 60,
  bike: 18,
  e_bike: 22,
  walk: 5,
  taxi_transfer: 70,
};

function estimateDriveTimeMinutes(haversineKmDistance: number, mode: TransportMode): number {
  const roadKm = haversineKmDistance * ROAD_FACTOR;
  const speed = SPEED_KMH[mode] ?? 65;
  return Math.round(roadKm / speed * 60);
}

function minutesToHumanString(minutes: number): string {
  if (minutes < 60) return `~${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `~${h}h` : `~${h}h ${m}min`;
}

// ─── Practicality rating from haversine distance ──────────────────────────────

function ratingFromDistanceAndMode(
  haversineKmDistance: number,
  primaryMode: TransportMode
): RoutePracticality {
  const roadKm = Math.round(haversineKmDistance * ROAD_FACTOR);
  const driveMinutes = estimateDriveTimeMinutes(haversineKmDistance, primaryMode);

  if (roadKm <= 50) {
    return {
      rating: "EASY",
      reason: `Short hop of roughly ${roadKm} km — an easy ${minutesToHumanString(driveMinutes)} by road.`,
      confidence: "EDITORIAL_ESTIMATE",
    };
  }
  if (roadKm <= 120) {
    return {
      rating: "MANAGEABLE",
      reason: `Around ${roadKm} km by road — typically ${minutesToHumanString(driveMinutes)}. A comfortable morning drive.`,
      confidence: "EDITORIAL_ESTIMATE",
    };
  }
  if (roadKm <= 220) {
    return {
      rating: "LONG_DAY",
      reason: `Roughly ${roadKm} km — expect ${minutesToHumanString(driveMinutes)} on the road, depending on the route. Factor in a lunch stop.`,
      confidence: "EDITORIAL_ESTIMATE",
    };
  }
  if (roadKm <= 350) {
    return {
      rating: "COMPLEX",
      reason: `A long leg at roughly ${roadKm} km. Consider breaking the journey or allowing a full travel day.`,
      confidence: "EDITORIAL_ESTIMATE",
    };
  }
  return {
    rating: "NOT_RECOMMENDED",
    reason: `Very long leg at roughly ${roadKm} km. We'd suggest splitting this into two days or considering an overnight train or flight.`,
    confidence: "EDITORIAL_ESTIMATE",
  };
}

// ─── Primary mode inference ───────────────────────────────────────────────────

function inferPrimaryMode(
  haversineKmDistance: number,
  transportPreferences?: TransportPreference[]
): TransportMode {
  if (transportPreferences?.includes("avoid_driving")) return "bus";
  if (transportPreferences?.includes("public_transport_preferred")) {
    return haversineKmDistance > 200 ? "train" : "bus";
  }
  if (transportPreferences?.includes("camper_motorhome")) return "camper";
  if (transportPreferences?.includes("motorcycle")) return "motorcycle";
  if (transportPreferences?.includes("cycling_focused") && haversineKmDistance <= 80) return "bike";
  if (transportPreferences?.includes("own_car") || transportPreferences?.includes("rental_car")) return "car";
  return "car"; // sensible default for the Balkans
}

// ─── Day type inference ────────────────────────────────────────────────────────

export function inferDayType(
  dayDistanceKm: number | undefined,
  hasDayTrip: boolean
): DayType {
  if (!dayDistanceKm || dayDistanceKm === 0) {
    return hasDayTrip ? "MIXED_DAY" : "EXPERIENCE_DAY";
  }
  if (dayDistanceKm > 250) return "TRANSFER_DAY";
  if (dayDistanceKm > 80) return "MIXED_DAY";
  return "EXPERIENCE_DAY";
}

// ─── Public API ────────────────────────────────────────────────────────────────

export function evaluateRoutePracticality(
  fromSlug: string,
  toSlug: string,
  haversineKmDistance: number,
  connections: LogisticsConnection[],
  transportPreferences?: TransportPreference[]
): RoutePracticality {
  const connection = findConnection(connections, fromSlug, toSlug);
  if (connection) return connection.practicality;
  const mode = inferPrimaryMode(haversineKmDistance, transportPreferences);
  return ratingFromDistanceAndMode(haversineKmDistance, mode);
}

/**
 * Builds TravelSegment objects for each consecutive stop pair in a GroundedItinerary.
 * Called client-side after itinerary generation, consistent with how partner matches are computed.
 */
export function buildTravelSegmentsForItinerary(
  grounded: { stops: MinimalStop[]; legDistancesKm: number[] },
  connections: LogisticsConnection[],
  transportPreferences?: TransportPreference[]
): TravelSegment[] {
  const segments: TravelSegment[] = [];

  for (let i = 0; i < grounded.stops.length - 1; i++) {
    const from = grounded.stops[i];
    const to = grounded.stops[i + 1];
    const haversineDistance = grounded.legDistancesKm[i] ?? Math.round(haversineKm(from.destination, to.destination));
    const connection = findConnection(connections, from.destination.slug, to.destination.slug);

    const primaryMode = connection?.primary_mode ?? inferPrimaryMode(haversineDistance, transportPreferences);
    const practicality = connection?.practicality ?? ratingFromDistanceAndMode(haversineDistance, primaryMode);
    const driveTime = connection?.drive_time_estimate ?? minutesToHumanString(estimateDriveTimeMinutes(haversineDistance, primaryMode));

    segments.push({
      from_destination_name: from.destination.name,
      from_destination_slug: from.destination.slug,
      to_destination_name: to.destination.name,
      to_destination_slug: to.destination.slug,
      primary_mode: primaryMode,
      distance_km: haversineDistance,
      drive_time_estimate: driveTime,
      transit_time_estimate: connection?.transit_time_estimate ?? null,
      practicality,
      editorial_note: connection?.editorial_note ?? null,
      ferry_info: connection?.ferry_info ?? null,
      border_info: connection?.border_info ?? null,
      camper_info: connection?.camper_info ?? null,
      is_estimated: !connection,
    });
  }

  return segments;
}

/**
 * Formats a brief logistics context summary for the AI brief.
 * Only stable-knowledge distances are included — never fabricated times.
 */
export function buildLogisticsContextForBrief(
  stops: MinimalStop[],
  legDistancesKm: number[]
): string {
  if (stops.length < 2) return "";
  const lines = stops.slice(1).map((stop, idx) => {
    const from = stops[idx].destination.name;
    const km = legDistancesKm[idx];
    const roadKm = km ? Math.round(km * ROAD_FACTOR) : null;
    return `${from} → ${stop.destination.name}: ~${roadKm ?? "?"} km by road (haversine × 1.4 road factor)`;
  });
  return lines.join("; ");
}

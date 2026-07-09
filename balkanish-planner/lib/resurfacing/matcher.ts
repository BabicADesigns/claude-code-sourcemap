import type {
  InspirationCapture,
  ResurfacingReason,
  ResurfacingDistanceMetric,
  ResurfacingCandidate,
  ResurfacingHistoryEntry,
  ResurfacingPolicyConfig,
  ResurfacingWindow,
  TravelFindMatchContext,
} from "@/lib/types";
import type { SavedItinerary } from "@/lib/types";
import { computeRelevanceScore, deriveConfidence } from "./ranker";
import { isSuppressed, findLatestEntry } from "./fatigue";
import { BALKAN_PLACES } from "@/lib/capture/place-resolver";

// ---------------------------------------------------------------------------
// Haversine distance (straight-line, no routing API)
// ---------------------------------------------------------------------------

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---------------------------------------------------------------------------
// Name normalization (accent-fold + lowercase)
// ---------------------------------------------------------------------------

function normalizeName(text: string): string {
  return text
    .toLowerCase()
    .replace(/[čć]/g, "c")
    .replace(/[đ]/g, "d")
    .replace(/[šš]/g, "s")
    .replace(/[žž]/g, "z")
    .replace(/[ë]/g, "e")
    .trim();
}

function namesMatch(a: string, b: string): boolean {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  return na === nb || na.includes(nb) || nb.includes(na);
}

// ---------------------------------------------------------------------------
// Country extraction from map_points (for multi-country trips)
// ---------------------------------------------------------------------------

/** Extracts unique country codes present in the trip. */
export function extractTripCountryCodes(itinerary: SavedItinerary["itinerary_json"]): string[] {
  if (itinerary.country) return [itinerary.country];
  // Multi-country: derive from map_point slugs via BALKAN_PLACES
  const codes = new Set<string>();
  for (const mp of itinerary.map_points ?? []) {
    const slug = mp.slug.toLowerCase();
    const dest = normalizeName(mp.destination);
    for (const place of BALKAN_PLACES) {
      for (const kw of place.keywords) {
        if (normalizeName(kw) === dest || normalizeName(kw) === slug) {
          codes.add(place.country_code);
          break;
        }
      }
    }
  }
  if (codes.size === 0 && itinerary.map_points?.length) {
    // Fallback: nothing matched — caller already has candidate finds from DB
    // Return an empty set; the finds array is the ground truth
  }
  return Array.from(codes);
}

// ---------------------------------------------------------------------------
// Lifecycle → ResurfacingWindow
// ---------------------------------------------------------------------------

function lifecycleToWindow(lifecycle: string, todayDayNumber: number | null): ResurfacingWindow {
  if (lifecycle === "PLANNING") return "PLANNING";
  if (lifecycle === "PRE_TRIP") return "PRE_TRIP";
  if (lifecycle === "COMPLETED") return "POST_TRIP";
  // IN_TRIP / DEPARTURE_DAY
  if (todayDayNumber !== null) return "LIVE_TRIP";
  return "LIVE_TRIP";
}

// ---------------------------------------------------------------------------
// Map point type alias (from GeneratedItinerary schema)
// ---------------------------------------------------------------------------

interface MapPoint {
  destination: string;
  slug: string;
  latitude: number;
  longitude: number;
  day: number;
  is_day_trip: boolean;
}

// ---------------------------------------------------------------------------
// Per-capture matching
// ---------------------------------------------------------------------------

function matchCapture(
  capture: InspirationCapture,
  mapPoints: MapPoint[],
  interests: string[],
  policy: ResurfacingPolicyConfig,
  todayDayNumber: number | null
): {
  reasons: ResurfacingReason[];
  distanceKm: number | null;
  distanceMetric: ResurfacingDistanceMetric | null;
  matchedDayNumber: number | null;
} {
  const reasons: ResurfacingReason[] = [];
  let minDistanceKm: number | null = null;
  let nearestMapPoint: MapPoint | null = null;
  let matchedDayNumber: number | null = null;

  const captureName = capture.place_name ? normalizeName(capture.place_name) : null;
  const hasCoords =
    capture.latitude !== null &&
    capture.longitude !== null &&
    capture.resolution_confidence >= policy.minCaptureConfidenceForGeo;

  for (const mp of mapPoints) {
    // Name-based: does this find's place match this map_point?
    if (captureName && namesMatch(capture.place_name!, mp.destination)) {
      if (!reasons.includes("ON_ROUTE")) reasons.push("ON_ROUTE");
      if (!reasons.includes("SAME_DESTINATION")) reasons.push("SAME_DESTINATION");
      if (matchedDayNumber === null) matchedDayNumber = mp.day;
    }

    // Coordinate-based: haversine from capture to map_point
    if (hasCoords) {
      const dist = haversineKm(
        capture.latitude!,
        capture.longitude!,
        mp.latitude,
        mp.longitude
      );
      if (minDistanceKm === null || dist < minDistanceKm) {
        minDistanceKm = dist;
        nearestMapPoint = mp;
      }
    }
  }

  // Apply distance-based reasons (only when coordinates were available)
  if (minDistanceKm !== null && nearestMapPoint !== null) {
    if (minDistanceKm <= policy.nearStopMaxDistanceKm) {
      const reason: ResurfacingReason = nearestMapPoint.is_day_trip
        ? "NEAR_DAY_STOP"
        : "NEAR_OVERNIGHT_STOP";
      if (!reasons.includes(reason)) reasons.push(reason);
      if (matchedDayNumber === null) matchedDayNumber = nearestMapPoint.day;
    } else if (minDistanceKm <= policy.nearRouteMaxDistanceKm) {
      if (!reasons.includes("NEAR_ROUTE")) reasons.push("NEAR_ROUTE");
      if (matchedDayNumber === null) matchedDayNumber = nearestMapPoint.day;
    }
  }

  // DAY_AHEAD: match is relevant for tomorrow
  if (todayDayNumber !== null && matchedDayNumber === todayDayNumber + 1) {
    if (!reasons.includes("UPCOMING_DAY_OPPORTUNITY")) reasons.push("UPCOMING_DAY_OPPORTUNITY");
  }

  // Interest match: capture's place_type aligns with trip interests
  if (capture.place_type && interests.length > 0) {
    const placeTypeToInterests: Partial<Record<string, string[]>> = {
      NATIONAL_PARK: ["Hiking & nature"],
      NATURAL_FEATURE: ["Hiking & nature"],
      COASTAL_AREA: ["Hidden beaches & coves"],
      HISTORICAL_SITE: ["History & old towns"],
      FOOD_OR_DRINK: ["Wine & gastronomy"],
      CITY_OR_TOWN: ["History & old towns", "Local culture & traditions"],
    };
    const relatedInterests = placeTypeToInterests[capture.place_type] ?? [];
    if (relatedInterests.some((i) => interests.includes(i))) {
      if (!reasons.includes("TRIP_INTEREST_MATCH")) reasons.push("TRIP_INTEREST_MATCH");
    }
  }

  // Fallback: country match only (already guaranteed by getFindsNearDestinations)
  if (reasons.length === 0) {
    reasons.push("SAME_REGION");
  }

  const distanceMetric: ResurfacingDistanceMetric | null =
    minDistanceKm !== null ? "GEOGRAPHIC_DISTANCE" : null;

  return { reasons, distanceKm: minDistanceKm, distanceMetric, matchedDayNumber };
}

// ---------------------------------------------------------------------------
// Public: compute resurfacing candidates
// ---------------------------------------------------------------------------

/**
 * Takes candidate finds (already country-filtered by getFindsNearDestinations),
 * runs them through matching + ranking + fatigue, and returns the candidates
 * that should be shown — sorted by relevanceScore descending, limited to
 * policy.maxResurfacedFindsShown.
 *
 * This is a pure function: no I/O.
 */
export function computeResurfacingCandidates(
  trip: SavedItinerary,
  candidateFinds: InspirationCapture[],
  history: ResurfacingHistoryEntry[],
  policy: ResurfacingPolicyConfig,
  lifecycle: string,
  todayDayNumber: number | null,
  departureDateString: string | null
): ResurfacingCandidate[] {
  const nowIso = new Date().toISOString();
  const mapPoints = (trip.itinerary_json.map_points ?? []) as MapPoint[];
  const window = lifecycleToWindow(lifecycle, todayDayNumber);

  const candidates: ResurfacingCandidate[] = [];

  for (const capture of candidateFinds) {
    if (capture.resolution_status === "DISMISSED") continue;

    const latestEntry = findLatestEntry(history, capture.id, trip.id);
    if (isSuppressed(latestEntry, nowIso)) continue;

    const { reasons, distanceKm, distanceMetric, matchedDayNumber } = matchCapture(
      capture,
      mapPoints,
      trip.interests,
      policy,
      todayDayNumber
    );

    const confidence = deriveConfidence(reasons);
    const relevanceScore = computeRelevanceScore(
      reasons,
      confidence,
      capture.resolution_confidence
    );

    if (relevanceScore < policy.minScoreToSurface) continue;

    // Compute the date string for the matched day
    let matchedDayDate: string | null = null;
    if (matchedDayNumber !== null && departureDateString) {
      const dep = new Date(departureDateString);
      dep.setDate(dep.getDate() + matchedDayNumber - 1);
      matchedDayDate = dep.toISOString().split("T")[0];
    }

    const context: TravelFindMatchContext = {
      tripId: trip.id,
      tripTitle: trip.title ?? null,
      lifecycle: window,
      matchedDayNumber,
      matchedDayDate,
    };

    candidates.push({
      match: {
        captureId: capture.id,
        context,
        reasons,
        confidence,
        distanceKm,
        distanceMetric,
        relevanceScore,
      },
      capture,
      lastResurfacedAt: latestEntry?.resurfaced_at ?? null,
      resurfaceCount: history.filter((h) => h.capture_id === capture.id && h.trip_id === trip.id).length,
      suppressedUntil: latestEntry?.suppressed_until ?? null,
    });
  }

  // Sort by score descending, then by recency of capture
  candidates.sort((a, b) => {
    const scoreDiff = b.match.relevanceScore - a.match.relevanceScore;
    if (scoreDiff !== 0) return scoreDiff;
    return b.capture.captured_at.localeCompare(a.capture.captured_at);
  });

  return candidates.slice(0, policy.maxResurfacedFindsShown);
}

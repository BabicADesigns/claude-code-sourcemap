import type { Country, VerificationStatus } from "@/lib/types";
import { COUNTRIES } from "@/lib/types";
import { haversineKm, type LatLng } from "@/lib/geo";
import { mockDestinations } from "@/lib/data/destinations-mock";

/**
 * Hand-authored bounding boxes for the 5 Balkan countries the planner covers. Deliberately loose
 * (covers territorial waters/islands) — this is a plausibility check, not a precise border lookup.
 * A real boundary service (Stage 4 in docs/ai-discovery-architecture.md) would replace this.
 */
const COUNTRY_BOUNDS: Record<Country, { minLat: number; maxLat: number; minLng: number; maxLng: number }> = {
  Croatia: { minLat: 42.0, maxLat: 46.6, minLng: 13.0, maxLng: 19.5 },
  "Bosnia and Herzegovina": { minLat: 42.5, maxLat: 45.3, minLng: 15.6, maxLng: 19.7 },
  Montenegro: { minLat: 41.8, maxLat: 43.6, minLng: 18.3, maxLng: 20.4 },
  Serbia: { minLat: 41.8, maxLat: 46.2, minLng: 18.8, maxLng: 23.1 },
  Slovenia: { minLat: 45.4, maxLat: 46.9, minLng: 13.3, maxLng: 16.7 },
};

/** Maximum plausible distance (km) between an AI-suggested place and the anchor it claims to be "near." */
const MAX_ANCHOR_DISTANCE_KM = 120;

export interface UnverifiedSuggestion {
  name: string;
  region: string;
  country: Country;
  latitude: number;
  longitude: number;
}

export interface VerificationResult {
  status: VerificationStatus;
  /** 0–1, computed entirely from the checks below — never supplied by the AI itself. */
  confidence: number;
}

function isWithinCountryBounds(country: Country, point: LatLng): boolean {
  const bounds = COUNTRY_BOUNDS[country];
  return (
    point.latitude >= bounds.minLat &&
    point.latitude <= bounds.maxLat &&
    point.longitude >= bounds.minLng &&
    point.longitude <= bounds.maxLng
  );
}

function looksLikePlaceholderName(name: string): boolean {
  const trimmed = name.trim();
  if (trimmed.length < 2) return true;
  if (/^(unknown|n\/a|none|tbd|untitled|example)$/i.test(trimmed)) return true;
  return false;
}

function matchesCuratedDestination(name: string): boolean {
  const normalized = name.trim().toLowerCase();
  return mockDestinations.some((destination) => destination.name.trim().toLowerCase() === normalized);
}

/**
 * Resolves a free-text place name to coordinates by matching against the curated dataset's
 * names and regions. Returns null when nothing matches — callers treat that as "can't verify
 * proximity," not as a rejection signal, since plenty of real anchors (e.g. "Mostar") may not
 * be regions of any curated destination.
 */
export function resolveAnchorCoordinates(placeName: string): LatLng | null {
  const normalized = placeName.trim().toLowerCase();
  if (!normalized) return null;
  const match = mockDestinations.find(
    (destination) =>
      destination.name.trim().toLowerCase() === normalized || destination.region.trim().toLowerCase() === normalized
  );
  if (match) return { latitude: match.latitude, longitude: match.longitude };
  const partial = mockDestinations.find(
    (destination) =>
      destination.name.toLowerCase().includes(normalized) || normalized.includes(destination.name.toLowerCase())
  );
  return partial ? { latitude: partial.latitude, longitude: partial.longitude } : null;
}

/**
 * Deterministic, structural/geographic plausibility check for an AI-proposed destination.
 * Never confirms a place is real — only that it isn't obviously fabricated: a real country,
 * coordinates inside that country's rough bounds, a sane name, not a duplicate of a curated
 * destination, and (when an anchor place was given) a plausible distance from it.
 */
export function verifyDestinationCandidate(suggestion: UnverifiedSuggestion, anchor?: LatLng | null): VerificationResult {
  if (!COUNTRIES.includes(suggestion.country)) {
    return { status: "rejected", confidence: 0 };
  }
  if (looksLikePlaceholderName(suggestion.name) || !suggestion.region.trim()) {
    return { status: "rejected", confidence: 0 };
  }
  if (matchesCuratedDestination(suggestion.name)) {
    return { status: "rejected", confidence: 0 };
  }

  const point: LatLng = { latitude: suggestion.latitude, longitude: suggestion.longitude };
  const hasValidCoordinates = Number.isFinite(point.latitude) && Number.isFinite(point.longitude);
  if (!hasValidCoordinates || !isWithinCountryBounds(suggestion.country, point)) {
    return { status: "rejected", confidence: 0 };
  }

  let confidence = 0.6;

  if (anchor) {
    const distanceKm = haversineKm(point, anchor);
    if (distanceKm > MAX_ANCHOR_DISTANCE_KM) {
      return { status: "rejected", confidence: 0 };
    }
    confidence += 0.15 * (1 - Math.min(distanceKm, MAX_ANCHOR_DISTANCE_KM) / MAX_ANCHOR_DISTANCE_KM);
  }

  if (suggestion.region.trim().length >= 3) {
    confidence += 0.1;
  }

  confidence = Math.min(0.95, Math.round(confidence * 100) / 100);

  return { status: "structurally_checked", confidence };
}

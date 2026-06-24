import type {
  CultureNote,
  Destination,
  DestinationCategory,
  DayTrip,
  FoodFind,
  ItineraryFocus,
  ScoreKey,
  TravelStyle,
} from "@/lib/types";
import { DESTINATION_SCORES } from "@/lib/types";
import { mockDestinations } from "@/lib/data/destinations-mock";
import { mockDayTrips } from "@/lib/data/day-trips";
import { mockFoodFinds } from "@/lib/data/food-finds-mock";
import { mockCultureNotes } from "@/lib/data/culture-notes-mock";
import { getDestinationsForFocus } from "@/lib/data/itinerary-focus";

/**
 * Deterministic, data-grounded planning logic — no AI calls, no invented places, no invented
 * driving times. Everything here reads from the real destinations/day-trips/food-finds/
 * culture-notes datasets only. The AI layer (lib/ai/itinerary.ts) is fed the output of this
 * module as a fixed factual skeleton and is only allowed to add prose around it.
 */

// --- Focus derivation (no new UI — derived from the existing travelStyle + interests inputs) ---

const TRAVEL_STYLE_FOCUS_WEIGHTS: Record<TravelStyle, Partial<Record<ItineraryFocus, number>>> = {
  slow_and_soulful: { slow_living: 3, coast: 1 },
  food_and_wine: { food: 2, wine: 2 },
  active_outdoors: { national_park: 3, road_trip: 1 },
  culture_and_history: { culture: 3 },
  romantic_getaway: { romantic: 3 },
  family_friendly: { family: 3 },
};

const INTEREST_FOCUS_WEIGHTS: Record<string, Partial<Record<ItineraryFocus, number>>> = {
  "Hidden beaches & coves": { coast: 2 },
  "Wine & gastronomy": { wine: 2, food: 1 },
  "History & old towns": { culture: 2 },
  "Hiking & nature": { national_park: 2 },
  "Island hopping": { coast: 2, road_trip: 1 },
  "Local culture & traditions": { culture: 1, slow_living: 1 },
  Photography: { romantic: 1, coast: 1 },
  "Slow mornings & cafés": { slow_living: 2 },
};

/** Tie-break order when two or more foci score equally. */
const FOCUS_PRIORITY: ItineraryFocus[] = [
  "romantic",
  "family",
  "wine",
  "food",
  "national_park",
  "coast",
  "culture",
  "slow_living",
  "road_trip",
  "mixed",
];

/** Maps the planner's existing travelStyle + interests inputs onto one of the 10 itinerary types. */
export function deriveItineraryFocus(travelStyle: TravelStyle, interests: string[]): ItineraryFocus {
  const scores = new Map<ItineraryFocus, number>();
  const add = (weights: Partial<Record<ItineraryFocus, number>> | undefined) => {
    if (!weights) return;
    for (const [focus, weight] of Object.entries(weights) as [ItineraryFocus, number][]) {
      scores.set(focus, (scores.get(focus) ?? 0) + weight);
    }
  };
  add(TRAVEL_STYLE_FOCUS_WEIGHTS[travelStyle]);
  interests.forEach((interest) => add(INTEREST_FOCUS_WEIGHTS[interest]));

  const maxScore = Math.max(0, ...scores.values());
  if (maxScore === 0) return "mixed";
  const topFoci = FOCUS_PRIORITY.filter((focus) => (scores.get(focus) ?? 0) === maxScore);
  if (topFoci.length >= 3) return "mixed"; // diffuse interests with no clear winner
  return topFoci[0];
}

// --- Geography ---

interface LatLng {
  latitude: number;
  longitude: number;
}

function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Greedy nearest-neighbor ordering, anchored on the best-fit destination, to avoid backtracking. */
function sequenceGeographically(destinations: Destination[]): Destination[] {
  if (destinations.length <= 1) return destinations;
  const remaining = [...destinations];
  const route: Destination[] = [remaining.shift()!];
  while (remaining.length > 0) {
    const last = route[route.length - 1];
    let nearestIdx = 0;
    let nearestDist = Infinity;
    remaining.forEach((candidate, idx) => {
      const dist = haversineKm(last, candidate);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = idx;
      }
    });
    route.push(remaining.splice(nearestIdx, 1)[0]);
  }
  return route;
}

// --- Destination selection & scoring ---

const FOCUS_SCORE_KEYS: Record<ItineraryFocus, ScoreKey[]> = {
  coast: ["sunset_score", "slow_living_score"],
  food: ["food_score"],
  wine: ["food_score", "story_score"],
  slow_living: ["slow_living_score", "local_score"],
  romantic: ["sunset_score", "story_score"],
  family: ["crowd_score", "slow_living_score"],
  culture: ["story_score"],
  national_park: ["story_score", "sunset_score"],
  road_trip: ["story_score"],
  mixed: ["local_score", "story_score"],
};

const INVERTED_SCORE_KEYS = new Set(DESTINATION_SCORES.filter((s) => s.invert).map((s) => s.key));

function scoreDestinationForFocus(destination: Destination, focus: ItineraryFocus): number {
  const keys = FOCUS_SCORE_KEYS[focus];
  const total = keys.reduce((sum, key) => {
    const raw = destination[key];
    return sum + (INVERTED_SCORE_KEYS.has(key) ? 10 - raw : raw);
  }, 0);
  return total / keys.length;
}

function destinationCountForDuration(days: number, poolSize: number): number {
  const ideal = Math.round(days / 2.5);
  return Math.max(2, Math.min(ideal, poolSize, 6));
}

function selectDestinations(focus: ItineraryFocus, durationDays: number): Destination[] {
  const pool = getDestinationsForFocus(focus, mockDestinations);
  const candidates = pool.length > 0 ? pool : mockDestinations;
  const count = destinationCountForDuration(durationDays, candidates.length);
  return [...candidates]
    .sort((a, b) => scoreDestinationForFocus(b, focus) - scoreDestinationForFocus(a, focus))
    .slice(0, count);
}

// --- Day-range assignment ---

export interface ItineraryStop {
  destination: Destination;
  dayStart: number;
  dayEnd: number;
}

function assignDayRanges(destinations: Destination[], durationDays: number): ItineraryStop[] {
  const n = destinations.length;
  const base = Math.floor(durationDays / n);
  const remainder = durationDays % n;
  let day = 1;
  return destinations.map((destination, idx) => {
    const span = Math.max(1, base + (idx < remainder ? 1 : 0));
    const dayStart = day;
    const dayEnd = day + span - 1;
    day = dayEnd + 1;
    return { destination, dayStart, dayEnd };
  });
}

// --- Day trips (precise origin-match only — see audit for the documented coverage gap) ---

export interface GroundedDayTrip {
  dayTrip: DayTrip;
  destination: Destination;
  day: number;
  fromDestinationSlug: string;
}

function attachDayTrips(stops: ItineraryStop[]): GroundedDayTrip[] {
  const selectedSlugs = new Set(stops.map((s) => s.destination.slug));
  const attached: GroundedDayTrip[] = [];
  for (const stop of stops) {
    const matches = mockDayTrips.filter(
      (trip) =>
        trip.origin.toLowerCase() === stop.destination.name.toLowerCase() &&
        trip.destination_slug &&
        !selectedSlugs.has(trip.destination_slug)
    );
    matches.forEach((trip) => {
      const destination = mockDestinations.find((d) => d.slug === trip.destination_slug);
      if (!destination) return;
      attached.push({ dayTrip: trip, destination, day: stop.dayEnd, fromDestinationSlug: stop.destination.slug });
    });
  }
  return attached;
}

// --- Map points ---

export interface MapPoint {
  destination: string;
  slug: string;
  latitude: number;
  longitude: number;
  day: number;
  category: DestinationCategory;
  is_day_trip: boolean;
}

function buildMapPoints(stops: ItineraryStop[], dayTrips: GroundedDayTrip[]): MapPoint[] {
  const points: MapPoint[] = [];
  stops.forEach((stop) => {
    for (let day = stop.dayStart; day <= stop.dayEnd; day++) {
      points.push({
        destination: stop.destination.name,
        slug: stop.destination.slug,
        latitude: stop.destination.latitude,
        longitude: stop.destination.longitude,
        day,
        category: stop.destination.category,
        is_day_trip: false,
      });
    }
  });
  dayTrips.forEach(({ destination, day }) => {
    points.push({
      destination: destination.name,
      slug: destination.slug,
      latitude: destination.latitude,
      longitude: destination.longitude,
      day,
      category: destination.category,
      is_day_trip: true,
    });
  });
  return points.sort((a, b) => a.day - b.day);
}

// --- Hidden gems, food, and culture grounding ---

const HIDDEN_GEM_CATEGORIES: DestinationCategory[] = ["island_secrets", "quiet_escapes", "local_favorites"];

function selectHiddenGems(selected: Destination[], limit = 4): Destination[] {
  const selectedSlugs = new Set(selected.map((d) => d.slug));
  return mockDestinations
    .filter((d) => !selectedSlugs.has(d.slug) && HIDDEN_GEM_CATEGORIES.includes(d.category))
    .sort((a, b) => b.local_score - b.crowd_score - (a.local_score - a.crowd_score))
    .slice(0, limit);
}

function regionsOverlap(a: string, b: string): boolean {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  return x.includes(y) || y.includes(x);
}

/** Real FoodFind entries whose region plausibly covers this destination, regional matches first. */
export function findFoodFindsForDestination(destination: Destination): FoodFind[] {
  return mockFoodFinds
    .filter((food) => {
      const isUniversal = food.region.toLowerCase().includes("balkans");
      return (
        isUniversal || regionsOverlap(food.region, destination.region) || regionsOverlap(food.region, destination.country)
      );
    })
    .sort((a, b) => Number(a.region.toLowerCase().includes("balkans")) - Number(b.region.toLowerCase().includes("balkans")));
}

function matchFoodFinds(destinations: Destination[]): FoodFind[] {
  const matched = new Map<string, FoodFind>();
  destinations.forEach((destination) => findFoodFindsForDestination(destination).forEach((food) => matched.set(food.slug, food)));
  return [...matched.values()];
}

function matchCultureNotes(destinations: Destination[]): CultureNote[] {
  const regionMatches = mockCultureNotes.filter(
    (note) => note.region !== null && destinations.some((d) => regionsOverlap(note.region!, d.region))
  );
  const general = mockCultureNotes.filter((note) => note.region === null);
  const seen = new Set<string>();
  return [...regionMatches, ...general].filter((note) => {
    if (seen.has(note.slug)) return false;
    seen.add(note.slug);
    return true;
  });
}

// --- Assembly ---

export interface GroundedItinerary {
  focus: ItineraryFocus;
  stops: ItineraryStop[];
  dayTrips: GroundedDayTrip[];
  mapPoints: MapPoint[];
  hiddenGems: Destination[];
  foodFinds: FoodFind[];
  cultureNotes: CultureNote[];
  /** Real haversine distance (km) between each consecutive stop, in route order. */
  legDistancesKm: number[];
}

export function buildGroundedItinerary(focus: ItineraryFocus, durationDays: number): GroundedItinerary {
  const selected = selectDestinations(focus, durationDays);
  const sequenced = sequenceGeographically(selected);
  const stops = assignDayRanges(sequenced, durationDays);
  const dayTrips = attachDayTrips(stops);
  const legDistancesKm = stops
    .slice(1)
    .map((stop, idx) => Math.round(haversineKm(stops[idx].destination, stop.destination)));

  return {
    focus,
    stops,
    dayTrips,
    mapPoints: buildMapPoints(stops, dayTrips),
    hiddenGems: selectHiddenGems(sequenced),
    foodFinds: matchFoodFinds(sequenced),
    cultureNotes: matchCultureNotes(sequenced),
    legDistancesKm,
  };
}

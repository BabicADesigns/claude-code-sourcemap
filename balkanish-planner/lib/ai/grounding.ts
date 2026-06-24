import type {
  Country,
  CultureNote,
  Destination,
  DestinationCategory,
  DayTrip,
  FoodFind,
  ItineraryFocus,
  PlannerStyle,
  ScoreKey,
  TravelType,
  TripPace,
} from "@/lib/types";
import { DESTINATION_SCORES, PLANNER_STYLE_LABELS } from "@/lib/types";
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
 *
 * Phase 8 adds: country + pace as selection inputs, a five-factor scoring breakdown per
 * destination (style/food/culture/nature/pacing — see scoreDestination), deterministic
 * selection-reason sentences built from that same breakdown, and a coverageScore diagnostic
 * (docs/ai-expansion-roadmap.md Stage 1) that flags when the curated pool had to widen beyond
 * the requested country.
 */

// --- Focus derivation (no new UI — derived from the existing plannerStyle + interests inputs) ---

const PLANNER_STYLE_FOCUS_WEIGHTS: Record<PlannerStyle, Partial<Record<ItineraryFocus, number>>> = {
  slow_travel: { slow_living: 3, coast: 1 },
  food_and_wine: { food: 2, wine: 2 },
  road_trip: { road_trip: 3, culture: 1 },
  romantic_escape: { romantic: 3 },
  family: { family: 3 },
  culture: { culture: 3 },
  nature: { national_park: 3, coast: 1 },
  mixed: {},
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

/** Maps the planner wizard's plannerStyle + interests inputs onto one of the 10 itinerary types. */
export function deriveItineraryFocus(plannerStyle: PlannerStyle, interests: string[]): ItineraryFocus {
  const scores = new Map<ItineraryFocus, number>();
  const add = (weights: Partial<Record<ItineraryFocus, number>> | undefined) => {
    if (!weights) return;
    for (const [focus, weight] of Object.entries(weights) as [ItineraryFocus, number][]) {
      scores.set(focus, (scores.get(focus) ?? 0) + weight);
    }
  };
  add(PLANNER_STYLE_FOCUS_WEIGHTS[plannerStyle]);
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

// --- Destination scoring (five factors: style, food, culture, nature, pacing) ---

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

const NATURE_TRAVEL_TYPES: TravelType[] = ["national_park", "mountain_escape", "island_escape"];
const FOOD_TRAVEL_TYPES: TravelType[] = ["food_destination", "wine_region"];
const CULTURE_TRAVEL_TYPES: TravelType[] = ["historic_town", "cultural_experience"];

/** 0–1: how well a destination fits the itinerary's derived focus (sunset/story/food/etc — see FOCUS_SCORE_KEYS). */
function styleMatchScore(destination: Destination, focus: ItineraryFocus): number {
  const keys = FOCUS_SCORE_KEYS[focus];
  const total = keys.reduce((sum, key) => {
    const raw = destination[key];
    return sum + (INVERTED_SCORE_KEYS.has(key) ? 10 - raw : raw);
  }, 0);
  return total / keys.length / 10;
}

/** 0–1: food/drink strength — the destination's own food_score, with a small bonus if it's a named food/wine type. */
function foodMatchScore(destination: Destination): number {
  const base = destination.food_score / 10;
  const bonus = destination.travel_types.some((t) => FOOD_TRAVEL_TYPES.includes(t)) ? 0.1 : 0;
  return Math.min(1, base + bonus);
}

/** 0–1: history/story strength — the destination's own story_score, with a small bonus for historic/cultural types. */
function cultureMatchScore(destination: Destination): number {
  const base = destination.story_score / 10;
  const bonus = destination.travel_types.some((t) => CULTURE_TRAVEL_TYPES.includes(t)) ? 0.1 : 0;
  return Math.min(1, base + bonus);
}

/** 0–1: scenery/outdoor pull — sunset score plus a bonus for being a genuinely uncrowded nature spot, not just photogenic. */
function natureMatchScore(destination: Destination): number {
  const base = (destination.sunset_score + (10 - destination.crowd_score)) / 20;
  const bonus = destination.travel_types.some((t) => NATURE_TRAVEL_TYPES.includes(t)) ? 0.15 : 0;
  return Math.min(1, base + bonus);
}

/**
 * 0–1: how well a destination suits the requested pace. Relaxed pace rewards genuinely calm
 * places (high slow-living, low crowd); active pace rewards places with a lot to actually do
 * (story + food density); balanced sits between the two.
 */
function pacingFitScore(destination: Destination, pace: TripPace): number {
  const calmScore = (destination.slow_living_score + (10 - destination.crowd_score)) / 20;
  const activeScore = (destination.story_score + destination.food_score) / 20;
  if (pace === "relaxed") return calmScore;
  if (pace === "active") return activeScore;
  return (calmScore + activeScore) / 2;
}

export interface DestinationScoreBreakdown {
  styleMatch: number;
  foodMatch: number;
  cultureMatch: number;
  natureMatch: number;
  pacingFit: number;
  total: number;
}

/** Per-plannerStyle weighting of the five score factors above — each row sums to 1. */
const SCORE_WEIGHTS: Record<PlannerStyle, Omit<DestinationScoreBreakdown, "total">> = {
  slow_travel: { styleMatch: 0.35, foodMatch: 0.15, cultureMatch: 0.15, natureMatch: 0.1, pacingFit: 0.25 },
  food_and_wine: { styleMatch: 0.2, foodMatch: 0.45, cultureMatch: 0.15, natureMatch: 0.05, pacingFit: 0.15 },
  road_trip: { styleMatch: 0.3, foodMatch: 0.15, cultureMatch: 0.2, natureMatch: 0.2, pacingFit: 0.15 },
  romantic_escape: { styleMatch: 0.4, foodMatch: 0.15, cultureMatch: 0.15, natureMatch: 0.1, pacingFit: 0.2 },
  family: { styleMatch: 0.3, foodMatch: 0.15, cultureMatch: 0.15, natureMatch: 0.15, pacingFit: 0.25 },
  culture: { styleMatch: 0.25, foodMatch: 0.1, cultureMatch: 0.45, natureMatch: 0.05, pacingFit: 0.15 },
  nature: { styleMatch: 0.25, foodMatch: 0.1, cultureMatch: 0.1, natureMatch: 0.45, pacingFit: 0.1 },
  mixed: { styleMatch: 0.25, foodMatch: 0.2, cultureMatch: 0.2, natureMatch: 0.2, pacingFit: 0.15 },
};

/** The ranking function behind requirement #4 — distance is handled at the route/variant level (legDistancesKm), not per-candidate. */
export function scoreDestination(
  destination: Destination,
  plannerStyle: PlannerStyle,
  focus: ItineraryFocus,
  pace: TripPace
): DestinationScoreBreakdown {
  const styleMatch = styleMatchScore(destination, focus);
  const foodMatch = foodMatchScore(destination);
  const cultureMatch = cultureMatchScore(destination);
  const natureMatch = natureMatchScore(destination);
  const pacingFit = pacingFitScore(destination, pace);
  const weights = SCORE_WEIGHTS[plannerStyle];
  const total =
    styleMatch * weights.styleMatch +
    foodMatch * weights.foodMatch +
    cultureMatch * weights.cultureMatch +
    natureMatch * weights.natureMatch +
    pacingFit * weights.pacingFit;
  return { styleMatch, foodMatch, cultureMatch, natureMatch, pacingFit, total };
}

// --- Destination selection ---

/** Below this pool size, a country-restricted search widens rather than risk a repetitive or empty itinerary. */
const MIN_POOL_SIZE = 2;

const PACE_DAYS_PER_STOP: Record<TripPace, number> = { relaxed: 3.5, balanced: 2.5, active: 1.8 };

/** Uncapped "how many stops would feel right" for this duration/pace — used both for selection and as the coverage denominator. */
function idealStopCount(days: number, pace: TripPace): number {
  return Math.max(2, Math.round(days / PACE_DAYS_PER_STOP[pace]));
}

function destinationCountForDuration(days: number, poolSize: number, pace: TripPace): number {
  return Math.max(2, Math.min(idealStopCount(days, pace), poolSize, 6));
}

interface SelectionResult {
  destinations: Destination[];
  /** True when the requested country's pool was too thin and the search widened to the full curated dataset. */
  widenedSearch: boolean;
  /** 0–1 diagnostic: how comfortably the curated pool covered this request — see docs/ai-expansion-roadmap.md Stage 1. */
  coverageScore: number;
}

function poolForCountryAndFocus(
  country: Country | null,
  focus: ItineraryFocus
): { pool: Destination[]; widenedSearch: boolean } {
  if (!country) {
    const focusPool = getDestinationsForFocus(focus, mockDestinations);
    return { pool: focusPool.length > 0 ? focusPool : mockDestinations, widenedSearch: false };
  }
  const countryAll = mockDestinations.filter((d) => d.country === country);
  const countryFocus = getDestinationsForFocus(focus, countryAll);
  if (countryFocus.length >= MIN_POOL_SIZE) return { pool: countryFocus, widenedSearch: false };
  if (countryAll.length >= MIN_POOL_SIZE) return { pool: countryAll, widenedSearch: false };

  // The requested country alone can't support a real trip yet — widen to the full curated
  // dataset rather than fail or repeat the same one or two places. Flagged via widenedSearch
  // so the itinerary can be honest about it instead of silently ignoring the request.
  const allFocus = getDestinationsForFocus(focus, mockDestinations);
  return { pool: allFocus.length > 0 ? allFocus : mockDestinations, widenedSearch: true };
}

function selectDestinations(
  plannerStyle: PlannerStyle,
  focus: ItineraryFocus,
  country: Country | null,
  durationDays: number,
  pace: TripPace
): SelectionResult {
  const { pool, widenedSearch } = poolForCountryAndFocus(country, focus);
  const count = destinationCountForDuration(durationDays, pool.length, pace);
  const ranked = [...pool].sort(
    (a, b) => scoreDestination(b, plannerStyle, focus, pace).total - scoreDestination(a, plannerStyle, focus, pace).total
  );
  const coverageScore = Math.min(1, pool.length / idealStopCount(durationDays, pace));
  return { destinations: ranked.slice(0, count), widenedSearch, coverageScore };
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

// --- Day trips (precise origin-match — Zagreb/Split/Dubrovnik now exist as real Destination entries, so their day trips attach) ---

export interface GroundedDayTrip {
  dayTrip: DayTrip;
  destination: Destination;
  day: number;
  fromDestinationSlug: string;
}

/** How many day trips a route takes on, by pace — relaxed itineraries stay light, active ones pack more in. */
const PACE_MAX_DAY_TRIPS: Record<TripPace, number> = {
  relaxed: 1,
  balanced: 2,
  active: Infinity,
};

function attachDayTrips(stops: ItineraryStop[], pace: TripPace): GroundedDayTrip[] {
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
  return attached.slice(0, PACE_MAX_DAY_TRIPS[pace]);
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

// --- Explainability (requirement #5) — built from the same score breakdown used to rank, never invented ---

export interface SelectionReason {
  destinationSlug: string;
  destinationName: string;
  reason: string;
}

function buildSelectionReason(
  destination: Destination,
  breakdown: DestinationScoreBreakdown,
  plannerStyle: PlannerStyle,
  routeAvgCrowdScore: number
): string {
  const styleLabel = PLANNER_STYLE_LABELS[plannerStyle].toLowerCase();
  const secondaryDims: { score: number; phrase: string }[] = [
    { score: breakdown.foodMatch, phrase: "its food and drink scene" },
    { score: breakdown.cultureMatch, phrase: "its history and story" },
    { score: breakdown.natureMatch, phrase: "its scenery and the outdoors" },
  ];
  const bestSecondary = secondaryDims.reduce((best, dim) => (dim.score > best.score ? dim : best));

  const primaryClause =
    breakdown.styleMatch >= bestSecondary.score
      ? `it matches your ${styleLabel} preference`
      : `it's a strong fit for ${bestSecondary.phrase}`;

  const crowdDelta = destination.crowd_score - routeAvgCrowdScore;
  const paceClause =
    crowdDelta < -1
      ? " and provides a slower, quieter pace than the rest of this route"
      : crowdDelta > 1
        ? " and brings more energy and bustle than the rest of this route"
        : "";

  return `We selected ${destination.name} because ${primaryClause}${paceClause}.`;
}

function buildSelectionReasons(
  stops: ItineraryStop[],
  plannerStyle: PlannerStyle,
  focus: ItineraryFocus,
  pace: TripPace
): SelectionReason[] {
  const routeAvgCrowdScore =
    stops.reduce((sum, stop) => sum + stop.destination.crowd_score, 0) / Math.max(stops.length, 1);
  return stops.map((stop) => {
    const breakdown = scoreDestination(stop.destination, plannerStyle, focus, pace);
    return {
      destinationSlug: stop.destination.slug,
      destinationName: stop.destination.name,
      reason: buildSelectionReason(stop.destination, breakdown, plannerStyle, routeAvgCrowdScore),
    };
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
  selectionReasons: SelectionReason[];
  /** True when the requested country's curated pool was too thin and the search widened beyond it. */
  widenedSearch: boolean;
  /** 0–1 diagnostic: how comfortably the curated pool covered this request — see docs/ai-expansion-roadmap.md Stage 1. */
  coverageScore: number;
}

export function buildGroundedItinerary(
  plannerStyle: PlannerStyle,
  focus: ItineraryFocus,
  country: Country | null,
  durationDays: number,
  pace: TripPace
): GroundedItinerary {
  const { destinations: selected, widenedSearch, coverageScore } = selectDestinations(
    plannerStyle,
    focus,
    country,
    durationDays,
    pace
  );
  const sequenced = sequenceGeographically(selected);
  const stops = assignDayRanges(sequenced, durationDays);
  const dayTrips = attachDayTrips(stops, pace);
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
    selectionReasons: buildSelectionReasons(stops, plannerStyle, focus, pace),
    widenedSearch,
    coverageScore,
  };
}

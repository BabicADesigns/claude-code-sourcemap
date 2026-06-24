import type { Destination, DayTrip, ItineraryFocus, TravelType } from "@/lib/types";
import { mockDestinations } from "@/lib/data/destinations-mock";
import { mockDayTrips } from "@/lib/data/day-trips";

/**
 * Maps each itinerary focus the planner can be asked for onto the travel types
 * that satisfy it. Pure data — no AI calls. Lets the planner narrow its destination
 * pool to a relevant subset before any generation step exists.
 */
export const ITINERARY_FOCUS_TRAVEL_TYPES: Record<ItineraryFocus, TravelType[]> = {
  coast: ["island_escape", "weekend_escape"],
  food: ["food_destination"],
  wine: ["wine_region"],
  slow_living: ["slow_living", "mountain_escape"],
  culture: ["historic_town", "cultural_experience"],
  national_park: ["national_park"],
  family: ["family_friendly"],
  romantic: ["romantic"],
  road_trip: ["road_trip_stop"],
  mixed: [
    "island_escape",
    "mountain_escape",
    "national_park",
    "historic_town",
    "food_destination",
    "wine_region",
    "romantic",
    "family_friendly",
    "road_trip_stop",
    "cultural_experience",
    "slow_living",
    "weekend_escape",
  ],
};

export function getDestinationsForFocus(
  focus: ItineraryFocus,
  destinations: Destination[] = mockDestinations
): Destination[] {
  const types = ITINERARY_FOCUS_TRAVEL_TYPES[focus];
  return destinations.filter((destination) => destination.travel_types.some((type) => types.includes(type)));
}

export function getDayTripsForFocus(
  focus: ItineraryFocus,
  dayTrips: DayTrip[] = mockDayTrips,
  destinations: Destination[] = mockDestinations
): DayTrip[] {
  const matchingSlugs = new Set(getDestinationsForFocus(focus, destinations).map((d) => d.slug));
  return dayTrips.filter((trip) => trip.destination_slug && matchingSlugs.has(trip.destination_slug));
}

/** Destination counts per focus, for surfacing "X destinations match" copy before generation exists. */
export function getFocusCoverage(destinations: Destination[] = mockDestinations): Record<ItineraryFocus, number> {
  const foci = Object.keys(ITINERARY_FOCUS_TRAVEL_TYPES) as ItineraryFocus[];
  return Object.fromEntries(foci.map((focus) => [focus, getDestinationsForFocus(focus, destinations).length])) as Record<
    ItineraryFocus,
    number
  >;
}

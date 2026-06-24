import type { GeneratedItinerary } from "@/lib/ai/itinerary";
import type { DestinationCategory } from "@/lib/types";
import type { LatLng } from "@/lib/maps/projection";

export interface MapStop extends LatLng {
  slug: string;
  name: string;
  category: DestinationCategory;
  dayStart: number;
  dayEnd: number;
  /** 1-based position along the route, in visit order. */
  order: number;
}

export interface MapDayTrip extends LatLng {
  slug: string;
  name: string;
  day: number;
  driveTime: string;
  fromStopSlug: string;
  fromStopName: string;
}

export interface MapModel {
  stops: MapStop[];
  dayTrips: MapDayTrip[];
}

/**
 * Derives the map's stops/day-trips from the grounded itinerary's map_points + day_trips —
 * no new facts, just reshaping what lib/ai/grounding.ts already produced for rendering.
 */
export function buildMapModel(itinerary: GeneratedItinerary): MapModel {
  const overnightPoints = itinerary.map_points.filter((p) => !p.is_day_trip);
  const stops: MapStop[] = [];
  const stopBySlug = new Map<string, MapStop>();

  overnightPoints.forEach((point) => {
    const existing = stopBySlug.get(point.slug);
    if (existing) {
      existing.dayStart = Math.min(existing.dayStart, point.day);
      existing.dayEnd = Math.max(existing.dayEnd, point.day);
      return;
    }
    const stop: MapStop = {
      slug: point.slug,
      name: point.destination,
      latitude: point.latitude,
      longitude: point.longitude,
      category: point.category,
      dayStart: point.day,
      dayEnd: point.day,
      order: stops.length + 1,
    };
    stops.push(stop);
    stopBySlug.set(point.slug, stop);
  });

  const stopByName = new Map(stops.map((stop) => [stop.name, stop]));
  const dayTripPointByKey = new Map(
    itinerary.map_points.filter((p) => p.is_day_trip).map((p) => [`${p.slug}-${p.day}`, p])
  );

  const dayTrips: MapDayTrip[] = itinerary.day_trips.map((trip) => {
    const point = dayTripPointByKey.get(`${trip.destination_slug}-${trip.day}`);
    const fromStop = stopByName.get(trip.origin);
    return {
      slug: trip.destination_slug,
      name: trip.destination_name,
      latitude: point?.latitude ?? fromStop?.latitude ?? 0,
      longitude: point?.longitude ?? fromStop?.longitude ?? 0,
      day: trip.day,
      driveTime: trip.drive_time,
      fromStopSlug: fromStop?.slug ?? "",
      fromStopName: trip.origin,
    };
  });

  return { stops, dayTrips };
}

export function mapModelPoints(model: MapModel): LatLng[] {
  return [...model.stops, ...model.dayTrips];
}

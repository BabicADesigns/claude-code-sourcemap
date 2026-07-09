import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { LiveTripToday } from "@/components/planner/live-trip-today";
import { getCurrentUser, isSupabaseConfigured } from "@/lib/supabase/server";
import { getSavedItineraryById } from "@/lib/data/itineraries";
import { getReadinessItems } from "@/lib/data/trip-readiness";
import { getLiveTripItemStates } from "@/lib/data/live-trip";
import { getCulturalInsights } from "@/lib/data/cultural-insights";
import { getLocalPhrases } from "@/lib/data/local-phrases";
import { resolveInsightsForDestination } from "@/lib/ai/cultural-resolver";
import { getFindsNearDestinations } from "@/lib/data/inspiration-captures";
import { getResurfacingHistoryForTrip } from "@/lib/data/resurfacing-history";
import { computeResurfacingCandidates, extractTripCountryCodes } from "@/lib/resurfacing/matcher";
import { DEFAULT_RESURFACING_POLICY } from "@/lib/resurfacing/policy";
import { computeCurrentMoment, getTodayDateString } from "@/lib/ai/live-trip";
import type { ResurfacingCandidate } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tripId: string }>;
}): Promise<Metadata> {
  return { title: "Today — Live Trip" };
}

export default async function LiveTripTodayPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <div>
        <PageHeader eyebrow="Live Trip" title="Today" />
        <div className="container py-8 sm:py-12">
          <p className="max-w-md font-serif text-foreground/80">
            Live Trip will come alive once the Balkanish Planner is linked to its Supabase project.
          </p>
        </div>
      </div>
    );
  }

  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const trip = await getSavedItineraryById(user.id, tripId);
  if (!trip) notFound();

  // Extract country codes from the trip for find matching
  const tripCountryCodes = extractTripCountryCodes(trip.itinerary_json);

  // Fetch all data in parallel — these are independent reads
  const [itemStates, readinessItems, allInsights, allPhrases, candidateFinds, resurfacingHistory] =
    await Promise.all([
      getLiveTripItemStates(user.id, tripId),
      getReadinessItems(user.id, tripId),
      getCulturalInsights(),
      getLocalPhrases(),
      tripCountryCodes.length > 0
        ? getFindsNearDestinations(user.id, tripCountryCodes)
        : Promise.resolve([]),
      getResurfacingHistoryForTrip(user.id, tripId),
    ]);

  // Resolve cultural insights for the first destination in the itinerary
  // (best proxy for "where are you today" given prose-only itinerary model)
  const firstMapPoint = trip.itinerary_json.map_points?.[0];
  const destinationSlug = firstMapPoint?.slug ?? "";
  const countryCode = trip.itinerary_json.country ?? null;

  const culturalInsights = resolveInsightsForDestination(
    allInsights,
    destinationSlug,
    null,
    countryCode,
    6
  );

  // Filter phrases relevant to this trip's country
  const countryPhrases = allPhrases.filter((p) =>
    p.applicable_country_codes.some(
      (c) => countryCode && c.toLowerCase() === countryCode.toLowerCase().slice(0, 2)
    )
  );

  // Compute resurfacing candidates server-side (pure function, no extra I/O)
  const todayString = getTodayDateString();
  const moment = computeCurrentMoment(trip.departure_date, trip.duration_days, todayString);
  const resurfacedCandidates: ResurfacingCandidate[] = computeResurfacingCandidates(
    trip,
    candidateFinds,
    resurfacingHistory,
    DEFAULT_RESURFACING_POLICY,
    moment.lifecycle,
    moment.current_day_number,
    trip.departure_date ?? null
  );

  const tripTitle = trip.title ?? trip.itinerary_json.trip_title;

  return (
    <div>
      <PageHeader
        eyebrow="Live Trip"
        title={tripTitle}
        description={`${trip.duration_days} days · ${trip.month}`}
      />
      <div className="container py-8 sm:py-12">
        <div className="mb-6 flex gap-4">
          <Link
            href="/my-trips"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← My Trips
          </Link>
          <Link
            href={`/trips/${tripId}/companion`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Trip Checklist
          </Link>
        </div>

        <LiveTripToday
          tripId={tripId}
          trip={trip}
          itemStates={itemStates}
          readinessItems={readinessItems}
          culturalInsights={culturalInsights}
          localPhrases={countryPhrases.slice(0, 10)}
          resurfacedCandidates={resurfacedCandidates}
        />
      </div>
    </div>
  );
}

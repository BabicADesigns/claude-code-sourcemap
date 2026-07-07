import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { PostTripReflection } from "@/components/planner/post-trip-reflection";
import { getCurrentUser, isSupabaseConfigured } from "@/lib/supabase/server";
import { getSavedItineraryById } from "@/lib/data/itineraries";
import { getLiveTripItemStates } from "@/lib/data/live-trip";
import { getTripReflection, getTripReflectionItems, getTripLearningDecisions } from "@/lib/data/post-trip-reflection";
import { isTripReflectionEligible } from "@/lib/ai/post-trip-reflection";
import { computeLifecycle } from "@/lib/ai/live-trip";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tripId: string }>;
}): Promise<Metadata> {
  return { title: "Trip Reflection — Balkanish" };
}

export default async function TripReflectionPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <div>
        <PageHeader eyebrow="Trip Reflection" title="Reflect on your trip" />
        <div className="container py-8 sm:py-12">
          <p className="max-w-md font-serif text-foreground/80">
            Trip reflection will be available once the Balkanish Planner is connected to its Supabase project.
          </p>
        </div>
      </div>
    );
  }

  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const trip = await getSavedItineraryById(user.id, tripId);
  if (!trip) notFound();

  const days = trip.itinerary_json.days ?? [];
  const departureDateString = trip.departure_date ?? null;

  // Compute lifecycle server-side using today (UTC midnight is close enough for eligibility;
  // the client will also check before submitting mutations)
  const todayServer = new Date().toISOString().slice(0, 10);
  const lifecycle = computeLifecycle(
    departureDateString,
    trip.duration_days,
    todayServer
  );

  const eligibility = isTripReflectionEligible(lifecycle, departureDateString, days);

  // Load existing reflection state and live-trip states in parallel
  const [reflection, reflectionItems, learningDecisions, liveStates] = await Promise.all([
    getTripReflection(user.id, tripId),
    getTripReflectionItems(user.id, tripId),
    getTripLearningDecisions(user.id, tripId),
    getLiveTripItemStates(user.id, tripId),
  ]);

  const tripTitle = trip.title ?? trip.itinerary_json.trip_title;

  return (
    <div>
      <PageHeader
        eyebrow="Trip Reflection"
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
            href={`/trips/${tripId}/today`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Today View
          </Link>
        </div>

        <PostTripReflection
          tripId={tripId}
          days={days}
          departureDateString={departureDateString}
          durationDays={trip.duration_days}
          lifecycle={lifecycle}
          eligibility={eligibility}
          existingReflection={reflection}
          existingItems={reflectionItems}
          existingDecisions={learningDecisions}
          liveStates={liveStates}
        />
      </div>
    </div>
  );
}

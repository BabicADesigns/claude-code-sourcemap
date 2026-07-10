import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { TripCompanion } from "@/components/planner/trip-companion";
import { TripNavBackSimple } from "@/components/planner/trip-nav-back";
import { getCurrentUser, isSupabaseConfigured } from "@/lib/supabase/server";
import { getSavedItineraryById } from "@/lib/data/itineraries";
import { getReadinessItems, upsertReadinessItems } from "@/lib/data/trip-readiness";
import { buildTripReadiness } from "@/lib/ai/trip-readiness";
import { computeLifecycle, getTodayDateString } from "@/lib/ai/live-trip";
import { getPrimaryLifecycleAction } from "@/lib/ai/lifecycle-navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tripId: string }>;
}): Promise<Metadata> {
  return { title: "Trip Companion" };
}

export default async function TripCompanionPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <div>
        <PageHeader eyebrow="Trip Companion" title="Pre-trip readiness" />
        <div className="container py-8 sm:py-12">
          <p className="max-w-md font-serif text-foreground/80">
            Trip Companion will come alive once the Balkanish Planner is linked to its Supabase project.
          </p>
        </div>
      </div>
    );
  }

  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const trip = await getSavedItineraryById(user.id, tripId);
  if (!trip) notFound();

  const departureDate = trip.departure_date ?? null;

  // Build readiness templates from the deterministic rules engine, then upsert so
  // new rules are added without overwriting the user's existing status/notes.
  const templates = buildTripReadiness({
    itinerary: trip.itinerary_json,
    input: {
      durationDays: trip.duration_days,
      month: trip.month,
      budget: trip.budget as Parameters<typeof buildTripReadiness>[0]["input"]["budget"],
      country: null,
      pace: "balanced",
      plannerStyle: "balanced" as Parameters<typeof buildTripReadiness>[0]["input"]["plannerStyle"],
      interests: trip.interests,
    },
    departureDate: departureDate ? new Date(departureDate) : null,
  });

  await upsertReadinessItems(user.id, tripId, templates);

  const items = await getReadinessItems(user.id, tripId);

  const tripTitle = trip.title ?? trip.itinerary_json.trip_title;
  const lifecycle = computeLifecycle(trip.departure_date, trip.duration_days, getTodayDateString());
  const forwardAction = getPrimaryLifecycleAction(lifecycle, tripId);

  return (
    <div>
      <PageHeader
        eyebrow="Trip Companion"
        title={tripTitle}
        description={`${trip.duration_days} days · ${trip.month}`}
      />
      <div className="container py-8 sm:py-12">
        <TripNavBackSimple />
        <TripCompanion
          tripId={tripId}
          tripTitle={tripTitle}
          items={items}
          departureDate={departureDate}
        />
        {forwardAction && (
          <div className="mt-8 border-t border-border pt-6">
            <Link
              href={forwardAction.href}
              className="font-medium text-accent hover:underline"
            >
              {forwardAction.href.includes("/today") ? "Go to Live Trip →" : "Reflect on this trip →"}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

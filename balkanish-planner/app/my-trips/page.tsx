import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardSection } from "@/components/my-balkans/dashboard-section";
import { SavedItineraries } from "@/components/my-balkans/saved-itineraries";
import { DeliveryHistory } from "@/components/my-balkans/delivery-history";
import { getCurrentUser, isSupabaseConfigured } from "@/lib/supabase/server";
import { getSavedItineraries } from "@/lib/data/itineraries";
import { getDeliveryHistoryForUser } from "@/lib/data/pdf-delivery";
import { computeActivationState } from "@/lib/activation-state";
import { MyTripsGuidance } from "@/components/guidance/my-trips-guidance";
import { getServerLocale } from "@/lib/i18n/server";
import { getDictionary, translate } from "@/lib/i18n/dictionaries";

export const metadata: Metadata = { title: "My Trips" };

export default async function MyTripsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div>
        <PageHeader
          eyebrow="My Trips"
          title="Your trips, saved"
          description="Accounts aren't connected yet — this dashboard will come alive once the Balkanish Planner is linked to its Supabase project."
        />
      </div>
    );
  }

  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const [itineraries, deliveries, locale] = await Promise.all([
    getSavedItineraries(user.id),
    getDeliveryHistoryForUser(user.id),
    getServerLocale(),
  ]);

  const dict = getDictionary(locale);
  const tc = (key: string) => translate(dict, "common", key);

  const mostRecent = itineraries[0] ?? null;
  const todayString = new Date().toISOString().slice(0, 10);
  const activationState = computeActivationState({
    savedContentCount: 0,
    itineraries,
    todayString,
  });

  return (
    <div>
      <PageHeader
        eyebrow="My Trips"
        title="Your trips, at a glance"
        description="The latest plan you saved, every trip you've ever built, and your PDF delivery history."
      />
      <div className="container flex flex-col gap-16 py-10 sm:gap-20 sm:py-16">
        <MyTripsGuidance state={activationState} />
        <DashboardSection
          eyebrow="Pick up where you left off"
          title="Recent Trip"
          isEmpty={!mostRecent}
          emptyMessage={tc("dashboard.myTrips.emptyRecentTrip")}
          emptyHref="/planner"
          emptyCta="Plan a Trip"
        >
          {mostRecent && <SavedItineraries itineraries={[mostRecent]} />}
        </DashboardSection>

        <DashboardSection
          eyebrow="Saved"
          title="All Trips"
          isEmpty={itineraries.length === 0}
          emptyMessage={tc("dashboard.myTrips.emptyAllTrips")}
          emptyHref="/planner"
          emptyCta="Plan a Trip"
        >
          <SavedItineraries itineraries={itineraries} />
        </DashboardSection>

        <DashboardSection
          eyebrow="History"
          title="Delivery History"
          isEmpty={deliveries.length === 0}
          emptyMessage={tc("dashboard.myTrips.emptyDelivery")}
          emptyHref="/planner"
          emptyCta="Plan a Trip"
        >
          <DeliveryHistory deliveries={deliveries} />
        </DashboardSection>

        <div className="border-t border-border pt-6">
          <p className="font-serif text-sm text-foreground/60">
            {tc("dashboard.myTrips.lookingForSaved")}{" "}
            <Link href="/my-balkans" className="font-medium text-accent hover:underline">
              {tc("dashboard.myTrips.savedPlacesLink")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

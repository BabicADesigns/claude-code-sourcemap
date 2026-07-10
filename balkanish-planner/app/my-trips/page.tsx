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

  const [itineraries, deliveries] = await Promise.all([
    getSavedItineraries(user.id),
    getDeliveryHistoryForUser(user.id),
  ]);

  const mostRecent = itineraries[0] ?? null;

  return (
    <div>
      <PageHeader
        eyebrow="My Trips"
        title="Your trips, at a glance"
        description="The latest plan you saved, every trip you've ever built, and your PDF delivery history."
      />
      <div className="container flex flex-col gap-12 py-8 sm:gap-16 sm:py-12">
        <DashboardSection
          eyebrow="Pick up where you left off"
          title="Recent Trip"
          isEmpty={!mostRecent}
          emptyMessage="No trips planned yet. Tell us your dates and we'll build the day-by-day."
          emptyHref="/planner"
          emptyCta="Plan a Trip"
        >
          {mostRecent && <SavedItineraries itineraries={[mostRecent]} />}
        </DashboardSection>

        <DashboardSection
          eyebrow="Saved"
          title="All Trips"
          isEmpty={itineraries.length === 0}
          emptyMessage="No trips planned yet. Tell us your dates and we'll build the day-by-day."
          emptyHref="/planner"
          emptyCta="Plan a Trip"
        >
          <SavedItineraries itineraries={itineraries} />
        </DashboardSection>

        <DashboardSection
          eyebrow="History"
          title="Delivery History"
          isEmpty={deliveries.length === 0}
          emptyMessage="No downloads or emails yet. Download or email a trip PDF above and it'll show up here."
          emptyHref="/planner"
          emptyCta="Plan a Trip"
        >
          <DeliveryHistory deliveries={deliveries} />
        </DashboardSection>

        {/* Cross-reference to My Balkans */}
        <div className="border-t border-border pt-6">
          <p className="font-serif text-sm text-foreground/60">
            Looking for saved places and dishes?{" "}
            <Link href="/my-balkans" className="font-medium text-accent hover:underline">
              Your saved Balkans are in My Balkans →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

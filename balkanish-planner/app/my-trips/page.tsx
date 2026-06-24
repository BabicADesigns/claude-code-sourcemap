import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardSection } from "@/components/my-balkans/dashboard-section";
import { SavedItineraries } from "@/components/my-balkans/saved-itineraries";
import { DestinationCard } from "@/components/cards/destination-card";
import { FoodFindCard } from "@/components/cards/food-find-card";
import { getCurrentUser, isSupabaseConfigured } from "@/lib/supabase/server";
import { getDestinations } from "@/lib/data/destinations";
import { getFoodFinds } from "@/lib/data/food-finds";
import { getSavedEntityIds } from "@/lib/data/favorites";
import { getSavedItineraries } from "@/lib/data/itineraries";

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

  const [destinations, foodFinds, savedDestinationIds, savedFoodFindIds, itineraries] = await Promise.all([
    getDestinations(),
    getFoodFinds(),
    getSavedEntityIds(user.id, "destination"),
    getSavedEntityIds(user.id, "food_find"),
    getSavedItineraries(user.id),
  ]);

  const savedDestinations = destinations.filter((d) => savedDestinationIds.has(d.id));
  const savedFoodFinds = foodFinds.filter((f) => savedFoodFindIds.has(f.id));
  const mostRecent = itineraries[0] ?? null;

  return (
    <div>
      <PageHeader
        eyebrow="My Trips"
        title="Your trips, at a glance"
        description="The latest plan you saved, every trip you've ever built, and the places and dishes you're keeping for later."
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
          eyebrow="Favorites"
          title="Hidden Gems"
          isEmpty={savedDestinations.length === 0}
          emptyMessage="Nothing saved here yet — pomalo, no rush. Save a destination you'd actually go back to."
          emptyHref="/hidden-gems"
          emptyCta="Browse Hidden Gems"
        >
          <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {savedDestinations.map((destination) => (
              <DestinationCard key={destination.id} destination={destination} initialSaved />
            ))}
          </div>
        </DashboardSection>

        <DashboardSection
          eyebrow="Favorites"
          title="Food Finds"
          isEmpty={savedFoodFinds.length === 0}
          emptyMessage="No dishes saved yet. Find the one worth the detour."
          emptyHref="/food-finds"
          emptyCta="Browse Food Finds"
        >
          <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {savedFoodFinds.map((foodFind) => (
              <FoodFindCard key={foodFind.id} foodFind={foodFind} initialSaved />
            ))}
          </div>
        </DashboardSection>
      </div>
    </div>
  );
}

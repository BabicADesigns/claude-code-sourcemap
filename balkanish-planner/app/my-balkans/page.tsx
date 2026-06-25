import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardSection } from "@/components/my-balkans/dashboard-section";
import { SavedSecretSwapCard } from "@/components/my-balkans/saved-secret-swap-card";
import { SavedPostcards } from "@/components/my-balkans/saved-postcards";
import { SavedItineraries } from "@/components/my-balkans/saved-itineraries";
import { DestinationCard } from "@/components/cards/destination-card";
import { FoodFindCard } from "@/components/cards/food-find-card";
import { CultureNoteCard } from "@/components/cards/culture-note-card";
import { getCurrentUser, isSupabaseConfigured } from "@/lib/supabase/server";
import { getDestinations } from "@/lib/data/destinations";
import { getFoodFinds } from "@/lib/data/food-finds";
import { getCultureNotes } from "@/lib/data/culture-notes";
import { getSecretSwaps } from "@/lib/data/secret-swaps";
import { getSavedEntityIds } from "@/lib/data/favorites";
import { getSavedPostcards } from "@/lib/data/postcards";
import { getSavedItineraries } from "@/lib/data/itineraries";

export const metadata: Metadata = { title: "My Balkans" };

export default async function MyBalkansPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div>
        <PageHeader
          eyebrow="My Balkans"
          title="Your saved Balkans"
          description="Accounts aren't connected yet — this dashboard will come alive once the Balkanish Planner is linked to its Supabase project."
        />
      </div>
    );
  }

  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const [
    destinations,
    foodFinds,
    cultureNotes,
    secretSwaps,
    savedDestinationIds,
    savedFoodFindIds,
    savedCultureNoteIds,
    savedSecretSwapIds,
    postcards,
    itineraries,
  ] = await Promise.all([
    getDestinations(),
    getFoodFinds(),
    getCultureNotes(),
    getSecretSwaps(),
    getSavedEntityIds(user.id, "destination"),
    getSavedEntityIds(user.id, "food_find"),
    getSavedEntityIds(user.id, "culture_note"),
    getSavedEntityIds(user.id, "secret_swap"),
    getSavedPostcards(user.id),
    getSavedItineraries(user.id),
  ]);

  const savedDestinations = destinations.filter((d) => savedDestinationIds.has(d.id));
  const savedFoodFinds = foodFinds.filter((f) => savedFoodFindIds.has(f.id));
  const savedCultureNotes = cultureNotes.filter((n) => savedCultureNoteIds.has(n.id));
  const savedSecretSwaps = secretSwaps.filter((s) => savedSecretSwapIds.has(s.id));

  return (
    <div>
      <PageHeader
        eyebrow="My Balkans"
        title="Everything you've saved"
        description="Your hidden gems, food finds, culture notes, swaps, postcards, and itineraries — all in one place."
      />
      <div className="container flex flex-col gap-12 py-8 sm:gap-16 sm:py-12">
        <DashboardSection
          eyebrow="Saved"
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
          eyebrow="Saved"
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

        <DashboardSection
          eyebrow="Saved"
          title="Culture Notes"
          isEmpty={savedCultureNotes.length === 0}
          emptyMessage="Nothing filed away yet — the things nobody explains to visitors are waiting."
          emptyHref="/culture-notes"
          emptyCta="Browse Culture Notes"
        >
          <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {savedCultureNotes.map((note) => (
              <CultureNoteCard key={note.id} note={note} initialSaved />
            ))}
          </div>
        </DashboardSection>

        <DashboardSection
          eyebrow="Saved"
          title="Secret Swaps"
          isEmpty={savedSecretSwaps.length === 0}
          emptyMessage="No swaps saved yet. Loved a famous spot? Find the quieter version locals prefer."
          emptyHref="/secret-swap"
          emptyCta="Find a Secret Swap"
        >
          <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {savedSecretSwaps.map((swap) => (
              <SavedSecretSwapCard key={swap.id} swap={swap} />
            ))}
          </div>
        </DashboardSection>

        <DashboardSection
          eyebrow="Saved"
          title="Postcards"
          isEmpty={postcards.length === 0}
          emptyMessage="No postcards saved yet. Make one and mail it home, digitally."
          emptyHref="/postcards"
          emptyCta="Make a Postcard"
        >
          <SavedPostcards postcards={postcards} />
        </DashboardSection>

        <DashboardSection
          eyebrow="Saved"
          title="AI Itineraries"
          isEmpty={itineraries.length === 0}
          emptyMessage="No trips planned yet. Tell us your dates and we'll build the day-by-day."
          emptyHref="/planner"
          emptyCta="Plan a Trip"
        >
          <SavedItineraries itineraries={itineraries} />
        </DashboardSection>
      </div>
    </div>
  );
}

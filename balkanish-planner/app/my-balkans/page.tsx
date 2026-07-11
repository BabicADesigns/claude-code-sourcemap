import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardSection } from "@/components/my-balkans/dashboard-section";
import { SavedSecretSwapCard } from "@/components/my-balkans/saved-secret-swap-card";
import { SavedPostcards } from "@/components/my-balkans/saved-postcards";
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
import { getInspirationCaptures } from "@/lib/data/inspiration-captures";
import { MyBalkansGuidance } from "@/components/guidance/my-balkans-guidance";

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
    inspirationCaptures,
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
    getInspirationCaptures(user.id),
  ]);

  const savedDestinations = destinations.filter((d) => savedDestinationIds.has(d.id));
  const savedFoodFinds = foodFinds.filter((f) => savedFoodFindIds.has(f.id));
  const savedCultureNotes = cultureNotes.filter((n) => savedCultureNoteIds.has(n.id));
  const savedSecretSwaps = secretSwaps.filter((s) => savedSecretSwapIds.has(s.id));

  const savedContentCount =
    savedDestinations.length +
    savedFoodFinds.length +
    savedCultureNotes.length +
    savedSecretSwaps.length +
    postcards.length +
    inspirationCaptures.length;

  return (
    <div>
      <PageHeader
        eyebrow="My Balkans"
        title="Your saved Balkans"
        description="The places, dishes, and finds you've collected — your personal corner of the Balkans."
      />
      <div className="container flex flex-col gap-12 py-8 sm:gap-16 sm:py-12">
        <MyBalkansGuidance isEmpty={savedContentCount === 0} />
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
          eyebrow="My Finds"
          title="My Finds"
          isEmpty={inspirationCaptures.length === 0}
          emptyMessage="Nothing captured yet. Paste a link, type a place name, or upload a screenshot to start your bucket list."
          emptyHref="/my-balkans/finds"
          emptyCta="Open My Finds"
        >
          <div className="flex items-center justify-between">
            <p className="font-serif text-foreground/70">
              {inspirationCaptures.length} find{inspirationCaptures.length !== 1 ? "s" : ""} saved
            </p>
            <a
              href="/my-balkans/finds"
              className="text-sm font-medium text-accent hover:underline"
            >
              View all finds →
            </a>
          </div>
        </DashboardSection>

        {/* Cross-reference to My Trips */}
        <div className="border-t border-border pt-6">
          <p className="font-serif text-sm text-foreground/60">
            Planning a trip?{" "}
            <Link href="/my-trips" className="font-medium text-accent hover:underline">
              Your AI itineraries and trip tools are in My Trips →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

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
import { getServerLocale } from "@/lib/i18n/server";
import { getDictionary, translate } from "@/lib/i18n/dictionaries";

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
    locale,
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
    getServerLocale(),
  ]);

  const dict = getDictionary(locale);
  const tc = (key: string) => translate(dict, "common", key);

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

  const findsLabel =
    inspirationCaptures.length === 1
      ? tc("dashboard.myBalkans.findsCount").replace("{count}", String(inspirationCaptures.length))
      : tc("dashboard.myBalkans.findsCountPlural").replace("{count}", String(inspirationCaptures.length));

  return (
    <div>
      <PageHeader
        eyebrow="My Balkans"
        title="Your saved Balkans"
        description="The places, dishes, and finds you've collected — your personal corner of the Balkans."
      />
      <div className="container flex flex-col gap-16 py-10 sm:gap-20 sm:py-16">
        <MyBalkansGuidance isEmpty={savedContentCount === 0} />
        <DashboardSection
          eyebrow="Saved"
          title="Hidden Gems"
          isEmpty={savedDestinations.length === 0}
          emptyMessage={tc("dashboard.myBalkans.emptyHiddenGems")}
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
          emptyMessage={tc("dashboard.myBalkans.emptyFoodFinds")}
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
          emptyMessage={tc("dashboard.myBalkans.emptyCultureNotes")}
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
          emptyMessage={tc("dashboard.myBalkans.emptySecretSwaps")}
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
          emptyMessage={tc("dashboard.myBalkans.emptyPostcards")}
          emptyHref="/postcards"
          emptyCta="Make a Postcard"
        >
          <SavedPostcards postcards={postcards} />
        </DashboardSection>

        <DashboardSection
          eyebrow="My Finds"
          title="My Finds"
          isEmpty={inspirationCaptures.length === 0}
          emptyMessage={tc("dashboard.myBalkans.emptyFinds")}
          emptyHref="/my-balkans/finds"
          emptyCta="Open My Finds"
        >
          <div className="flex items-center justify-between">
            <p className="font-serif text-foreground/70">{findsLabel}</p>
            <a href="/my-balkans/finds" className="text-sm font-medium text-accent hover:underline">
              {tc("dashboard.myBalkans.viewAllFinds")}
            </a>
          </div>
        </DashboardSection>

        <div className="border-t border-border pt-6">
          <p className="font-serif text-sm text-foreground/60">
            {tc("dashboard.myBalkans.planningTrip")}{" "}
            <Link href="/my-trips" className="font-medium text-accent hover:underline">
              {tc("dashboard.myBalkans.tripToolsLink")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

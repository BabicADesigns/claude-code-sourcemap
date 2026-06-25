import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { GemsExplorer } from "@/components/hidden-gems/gems-explorer";
import { LocalWisdom } from "@/components/brand/content-blocks";
import { NewsletterSignup } from "@/components/newsletter/newsletter-signup";
import { getDestinations } from "@/lib/data/destinations";
import { getCurrentUser } from "@/lib/supabase/server";
import { getSavedEntityIds } from "@/lib/data/favorites";

export const metadata: Metadata = {
  title: "Hidden Gems",
  description: "A filterable directory of Balkan destinations most tourists miss.",
};

export default async function HiddenGemsPage() {
  const [destinations, user] = await Promise.all([getDestinations(), getCurrentUser()]);
  const savedIds = user ? Array.from(await getSavedEntityIds(user.id, "destination")) : [];

  return (
    <div>
      <PageHeader
        eyebrow="Hidden Gems"
        title="The places that didn't make the brochure"
        description="Quiet islands, towns with no tour buses, and the kind of place a local actually goes back to — filtered by the trip you're after."
      />
      <div className="container py-8 sm:py-12">
        <LocalWisdom>Locals don&rsquo;t rank these places. They just keep going back to the same three.</LocalWisdom>
        <div className="mt-8 sm:mt-10">
          <GemsExplorer destinations={destinations} savedIds={savedIds} />
        </div>
        <NewsletterSignup sourcePage="hidden-gems" className="mt-10 sm:mt-14" />
      </div>
    </div>
  );
}

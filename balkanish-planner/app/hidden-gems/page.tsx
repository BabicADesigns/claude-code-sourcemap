import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { GemsExplorer } from "@/components/hidden-gems/gems-explorer";
import { getDestinations } from "@/lib/data/destinations";

export const metadata: Metadata = {
  title: "Hidden Gems",
  description: "A filterable directory of Balkan destinations most tourists miss.",
};

export default async function HiddenGemsPage() {
  const destinations = await getDestinations();

  return (
    <div>
      <PageHeader
        eyebrow="Hidden Gems"
        title="Places most tourists miss"
        description="Island secrets, quiet escapes, and local favorites — filtered by the kind of trip you're after."
      />
      <div className="container py-12">
        <GemsExplorer destinations={destinations} />
      </div>
    </div>
  );
}

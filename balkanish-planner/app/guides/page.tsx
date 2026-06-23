import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { GuideCard } from "@/components/cards/guide-card";
import { getPremiumGuides } from "@/lib/data/premium-guides";

export const metadata: Metadata = {
  title: "Guides",
  description: "Deep, single-region guides for travellers who want more than the free Hidden Gems directory.",
};

export default async function GuidesPage() {
  const guides = await getPremiumGuides();

  return (
    <div>
      <PageHeader
        eyebrow="Premium Guides"
        title="For when you want to go deeper"
        description="Single-region guides, written the same way as everything else here — no listicle padding, just the places worth your time."
      />
      <div className="container py-8 sm:py-12">
        <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {guides.map((guide) => (
            <GuideCard key={guide.id} guide={guide} />
          ))}
        </div>
      </div>
    </div>
  );
}

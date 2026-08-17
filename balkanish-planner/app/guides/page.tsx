import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { GuideCard } from "@/components/cards/guide-card";
import { getPremiumGuides } from "@/lib/data/premium-guides";
import { getServerLocale } from "@/lib/i18n/server";
import { getDictionary, translate } from "@/lib/i18n/dictionaries";

export const metadata: Metadata = {
  title: "Guides",
  description: "Deep, single-region guides for travellers who want more than the free Hidden Gems directory.",
};

export default async function GuidesPage() {
  const [guides, locale] = await Promise.all([getPremiumGuides(), getServerLocale()]);
  const dict = getDictionary(locale);
  const tc = (key: string) => translate(dict, "common", key);

  return (
    <div>
      <PageHeader
        eyebrow={tc("guides.eyebrow")}
        title={tc("guides.title")}
        description={tc("guides.description")}
      />
      <div className="container py-12 sm:py-16 lg:py-20">
        <div className="grid gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4">
          {guides.map((guide) => (
            <GuideCard key={guide.id} guide={guide} />
          ))}
        </div>
      </div>
    </div>
  );
}

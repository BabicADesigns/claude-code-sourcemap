import type { PremiumGuide } from "@/lib/types";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const mockPremiumGuides: PremiumGuide[] = [
  {
    id: "secret-dalmatia",
    slug: "secret-dalmatia",
    title: "Secret Dalmatia",
    description:
      "The coastal villages, coves, and konobas that never make the top-10 lists — curated for travellers who want the Dalmatia locals actually live in.",
    cover_image_url: "https://picsum.photos/seed/secret-dalmatia/900/1200",
    price_eur: 14.99,
    is_published: true,
  },
  {
    id: "croatia-beyond-dubrovnik",
    slug: "croatia-beyond-dubrovnik",
    title: "Croatia Beyond Dubrovnik",
    description:
      "A full week of itineraries that start where the cruise crowds end, built around Konavle, Pelješac, and the southern islands.",
    cover_image_url: "https://picsum.photos/seed/beyond-dubrovnik/900/1200",
    price_eur: 14.99,
    is_published: true,
  },
  {
    id: "island-hopping-croatia",
    slug: "island-hopping-croatia",
    title: "Island Hopping Croatia",
    description: "Ferry routes, timing, and the quiet islands worth the extra crossing — Vis, Lastovo, and beyond.",
    cover_image_url: "https://picsum.photos/seed/island-hopping/900/1200",
    price_eur: 14.99,
    is_published: true,
  },
  {
    id: "balkanish-food-guide",
    slug: "balkanish-food-guide",
    title: "Balkanish Food Guide",
    description: "The dishes, regions, and family konobas behind every Balkan meal worth remembering, region by region.",
    cover_image_url: "https://picsum.photos/seed/balkanish-food/900/1200",
    price_eur: 14.99,
    is_published: true,
  },
];

export async function getPremiumGuides(): Promise<PremiumGuide[]> {
  if (!isSupabaseConfigured()) return mockPremiumGuides;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("premium_guides")
    .select("*")
    .eq("is_published", true);
  if (error || !data) return mockPremiumGuides;
  return data as PremiumGuide[];
}

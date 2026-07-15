import type { PremiumGuide } from "@/lib/types";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const mockPremiumGuides: PremiumGuide[] = [
  {
    id: "secret-dalmatia",
    slug: "secret-dalmatia",
    title: "Secret Dalmatia",
    description:
      "The coastal villages, coves, and konobas that never make the top-10 lists — curated for travellers who want the Dalmatia locals actually live in.",
    cover_image_url:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=900&h=1200&q=80",
    price_eur: 14.99,
    is_published: true,
    page_count: 52,
    destination_count: 14,
    is_sample: true,
  },
  {
    id: "croatia-beyond-dubrovnik",
    slug: "croatia-beyond-dubrovnik",
    title: "Croatia Beyond Dubrovnik",
    description:
      "A full week of itineraries that start where the cruise crowds end, built around Konavle, Pelješac, and the southern islands.",
    cover_image_url:
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=900&h=1200&q=80",
    price_eur: 14.99,
    is_published: true,
    page_count: 60,
    destination_count: 11,
    is_sample: false,
  },
  {
    id: "island-hopping-croatia",
    slug: "island-hopping-croatia",
    title: "Island Hopping Croatia",
    description: "Ferry routes, timing, and the quiet islands worth the extra crossing — Vis, Lastovo, and beyond.",
    cover_image_url:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&h=1200&q=80",
    price_eur: 14.99,
    is_published: true,
    page_count: 48,
    destination_count: 9,
    is_sample: true,
  },
  {
    id: "balkanish-food-guide",
    slug: "balkanish-food-guide",
    title: "Balkanish Food Guide",
    description: "The dishes, regions, and family konobas behind every Balkan meal worth remembering, region by region.",
    cover_image_url:
      "https://images.unsplash.com/photo-1574169208507-84373a8f2bcf?auto=format&fit=crop&w=900&h=1200&q=80",
    price_eur: 14.99,
    is_published: true,
    page_count: 44,
    destination_count: 18,
    is_sample: false,
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

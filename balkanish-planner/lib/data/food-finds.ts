import type { FoodFind } from "@/lib/types";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const mockFoodFinds: FoodFind[] = [
  {
    id: "pasticada",
    slug: "pasticada",
    name: "Pašticada",
    region: "Dalmatia",
    story:
      "A Sunday dish that takes two days to make and disappears in ten minutes — Dalmatian beef braised in wine, prunes, and a spice list nobody writes down the same way twice.",
    history:
      "Said to trace back to Venetian rule of the Dalmatian coast, pašticada was historically reserved for weddings and holidays — a dish that announced an occasion mattered.",
    drink_pairing: "A robust Plavac Mali red",
    where_to_try: "Family-run konobas in Split and the islands, never a hotel buffet",
    hero_image_url: "https://picsum.photos/seed/pasticada-dish/1200/800",
    is_featured: true,
  },
  {
    id: "peka",
    slug: "peka",
    name: "Peka",
    region: "Dalmatia & Istria",
    story:
      "Meat and potatoes slow-roasted under an iron bell, buried in embers for hours. You order it the day before — peka does not do \"fast.\"",
    history:
      "A cooking method older than the modern stove, peka comes from communal village ovens where families would share the embers and the wait.",
    drink_pairing: "A chilled Pošip or a dark local beer",
    where_to_try: "Inland konobas that still cook outdoors, away from the coast road",
    hero_image_url: "https://picsum.photos/seed/peka-dish/1200/800",
    is_featured: true,
  },
  {
    id: "soparnik",
    slug: "soparnik",
    name: "Soparnik",
    region: "Poljica, near Split",
    story:
      "A thin savoury pie of Swiss chard, olive oil, and garlic, baked directly on embers under a metal lid — Dalmatia's answer to flatbread, and a UNESCO-recognised tradition.",
    history:
      "Dating back centuries in the Poljica region, soparnik was a Lenten dish — meat-free, but never short on flavour.",
    drink_pairing: "A glass of local rosé",
    where_to_try: "Village bakeries around Poljica, especially during religious festivals",
    hero_image_url: "https://picsum.photos/seed/soparnik-pie/1200/800",
    is_featured: false,
  },
  {
    id: "crni-rizot",
    slug: "crni-rizot",
    name: "Crni Rižot",
    region: "Istria & Dalmatia",
    story:
      "Risotto turned the colour of the sea floor by cuttlefish ink, briny and rich, finished with a glug of good olive oil.",
    history: "A fisherman's dish born from using every part of the catch — the ink included.",
    drink_pairing: "A crisp Istrian Malvazija",
    where_to_try: "Konobas within sight of the harbour where the squid boats come in",
    hero_image_url: "https://picsum.photos/seed/crni-rizot/1200/800",
    is_featured: false,
  },
  {
    id: "burek",
    slug: "burek",
    name: "Burek",
    region: "Balkans-wide",
    story: "Flaky filo rolled around cheese, meat, or spinach — the breakfast (and 2am) staple of every Balkan capital.",
    history: "Ottoman in origin, burek spread across the Balkans and took on a different shape and filling in nearly every town.",
    drink_pairing: "Strong Turkish-style coffee or a cold yogurt drink",
    where_to_try: "Bakeries, not restaurants — and always still warm",
    hero_image_url: "https://picsum.photos/seed/burek-pastry/1200/800",
    is_featured: true,
  },
  {
    id: "kulen",
    slug: "kulen",
    name: "Kulen",
    region: "Slavonia",
    story: "A paprika-rich smoked sausage cured for months, sliced thin and eaten with bread, cheese, and very little ceremony.",
    history: "A Slavonian specialty often made once a year, in winter, as a household ritual rather than a recipe.",
    drink_pairing: "A glass of Slavonian Graševina",
    where_to_try: "Farmhouse tables in Slavonia, sold by the kilogram at village markets",
    hero_image_url: "https://picsum.photos/seed/kulen-sausage/1200/800",
    is_featured: false,
  },
];

export async function getFoodFinds(): Promise<FoodFind[]> {
  if (!isSupabaseConfigured()) return mockFoodFinds;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("food_finds").select("*").order("is_featured", { ascending: false });
  if (error || !data) return mockFoodFinds;
  return data as FoodFind[];
}

export async function getFoodFindBySlug(slug: string): Promise<FoodFind | undefined> {
  if (!isSupabaseConfigured()) return mockFoodFinds.find((f) => f.slug === slug);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("food_finds").select("*").eq("slug", slug).maybeSingle();
  if (error || !data) return mockFoodFinds.find((f) => f.slug === slug);
  return data as FoodFind;
}

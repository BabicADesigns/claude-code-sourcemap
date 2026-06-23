import type { SecretSwap } from "@/lib/types";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { mockDestinations } from "@/lib/data/destinations";

const cavtat = mockDestinations.find((d) => d.slug === "cavtat")!;
const perast = mockDestinations.find((d) => d.slug === "perast")!;

export const mockSecretSwaps: SecretSwap[] = [
  {
    id: "dubrovnik-cavtat",
    famous_name: "Dubrovnik",
    famous_region: "Dalmatian Coast",
    famous_image_url: "https://picsum.photos/seed/dubrovnik-old-town/1200/800",
    alternative_destination_id: cavtat.id,
    alternative: cavtat,
    why_text:
      "Cavtat sits on the same stretch of Adriatic coastline, twenty-five minutes south, with the same stone-and-cypress views — and none of the cruise-ship surge that floods Dubrovnik's Old Town by mid-morning.",
    comparison_points: [
      { label: "Crowd level", famous: "Cruise-ship peaks, 8am–4pm", alternative: "Calm nearly all day" },
      { label: "Walking the waterfront", famous: "Shoulder to shoulder, July–August", alternative: "Room to breathe" },
      { label: "Price level", famous: "Premium, tourist-rate", alternative: "Noticeably lower" },
      { label: "Distance from airport", famous: "20 minutes", alternative: "15 minutes" },
    ],
  },
  {
    id: "kotor-perast",
    famous_name: "Kotor",
    famous_region: "Bay of Kotor",
    famous_image_url: "https://picsum.photos/seed/kotor-old-town/1200/800",
    alternative_destination_id: perast.id,
    alternative: perast,
    why_text:
      "Perast has the same fjord-like bay and baroque stonework as Kotor, with one street instead of cruise-ship crowds funnelling through a walled old town.",
    comparison_points: [
      { label: "Crowd level", famous: "Heavy, especially midday", alternative: "Quiet, even in August" },
      { label: "Photo ops", famous: "Iconic, but crowded frames", alternative: "Same bay, empty foreground" },
      { label: "Price level", famous: "Tourist-rate", alternative: "Lower" },
    ],
  },
];

export async function getSecretSwaps(): Promise<SecretSwap[]> {
  if (!isSupabaseConfigured()) return mockSecretSwaps;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("secret_swaps")
    .select("*, alternative:destinations!secret_swaps_alternative_destination_id_fkey(*)");
  if (error || !data) return mockSecretSwaps;
  return data as unknown as SecretSwap[];
}

export async function findSwapForFamousName(name: string): Promise<SecretSwap | undefined> {
  const swaps = await getSecretSwaps();
  const normalized = name.trim().toLowerCase();
  return swaps.find((s) => s.famous_name.toLowerCase() === normalized);
}

export async function getAllFamousNames(): Promise<string[]> {
  const swaps = await getSecretSwaps();
  return swaps.map((s) => s.famous_name);
}

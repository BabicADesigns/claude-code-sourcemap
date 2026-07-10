import type { LocalHero } from "@/lib/types";
import { synthesizeImageAsset } from "@/lib/media/normalize";

export const mockLocalHeroes: LocalHero[] = [
  {
    id: "hero-vis-marin",
    name: "Marin Šeparović",
    profession: "Winemaker, Vis",
    story: "Marin's family has farmed Vugava grapes on Vis for four generations. The grape nearly disappeared in the 1990s when the military occupation ended and tourism arrived. He stayed when others left for the mainland, convinced that the terroir — the island's limestone soil, the salt in the air — made a wine that couldn't exist anywhere else. Today his small-production bottles are poured quietly at a handful of konobas, rarely labelled, usually only available if you ask.",
    photo: synthesizeImageAsset("https://picsum.photos/seed/marin-vis/400/500", "Marin Šeparović, Vis winemaker"),
    destination_slug: "vis",
    created_at: "2024-05-01T00:00:00Z",
  },
  {
    id: "hero-cavtat-ana",
    name: "Ana Vojnović",
    profession: "Fisherman's wife and cook, Cavtat",
    story: "Ana has been cooking for the same family restaurant on Cavtat's waterfront since 1987. She doesn't write the menu down. She wakes at five to see what her husband brings back, then decides. Regulars know to ask for prstaci — tiny mussels from the bay, served with nothing but olive oil and a few leaves of something she won't name. She says the recipe is in the water, not in her hands.",
    photo: synthesizeImageAsset("https://picsum.photos/seed/ana-cavtat/400/500", "Ana Vojnović, Cavtat cook"),
    destination_slug: "cavtat",
    created_at: "2024-05-10T00:00:00Z",
  },
];

import type { Founder, FoundersPick } from "@/lib/types";
import { synthesizeImageAsset } from "@/lib/media/normalize";

export const mockFounders: Founder[] = [
  {
    id: "founder-ivana",
    name: "Ivana Babić",
    slug: "ivana-babic",
    bio: "I grew up between Zagreb and the Dalmatian coast, spending summers on Vis before it became a headline. Balkanish started as a journal of places I wanted to remember before they changed. It still is.",
    signature: "Ivana",
    photo: synthesizeImageAsset("https://picsum.photos/seed/ivana-babic/400/400", "Ivana Babić, founder"),
    social_links: { instagram: "https://instagram.com/babicadesigns" },
    created_at: "2024-01-01T00:00:00Z",
  },
];

export const mockFoundersPicks: FoundersPick[] = [
  {
    id: "pick-vis-ivana",
    destination_slug: "vis",
    founder_id: "founder-ivana",
    founder: mockFounders[0],
    title: "The island that taught me to slow down",
    body: "Vis is the reason I started this project. I first went at nineteen, on a ferry I almost missed, with a bag too heavy and no plan. I came back the same person but slower — the good kind of slower. The fishermen still eat at the same konoba where they ate ten years ago. The wine is still poured without labels. Go before someone puts a pool on the hill.",
    location: "Written from Vis, August",
    created_at: "2024-06-15T09:00:00Z",
  },
  {
    id: "pick-cavtat-ivana",
    destination_slug: "cavtat",
    founder_id: "founder-ivana",
    founder: mockFounders[0],
    title: "Dubrovnik's quieter shadow",
    body: "An hour south of Dubrovnik's crowds, Cavtat sits on a peninsula shaped like an exhale. The walls here are Roman, not medieval — older, quieter, less self-conscious about being beautiful. I always recommend arriving by water if you can. The approach from the sea gives you the version locals actually live with.",
    location: "Written from Cavtat, September",
    created_at: "2024-07-20T10:00:00Z",
  },
];

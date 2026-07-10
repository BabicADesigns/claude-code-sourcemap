import type { FounderNote } from "@/lib/types";

/**
 * Demo founder notes — editorial planning content only.
 * ALL entries are active: false, demo_only: true.
 * IMPORTANT: Founder Notes represent genuine editorial observations from the Balkanish team.
 * The AI may surface a Founder Note but may NEVER invent one.
 * These fixtures exist only to validate the schema and admin preview flows.
 */
export const mockFounderNotes: FounderNote[] = [
  {
    id: "founder-note-dubrovnik-walls",
    scope: "DESTINATION",
    scope_slug: "dubrovnik",
    headline: "Walk the walls at opening time — the city is yours for an hour",
    body: "I've done the walls at 8am and I've done them at noon. They're a completely different experience. At opening time you share them with a handful of other early risers, the light is perfect, and the terracotta rooftops glow amber. By 10am it's shoulder-to-shoulder. Set your alarm.",
    attribution: "— Anita, founder",
    active: false,
    demo_only: true,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "founder-note-sarajevo-cevapi",
    scope: "DESTINATION",
    scope_slug: "sarajevo",
    headline: "There is one cevapi debate and it will consume your visit",
    body: "Ask any local where to get the best ćevapi and you will hear a passionate, slightly offended answer. Asdž vs. Ćevabdžinica Zeljo vs. wherever their grandmother used to go. My view: they are all good and the debate is the point. Pick a place, ask the table next to you if you chose correctly, and enjoy the argument.",
    attribution: "— Anita, founder",
    active: false,
    demo_only: true,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "founder-note-balkans-general",
    scope: "GENERAL",
    headline: "The detours are the itinerary",
    body: "I've planned hundreds of Balkan trips and the ones people remember most are never the ones that went to plan. The missed bus that led to a kafana lunch with three strangers. The wrong turn into a valley with a medieval tower and no tourists. Build slack into your days. The Balkans will fill it.",
    attribution: "— Anita, founder",
    active: false,
    demo_only: true,
    created_at: "2024-01-01T00:00:00Z",
  },
];

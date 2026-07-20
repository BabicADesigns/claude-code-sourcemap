export const APP_VERSION = "1.1.0";

export interface VersionEntry {
  version: string;
  date: string;
  changes: string[];
}

export const VERSION_HISTORY: VersionEntry[] = [
  {
    version: "1.1.0",
    date: "2026-07-20",
    changes: [
      "Full internationalisation across all content (EN / DE / IT / HR)",
      "Replaced all placeholder imagery with authentic Balkan photography via Unsplash",
      "Increased whitespace throughout — dashboards, guides, hero sections",
      "Premium Guides cards redesigned with metadata chips and sample badge",
      "Guide card hover states, cover-image portrait crops, localised CTAs",
      "Newsletter signup fully localised",
      "Itinerary view and map labels localised",
      "Footer version display and design attribution",
    ],
  },
  {
    version: "1.0.0",
    date: "2026-06-01",
    changes: [
      "Initial release of Balkanish Planner",
      "AI-powered itinerary builder (planner page)",
      "Hidden Gems, Food Finds, Culture Notes, Secret Swap content sections",
      "My Balkans and My Trips personal dashboards",
      "Premium Guides catalogue",
      "Postcards and Inspiration Captures (My Finds)",
      "PDF delivery and email itinerary",
      "Four-language support scaffolded (EN / DE / IT / HR)",
      "Supabase authentication and user accounts",
    ],
  },
];

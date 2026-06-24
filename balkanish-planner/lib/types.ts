import type { Locale } from "@/lib/i18n/config";

export type DestinationCategory =
  | "island_secrets"
  | "quiet_escapes"
  | "romantic_spots"
  | "nature"
  | "family_friendly"
  | "local_favorites";

export type TravelStyle =
  | "slow_and_soulful"
  | "food_and_wine"
  | "active_outdoors"
  | "culture_and_history"
  | "romantic_getaway"
  | "family_friendly";

export type Country = "Croatia" | "Bosnia and Herzegovina" | "Montenegro" | "Serbia" | "Slovenia";

export const COUNTRIES: Country[] = [
  "Croatia",
  "Bosnia and Herzegovina",
  "Montenegro",
  "Serbia",
  "Slovenia",
];

/** How much ground a trip should cover per day — drives stop count, day-trip density, and route variant defaults. */
export type TripPace = "relaxed" | "balanced" | "active";

export const TRIP_PACE_LABELS: Record<TripPace, string> = {
  relaxed: "Relaxed",
  balanced: "Balanced",
  active: "Active",
};

/** The three itineraries generated per planner submission — same inputs, different stop-count/pacing tradeoffs. */
export type RouteVariant = "conservative" | "balanced" | "explorer";

export const ROUTE_VARIANT_LABELS: Record<RouteVariant, string> = {
  conservative: "Conservative Route",
  balanced: "Balanced Route",
  explorer: "Explorer Route",
};

/**
 * The planner wizard's travel-style vocabulary. Deliberately a separate type from TravelStyle:
 * TravelStyle backs a Postgres enum column (profiles.travel_style, generated_itineraries.travel_style)
 * that Phase 8 is not allowed to migrate, so it can't grow new literal values. PlannerStyle is free to
 * expand and is mapped down to the nearest legacy TravelStyle (see PLANNER_STYLE_TO_TRAVEL_STYLE) only
 * at the points where a planner submission is actually persisted to Supabase.
 */
export type PlannerStyle =
  | "slow_travel"
  | "food_and_wine"
  | "road_trip"
  | "romantic_escape"
  | "family"
  | "culture"
  | "nature"
  | "mixed";

export const PLANNER_STYLE_LABELS: Record<PlannerStyle, string> = {
  slow_travel: "Slow Travel",
  food_and_wine: "Food & Wine",
  road_trip: "Road Trip",
  romantic_escape: "Romantic Escape",
  family: "Family",
  culture: "Culture",
  nature: "Nature",
  mixed: "Mixed",
};

/** The kind of trip a destination suits — distinct from DestinationCategory, which drives the Hidden Gems filter UI. A destination can belong to several. */
export type TravelType =
  | "island_escape"
  | "mountain_escape"
  | "national_park"
  | "historic_town"
  | "food_destination"
  | "wine_region"
  | "romantic"
  | "family_friendly"
  | "road_trip_stop"
  | "cultural_experience"
  | "slow_living"
  | "weekend_escape";

export const TRAVEL_TYPE_LABELS: Record<TravelType, string> = {
  island_escape: "Island Escape",
  mountain_escape: "Mountain Escape",
  national_park: "National Park",
  historic_town: "Historic Town",
  food_destination: "Food Destination",
  wine_region: "Wine Region",
  romantic: "Romantic",
  family_friendly: "Family Friendly",
  road_trip_stop: "Road Trip Stop",
  cultural_experience: "Cultural Experience",
  slow_living: "Slow Living",
  weekend_escape: "Weekend Escape",
};

/** Where a photo came from and how it should be attributed — placeholder values until real photography is sourced. */
export interface ImageCredit {
  photographer: string;
  source: string;
  license?: string;
}

/**
 * A single image plus the metadata an editorial travel product needs to actually show it responsibly:
 * descriptive alt text, an optional caption, and who to credit. `alt`/`caption` are plain strings for now —
 * see docs/image-direction-v2.md for how these become locale-keyed once translations ship.
 */
export interface ImageAsset {
  url: string;
  alt: string;
  caption?: string;
  credit: ImageCredit;
}

export interface Destination {
  id: string;
  slug: string;
  name: string;
  region: string;
  country: Country;
  category: DestinationCategory;
  travel_types: TravelType[];
  summary: string;
  description: string;
  why_we_love_it: string;
  best_season: string;
  local_score: number;
  crowd_score: number;
  slow_living_score: number;
  food_score: number;
  story_score: number;
  sunset_score: number;
  hero_image_url: string;
  gallery_image_urls: string[];
  /** Structured counterpart to hero_image_url — credited, captioned, alt-texted. Used on the destination detail page hero; card/list views keep reading hero_image_url. */
  hero_image: ImageAsset;
  /** Structured gallery, replacing the previously-unused gallery_image_urls as the field destination pages actually render. */
  gallery_images: ImageAsset[];
  is_featured: boolean;
  latitude: number;
  longitude: number;
}

export interface DayTrip {
  id: string;
  slug: string;
  origin: string;
  /** Slug of the matching entry in mockDestinations, when one exists. */
  destination_slug: string | null;
  destination_name: string;
  drive_time: string;
  why_go: string;
  highlights: string[];
  best_season: string;
  local_tip: string;
}

/** The shape of trip a planner request is built around — used to map requests onto matching travel types and ground real itinerary generation. */
export type ItineraryFocus =
  | "coast"
  | "food"
  | "wine"
  | "slow_living"
  | "romantic"
  | "family"
  | "culture"
  | "national_park"
  | "road_trip"
  | "mixed";

export const ITINERARY_FOCUS_LABELS: Record<ItineraryFocus, string> = {
  coast: "Coast Escape",
  food: "Food Journey",
  wine: "Wine Journey",
  slow_living: "Slow Living",
  romantic: "Romantic Escape",
  family: "Family Friendly",
  culture: "Historic Balkans",
  national_park: "National Parks",
  road_trip: "Road Trip",
  mixed: "Mixed Discovery",
};

export type ScoreKey =
  | "local_score"
  | "crowd_score"
  | "slow_living_score"
  | "food_score"
  | "story_score"
  | "sunset_score";

export interface ScoreDefinition {
  key: ScoreKey;
  label: string;
  hint: string;
  /** Higher is better for most scores, except crowd (lower = quieter). */
  invert?: boolean;
}

export const DESTINATION_SCORES: ScoreDefinition[] = [
  { key: "local_score", label: "Local Score", hint: "How much of this place still belongs to the people who live there" },
  { key: "crowd_score", label: "Crowd Score", hint: "Lower means quieter — this is the only score where less is more" , invert: true },
  { key: "slow_living_score", label: "Slow Living Score", hint: "Room to do nothing and feel good about it" },
  { key: "food_score", label: "Food Score", hint: "Is the best meal here an accident or a destination" },
  { key: "story_score", label: "Story Score", hint: "Will you still be telling people about this in a year" },
  { key: "sunset_score", label: "Sunset Score", hint: "Worth stopping what you're doing for" },
];

export interface FoodFind {
  id: string;
  slug: string;
  name: string;
  region: string;
  story: string;
  history: string;
  drink_pairing: string;
  where_to_try: string;
  hero_image_url: string;
  is_featured: boolean;
  /** The social ritual around the dish — who makes it, when, and why it's never rushed. */
  ritual?: string;
  /** A specific, lived-in moment that says more than a general description could. */
  local_anecdote?: string;
}

export interface CultureNote {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  hero_image_url: string;
  region: string | null;
  is_featured: boolean;
}

export interface ComparisonPoint {
  label: string;
  famous: string;
  alternative: string;
}

export interface SecretSwap {
  id: string;
  famous_name: string;
  famous_region: string;
  famous_image_url: string;
  alternative_destination_id: string;
  alternative: Destination;
  why_text: string;
  comparison_points: ComparisonPoint[];
}

export interface PremiumGuide {
  id: string;
  slug: string;
  title: string;
  description: string;
  cover_image_url: string;
  price_eur: number;
  is_published: boolean;
}

export const DESTINATION_CATEGORY_LABELS: Record<DestinationCategory, string> = {
  island_secrets: "Island Secrets",
  quiet_escapes: "Quiet Escapes",
  romantic_spots: "Romantic Spots",
  nature: "Nature",
  family_friendly: "Family Friendly",
  local_favorites: "Local Favorites",
};

export const TRAVEL_STYLE_LABELS: Record<TravelStyle, string> = {
  slow_and_soulful: "Slow & Soulful",
  food_and_wine: "Food & Wine",
  active_outdoors: "Active & Outdoors",
  culture_and_history: "Culture & History",
  romantic_getaway: "Romantic Getaway",
  family_friendly: "Family Friendly",
};

/**
 * Maps the planner wizard's 8-value PlannerStyle onto the legacy 6-value, Postgres-enum-backed
 * TravelStyle, used only at the moment a planner submission is written to Supabase
 * (generated_itineraries.travel_style / profiles.travel_style). Never used for itinerary logic —
 * lib/ai/grounding.ts scores and selects destinations from PlannerStyle directly.
 */
export const PLANNER_STYLE_TO_TRAVEL_STYLE: Record<PlannerStyle, TravelStyle> = {
  slow_travel: "slow_and_soulful",
  food_and_wine: "food_and_wine",
  road_trip: "active_outdoors",
  romantic_escape: "romantic_getaway",
  family: "family_friendly",
  culture: "culture_and_history",
  nature: "active_outdoors",
  mixed: "slow_and_soulful",
};

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  is_premium: boolean;
  country: string | null;
  travel_style: TravelStyle | null;
  favorite_region: string | null;
  preferred_language: Locale;
  created_at: string;
  updated_at: string;
}

export type FavoriteEntityType = "destination" | "food_find" | "culture_note" | "secret_swap";

export interface Favorite {
  id: string;
  user_id: string;
  entity_type: FavoriteEntityType;
  entity_id: string;
  created_at: string;
}

export interface SavedPostcard {
  id: string;
  user_id: string;
  destination_name: string;
  mood: string;
  quote: string;
  image_url: string | null;
  is_public: boolean;
  created_at: string;
}

export interface SavedItinerary {
  id: string;
  user_id: string | null;
  title: string | null;
  duration_days: number;
  month: string;
  budget: string;
  travel_style: TravelStyle;
  interests: string[];
  itinerary_json: import("@/lib/ai/itinerary").GeneratedItinerary;
  created_at: string;
}

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

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  is_premium: boolean;
  country: string | null;
  travel_style: TravelStyle | null;
  favorite_region: string | null;
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
  duration_days: number;
  month: string;
  budget: string;
  travel_style: TravelStyle;
  interests: string[];
  itinerary_json: import("@/lib/ai/itinerary").GeneratedItinerary;
  created_at: string;
}

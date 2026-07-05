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
  /**
   * Rights/usage line distinct from `license` — e.g. "© 2024 Ivana Babić" once real photography is
   * sourced. For placeholder imagery this must read as an honest placeholder ("Placeholder — rights
   * holder not yet determined"), never a fabricated real-sounding claim — see docs/image-direction-v2.md
   * and docs/media-library-architecture.md's "placeholder honesty" principle.
   */
  copyright?: string;
}

/**
 * A piece of editorial text available in multiple locales. `en` is required as the guaranteed
 * fallback (see lib/media/caption.ts's resolveCaption); other locales are filled in opportunistically,
 * not as a translation backlog — see docs/media-library-architecture.md §8 (Multilingual Readiness).
 */
export type LocalizedText = Partial<Record<Locale, string>> & { en: string };

/**
 * Which part of the editorial system an image belongs to — drives layout/treatment decisions
 * (hero height tier, PDF slot eligibility) without each call site re-deriving them from context.
 */
export type MediaCategory = "hero" | "gallery" | "food" | "culture" | "map_illustration" | "pdf";

/** An image's natural framing. Layout code reads this instead of assuming a fixed crop. */
export type AspectRatio = "landscape" | "portrait" | "square";

/** Tailwind aspect-ratio class per `AspectRatio` — the one place that mapping is allowed to live. */
export const ASPECT_RATIO_CLASSES: Record<AspectRatio, string> = {
  landscape: "aspect-[4/3]",
  portrait: "aspect-[3/4]",
  square: "aspect-square",
};

/**
 * A single image plus the metadata an editorial travel product needs to actually show it responsibly:
 * descriptive alt text, an optional caption, and who to credit. `alt` stays a plain required string —
 * an accessibility feature should never silently render undefined (docs/image-direction-v2.md §5) — but
 * `caption` may be a `LocalizedText` once a translated caption exists; most entries still use a plain
 * string, which every render path treats as the `en` value. `title`/`location`/`aspect_ratio`/`category`
 * are optional and backfilled by lib/media/normalize.ts for entries that don't set them explicitly.
 */
export interface ImageAsset {
  url: string;
  alt: string;
  caption?: string | LocalizedText;
  credit: ImageCredit;
  /** Short editorial title for this image, e.g. for a gallery lightbox or PDF caption strip. */
  title?: string;
  /** Where the photo was taken — distinct from a destination's own `region`, since a gallery image may be a detail shot, not a place. */
  location?: string;
  aspect_ratio?: AspectRatio;
  category?: MediaCategory;
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
  // Phase 17 seasonal intelligence and crowd awareness (nullable — curated editorially)
  seasonal_data?: SeasonalData | null;
  crowd_level?: CrowdLevel | null;
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

/**
 * Where a destination candidate came from. `curated` is the trust backbone (a real `Destination`
 * row, editorially vetted, with earned scores). `ai_suggested` is Layer B — the AI discovery
 * layer (docs/ai-discovery-architecture.md) proposing a real place it believes exists, never
 * scored or sequenced alongside curated stops, always shown with its own provenance badge.
 */
export type DestinationSourceType = "curated" | "ai_suggested";

/**
 * How far an `ai_suggested` candidate has been checked — deterministic structural/geographic
 * plausibility only (lib/ai/verification.ts), never an editorial fact-check. "structurally_checked"
 * must not be read by a user as "confirmed real" — copy surfacing it says so explicitly.
 * "rejected" candidates are dropped server-side and never reach a client.
 */
export type VerificationStatus = "unverified" | "structurally_checked" | "rejected";

/**
 * A destination Layer B (AI discovery) is proposing, distinct from a curated `Destination`:
 * deliberately thin — no *_score fields, no ImageAsset, no why_we_love_it. Those are earned
 * through editorial promotion (docs/ai-discovery-architecture.md Stage 3), never invented.
 */
export interface DestinationCandidate {
  name: string;
  region: string;
  country: Country;
  latitude: number;
  longitude: number;
  source: DestinationSourceType;
  /** 0–1, computed deterministically by lib/ai/verification.ts — never self-reported by the AI. */
  confidence_score: number;
  verification_status: VerificationStatus;
  /** One sentence, AI-authored, explaining why this place fits the request — narrative, not a verified fact. */
  rationale: string;
  matched_focus: ItineraryFocus[];
  /**
   * Human moderation state of this candidate's row in the shared `discovered_destinations`
   * registry (docs/ai-expansion-engine-architecture.md). Distinct from `verification_status`:
   * that's an automated structural check run once at generation time, this is an editor's
   * persistent, cross-session decision. Defaults to "pending" — see registerDiscoveredDestination.
   */
  moderation_status: ModerationStatus;
}

/**
 * Editorial review state of a `discovered_destinations` registry row — human-driven and
 * persistent across itinerary generations, unlike the automated `VerificationStatus`. See
 * docs/ai-expansion-engine-architecture.md "Moderation workflow".
 */
export type ModerationStatus = "pending" | "approved" | "rejected";

/**
 * The badge tier shown to end users — derived, never stored. "verified" = a real curated
 * `Destination`. "community_verified" = an `ai_suggested` candidate an editor has approved
 * (or that usage has reinforced) but not yet promoted into the curated dataset.
 * "ai_suggested" = still pending review. See deriveTrustTier in lib/ai/trust.ts.
 */
export type TrustTier = "verified" | "community_verified" | "ai_suggested";

/**
 * A shared, deduplicated registry row for a place Layer B has proposed — persists across
 * itinerary generations and users so an editor can review it once, not once per request.
 * Maps 1:1 to `public.discovered_destinations` (migration 0012). Deliberately separate from
 * `DestinationCandidate` (which is embedded per-itinerary, read-only, and has no stable id)
 * — this is the mutable, server-side record that candidate is checked against.
 */
export interface DiscoveredDestination {
  id: string;
  normalized_key: string;
  name: string;
  region: string;
  country: Country;
  latitude: number;
  longitude: number;
  source: DestinationSourceType;
  confidence_score: number;
  verification_status: VerificationStatus;
  rationale: string;
  matched_focus: ItineraryFocus[];
  moderation_status: ModerationStatus;
  times_suggested: number;
  times_saved: number;
  /** Set once an editor promotes this row into `public.destinations` — see promoteDiscoveredDestination. */
  promoted_destination_id: string | null;
  created_at: string;
  updated_at: string;
}

/** What kind of smart-discovery request a free-text query expresses — see lib/ai/discovery-query.ts. */
export type DiscoveryIntent = "alternative_to" | "themed_search" | "route_between" | "general";

/** The structured, deterministically-parsed form of a planner free-text discovery query (requirement #7). */
export interface DiscoveryQuery {
  raw: string;
  intent: DiscoveryIntent;
  focus_tags: ItineraryFocus[];
  /** The place name the query is anchored on, e.g. "Mostar" in "hidden waterfalls near Mostar". */
  anchor_place: string | null;
  /** Only set for "route_between" — the destination end of a "from X to Y" request. */
  route_to_place: string | null;
}

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
  /** Structured counterpart to hero_image_url — credited, captioned, alt-texted. Added Phase 12; see docs/media-library-architecture.md. */
  hero_image: ImageAsset;
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
  /** Structured counterpart to hero_image_url — credited, captioned, alt-texted. Added Phase 12; see docs/media-library-architecture.md. */
  hero_image: ImageAsset;
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

/**
 * Best-effort reverse of PLANNER_STYLE_TO_TRAVEL_STYLE, used only when regenerating a PDF for an
 * itinerary saved before the PDF was needed: the original 8-value PlannerStyle was never persisted,
 * only the lossy 6-value TravelStyle column, so this picks one canonical PlannerStyle per TravelStyle
 * for display purposes (e.g. a regenerated PDF's "Travel style" fact). Never used for itinerary logic.
 */
export const TRAVEL_STYLE_TO_PLANNER_STYLE: Record<TravelStyle, PlannerStyle> = {
  slow_and_soulful: "slow_travel",
  food_and_wine: "food_and_wine",
  active_outdoors: "road_trip",
  culture_and_history: "culture",
  romantic_getaway: "romantic_escape",
  family_friendly: "family",
};

// ---------------------------------------------------------------------------
// Phase 17 — Smart Personalization Engine
// ---------------------------------------------------------------------------

export type TravelerInterest =
  | "food"
  | "history"
  | "beaches"
  | "photography"
  | "hiking"
  | "islands"
  | "nightlife"
  | "architecture"
  | "hidden_gems"
  | "wine"
  | "family"
  | "wellness"
  | "adventure";

export const TRAVELER_INTEREST_LABELS: Record<TravelerInterest, string> = {
  food: "Food & dining",
  history: "History & old towns",
  beaches: "Beaches & coastline",
  photography: "Photography",
  hiking: "Hiking & nature",
  islands: "Island hopping",
  nightlife: "Nightlife",
  architecture: "Architecture",
  hidden_gems: "Hidden gems",
  wine: "Wine & gastronomy",
  family: "Family activities",
  wellness: "Wellness & relaxation",
  adventure: "Adventure sports",
};

export type MobilityOption =
  | "car"
  | "camper"
  | "motorcycle"
  | "bicycle"
  | "ferry"
  | "public_transport"
  | "walking";

export const MOBILITY_OPTION_LABELS: Record<MobilityOption, string> = {
  car: "Car",
  camper: "Camper / motorhome",
  motorcycle: "Motorcycle",
  bicycle: "Bicycle",
  ferry: "Ferry",
  public_transport: "Public transport",
  walking: "Walking / on foot",
};

export type CuisinePreference =
  | "vegetarian"
  | "seafood"
  | "traditional_balkan"
  | "street_food"
  | "fine_dining"
  | "wine_lovers"
  | "coffee_lovers"
  | "desserts";

export const CUISINE_PREFERENCE_LABELS: Record<CuisinePreference, string> = {
  vegetarian: "Vegetarian",
  seafood: "Seafood",
  traditional_balkan: "Traditional Balkan",
  street_food: "Street food",
  fine_dining: "Fine dining",
  wine_lovers: "Wine lovers",
  coffee_lovers: "Coffee lovers",
  desserts: "Desserts & pastries",
};

export type TravelMood =
  | "slow_living"
  | "romantic"
  | "adventure"
  | "family_time"
  | "digital_detox"
  | "road_trip"
  | "luxury_escape"
  | "weekend_escape";

export const TRAVEL_MOOD_LABELS: Record<TravelMood, string> = {
  slow_living: "Slow Living",
  romantic: "Romantic",
  adventure: "Adventure",
  family_time: "Family Time",
  digital_detox: "Digital Detox",
  road_trip: "Road Trip",
  luxury_escape: "Luxury Escape",
  weekend_escape: "Weekend Escape",
};

/** Per-season narrative context for a destination — authored editorially, never AI-generated. */
export interface SeasonalData {
  /** 1-indexed month numbers (1 = January) when this destination is at its best. */
  best_months: number[];
  /** Months where visiting is not recommended (e.g. off-season ferry shutdowns, extreme heat). */
  avoid_months?: number[];
  avoid_reason?: string;
  seasonal_highlights: {
    spring?: string;
    summer?: string;
    autumn?: string;
    winter?: string;
  };
  rainy_day_ideas?: string[];
}

/** Crowd density tier for a destination in its peak season. Architecture-only in Phase 17 — no live API data. */
export type CrowdLevel = "busy" | "moderate" | "quiet";

export const CROWD_LEVEL_LABELS: Record<CrowdLevel, string> = {
  busy: "Very busy in peak season",
  moderate: "Manageable crowds",
  quiet: "Rarely crowded",
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
  // Phase 17 personalization preferences (all optional — filled via account settings)
  travel_pace?: TripPace | null;
  interests?: TravelerInterest[] | null;
  mobility?: MobilityOption[] | null;
  budget_preference?: "budget" | "mid_range" | "premium" | "luxury" | null;
  cuisine_preferences?: CuisinePreference[] | null;
  // Phase 19 logistics preferences
  transport_preferences?: TransportPreference[] | null;
}

export type FavoriteEntityType = "destination" | "food_find" | "culture_note" | "secret_swap" | "discovered_destination";

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
  departure_date?: string | null;
  created_at: string;
}

/**
 * What a generated PDF is *of*. `source_id` on PdfDocument points at a row in a
 * different table depending on this value — generated_itineraries for "itinerary",
 * destinations for "destination_guide", premium_guides for "premium_guide" (reserved;
 * no premium-guide content or generation flow exists yet, see docs/pdf-delivery-architecture.md).
 */
export type PdfDocumentType = "itinerary" | "destination_guide" | "premium_guide";

export const PDF_DOCUMENT_TYPE_LABELS: Record<PdfDocumentType, string> = {
  itinerary: "Itinerary",
  destination_guide: "Destination Guide",
  premium_guide: "Premium Guide",
};

export type DeliveryChannel = "download" | "email";
export type DeliveryStatus = "pending" | "sent" | "failed";

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  pending: "Pending",
  sent: "Sent",
  failed: "Failed",
};

/** A PDF actually rendered and stored for a signed-in user. See migration 0011_phase14_pdf_delivery.sql. */
export interface PdfDocument {
  id: string;
  user_id: string;
  document_type: PdfDocumentType;
  source_id: string;
  locale: Locale;
  storage_path: string | null;
  file_size_bytes: number | null;
  generated_at: string;
  expires_at: string | null;
  created_at: string;
}

/** One download or email send of a PdfDocument — an append-only history, never updated in place. */
export interface PdfDelivery {
  id: string;
  pdf_document_id: string;
  user_id: string;
  channel: DeliveryChannel;
  status: DeliveryStatus;
  recipient_email: string | null;
  error_message: string | null;
  created_at: string;
}

/** A PdfDelivery joined with the PdfDocument it belongs to, for rendering delivery history in one pass. */
export interface PdfDeliveryWithDocument extends PdfDelivery {
  document: PdfDocument;
}

// ---------------------------------------------------------------------------
// Phase 16 — Community Intelligence & Founder's Picks
// ---------------------------------------------------------------------------

/** Editorial identity for a Balkanish founder — name, photo, bio, signature, links. */
export interface Founder {
  id: string;
  name: string;
  slug: string;
  bio: string;
  /** Handwritten-style text string rendered via font-script, e.g. "Ivana" */
  signature?: string;
  photo?: ImageAsset;
  social_links?: { instagram?: string; website?: string };
  created_at: string;
}

/**
 * A founder's personal editorial recommendation for a destination — an authentic voice note
 * distinct from the destination's own editorial copy. Never auto-generated; always authored.
 */
export interface FoundersPick {
  id: string;
  destination_slug: string;
  founder_id: string;
  founder?: Founder;
  title: string;
  body: string;
  portrait?: ImageAsset;
  /** Overrides founder.signature for this specific pick if the founder wants a different sign-off. */
  signature_override?: string;
  /** e.g. "Written from Vis, August" — short, evocative place-and-time context */
  location?: string;
  created_at: string;
}

/** The kind of tip a community note contains — drives category badge and sort order. */
export type CommunityNoteCategory =
  | "sunset_spot"
  | "parking"
  | "coffee"
  | "local_etiquette"
  | "seasonal"
  | "food_tip"
  | "transport"
  | "other";

export const COMMUNITY_NOTE_CATEGORY_LABELS: Record<CommunityNoteCategory, string> = {
  sunset_spot: "Sunset Spot",
  parking: "Parking",
  coffee: "Coffee",
  local_etiquette: "Local Etiquette",
  seasonal: "Seasonal",
  food_tip: "Food Tip",
  transport: "Transport",
  other: "Tip",
};

/**
 * A user-submitted travel tip linked to a specific destination. Pending moderation by default;
 * only `approved` notes are surfaced publicly. Author name is optional — anonymous notes are valid.
 */
export interface CommunityNote {
  id: string;
  destination_slug: string;
  content: string;
  category: CommunityNoteCategory;
  author_name?: string;
  language: Locale;
  moderation_status: ModerationStatus;
  submitted_at: string;
  created_at: string;
}

/**
 * A real local who lives and works in a destination — editorial only, never an advertisement.
 * The "local hero" concept is a human-authored character study, not a business listing.
 */
export interface LocalHero {
  id: string;
  name: string;
  profession: string;
  story: string;
  photo?: ImageAsset;
  destination_slug: string;
  website?: string;
  social_links?: { instagram?: string; facebook?: string };
  created_at: string;
}

/** The broad theme a Balkanish story belongs to — drives the story index filter. */
export type StoryCategory =
  | "coffee_culture"
  | "traditions"
  | "island_life"
  | "local_customs"
  | "food_rituals"
  | "festivals";

export const STORY_CATEGORY_LABELS: Record<StoryCategory, string> = {
  coffee_culture: "Coffee Culture",
  traditions: "Traditions",
  island_life: "Island Life",
  local_customs: "Local Customs",
  food_rituals: "Food Rituals",
  festivals: "Festivals",
};

/**
 * An editorial cultural narrative — multilingual, human-authored. The body and title are
 * LocalizedText so each locale can carry a properly written version, not a machine translation.
 */
export interface BalkanishStory {
  id: string;
  slug: string;
  title: LocalizedText;
  body: LocalizedText;
  excerpt?: LocalizedText;
  category: StoryCategory;
  hero_image?: ImageAsset;
  published_at: string;
  created_at: string;
}

/**
 * What kind of engagement signal is being recorded. Collected for future ranking signals
 * (Phase 16 requirement #7) — never exposed as a public score or ranking today.
 */
export type EngagementSignalType = "view" | "like" | "bookmark" | "planner_usage" | "community_confirmation";

/** What kind of entity the engagement signal is attached to. Extends FavoriteEntityType with Phase 16 content types. */
export type EngagementEntityType = FavoriteEntityType | "story" | "local_hero" | "founders_pick";

/**
 * A single engagement event stored for future ranking use. `user_id` is optional — anonymous
 * views are valid signals. Never read back to end users; only aggregated internally.
 */
export interface EngagementSignal {
  id: string;
  entity_type: EngagementEntityType;
  entity_id: string;
  signal_type: EngagementSignalType;
  user_id?: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Phase 18 — Local Trust & Partner Recommendation System
// ---------------------------------------------------------------------------

/**
 * Editorial trust tier for a local partner or recommendation.
 * Trust level reflects editorial judgment, NOT commercial relationship.
 * A partner with a commercial connection can still earn a Founder's Pick —
 * the connection is disclosed separately via CommercialRelationship.
 */
export type PartnerTrustLevel = "founder_pick" | "verified_local" | "community_favourite";

export const PARTNER_TRUST_LEVEL_LABELS: Record<PartnerTrustLevel, string> = {
  founder_pick: "Founder's Pick",
  verified_local: "Verified Local",
  community_favourite: "Community Favourite",
};

/**
 * Whether and how a commercial relationship exists between Balkanish and a partner.
 * Stored explicitly and disclosed to users — never used to influence recommendation ranking.
 * Editorial relevance always comes first; commercial relationships are a transparency record only.
 */
export type CommercialRelationship =
  | "none"
  | "affiliate"
  | "paid_partnership"
  | "founder_connection"
  | "owned_or_affiliated_project";

export const COMMERCIAL_RELATIONSHIP_LABELS: Record<CommercialRelationship, string> = {
  none: "No commercial relationship",
  affiliate: "Affiliate",
  paid_partnership: "Paid partnership",
  founder_connection: "Founder connection",
  owned_or_affiliated_project: "Founder's project",
};

/** The kind of local experience or service a partner provides. A partner may have a primary category plus additional tags. */
export type PartnerCategory =
  | "food_drink"
  | "outdoor_adventure"
  | "accommodation"
  | "transport"
  | "culture_arts"
  | "wellness"
  | "shopping"
  | "family"
  | "workspace"
  | "experience";

export const PARTNER_CATEGORY_LABELS: Record<PartnerCategory, string> = {
  food_drink: "Food & Drink",
  outdoor_adventure: "Outdoor Adventure",
  accommodation: "Accommodation",
  transport: "Transport",
  culture_arts: "Culture & Arts",
  wellness: "Wellness",
  shopping: "Shopping",
  family: "Family",
  workspace: "Workspace & Coworking",
  experience: "Experience",
};

/**
 * A local business, guide, experience, or project the Balkanish editorial team recommends.
 * Distinct from `FoundersPick` (a destination voice note) — this is a partner entity with
 * external links, commercial disclosure, and contextual matching signals.
 *
 * Commercial relationships are stored and disclosed to users.
 * They never inflate recommendation ranking — see docs/local-trust-recommendation-system.md.
 */
export interface LocalPartner {
  id: string;
  name: string;
  slug: string;
  trust_level: PartnerTrustLevel;
  commercial_relationship: CommercialRelationship;
  /** Explicit disclosure text. Falls back to auto-generated text from commercial_relationship when null. */
  disclosure_text?: string | null;
  category: PartnerCategory;
  /** Additional category tags for multi-signal matching. */
  categories?: PartnerCategory[];
  country?: Country | null;
  /** Sub-national region, e.g. "Kvarner", "Istria", "Dalmatia". */
  region?: string | null;
  /** Slugs of specific destinations this partner is relevant to. */
  destination_slugs?: string[];
  /** 1–2 sentence editorial description. */
  short_description: string;
  /** Internal editorial note (not shown to users). */
  editorial_note?: string | null;
  /** Personal founder note — shown to users for Founder's Pick partners. */
  founder_note?: string | null;
  // External links — all nullable; partners may not have all channels
  website_url?: string | null;
  instagram_url?: string | null;
  booking_url?: string | null;
  app_url?: string | null;
  /** Only when intentionally published by the partner. Never scraped. */
  contact_email?: string | null;
  contact_phone?: string | null;
  // Contextual matching signals — used by partner-match.ts, never visible in UI
  traveler_interests?: TravelerInterest[];
  mobility_options?: MobilityOption[];
  travel_moods?: TravelMood[];
  cuisine_types?: CuisinePreference[];
  trip_paces?: TripPace[];
  family_suitable?: boolean;
  accessibility_notes?: string | null;
  /** 1-indexed best months (1 = January). */
  best_months?: number[];
  hero_image?: ImageAsset | null;
  /** Editorial priority weight 0–100. Higher = more likely to surface. Never influenced by commercial relationship. */
  priority: number;
  /** Only active partners appear in itinerary recommendations. Inactive partners are visible in admin only. */
  active: boolean;
  /** Marks development/demo fixtures that must never surface in production itineraries. */
  demo_only?: boolean;
  verified_at?: string | null;
  /** Email or identifier of the editorial team member who verified this partner. */
  verified_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

/** A partner paired with its contextual relevance score and internal match reasons. */
export interface PartnerMatchResult {
  partner: LocalPartner;
  /** 0–1 composite relevance score. Never exposed to users — used only for ranking and density filtering. */
  relevance_score: number;
  /** Internal audit trail — not shown in UI. */
  match_reasons: string[];
}

// ─── Phase 19: Trip Logistics & Getting Around Engine ─────────────────────────

export type TransportMode =
  | "car"
  | "rental_car"
  | "motorcycle"
  | "camper"
  | "bus"
  | "train"
  | "ferry"
  | "passenger_ferry"
  | "taxi_transfer"
  | "bike"
  | "e_bike"
  | "walk"
  | "flight"
  | "mixed";

export const TRANSPORT_MODE_LABELS: Record<TransportMode, string> = {
  car: "Own car",
  rental_car: "Rental car",
  motorcycle: "Motorcycle",
  camper: "Camper / motorhome",
  bus: "Bus",
  train: "Train",
  ferry: "Ferry",
  passenger_ferry: "Passenger ferry",
  taxi_transfer: "Taxi / transfer",
  bike: "Bicycle",
  e_bike: "E-bike",
  walk: "Walking",
  flight: "Flight",
  mixed: "Mixed transport",
};

/** How feasible / comfortable a particular leg or route segment is. */
export type RouteComplexity = "EASY" | "MANAGEABLE" | "LONG_DAY" | "COMPLEX" | "NOT_RECOMMENDED";

export const ROUTE_COMPLEXITY_LABELS: Record<RouteComplexity, string> = {
  EASY: "Easy",
  MANAGEABLE: "Manageable",
  LONG_DAY: "Long day",
  COMPLEX: "Complex",
  NOT_RECOMMENDED: "Not recommended",
};

/** How reliable / current the logistics information is. LIVE_PROVIDER must never be assigned without a real live integration. */
export type LogisticsConfidence =
  | "EDITORIAL_STABLE"
  | "EDITORIAL_ESTIMATE"
  | "VERIFY_BEFORE_TRAVEL"
  | "LIVE_PROVIDER";

export const LOGISTICS_CONFIDENCE_LABELS: Record<LogisticsConfidence, string> = {
  EDITORIAL_STABLE: "Editorially verified",
  EDITORIAL_ESTIMATE: "Planning estimate",
  VERIFY_BEFORE_TRAVEL: "Verify before travel",
  LIVE_PROVIDER: "Live data",
};

/** Whether a day is primarily about being somewhere, moving, or recovering. */
export type DayType = "EXPERIENCE_DAY" | "TRANSFER_DAY" | "MIXED_DAY" | "REST_DAY";

/** How practicable a route segment is, with human-readable reasoning. */
export interface RoutePracticality {
  rating: RouteComplexity;
  /** One or two sentences explaining the rating — shown to users. */
  reason: string;
  confidence: LogisticsConfidence;
}

/** Traveler's preferred transport style — used to personalise logistics guidance. */
export type TransportPreference =
  | "own_car"
  | "rental_car"
  | "public_transport_preferred"
  | "avoid_driving"
  | "camper_motorhome"
  | "motorcycle"
  | "cycling_focused"
  | "ferry_friendly"
  | "avoid_ferries";

export const TRANSPORT_PREFERENCE_LABELS: Record<TransportPreference, string> = {
  own_car: "Travelling in my own car",
  rental_car: "Planning to rent a car",
  public_transport_preferred: "Prefer buses & trains",
  avoid_driving: "Not driving — transfers & ferries only",
  camper_motorhome: "Camper or motorhome",
  motorcycle: "Motorcycle",
  cycling_focused: "Cycling-focused trip",
  ferry_friendly: "Ferry travel is a highlight for me",
  avoid_ferries: "I'd rather skip ferries",
};

/** Where the transport information originates — determines how it should be cited. */
export type TransportSourceType =
  | "editorial_knowledge"
  | "operator_website"
  | "community_report"
  | "ai_estimate";

export interface TransportSource {
  type: TransportSourceType;
  name: string;
  url?: string;
  /** YYYY-MM or YYYY */
  verified_at?: string;
}

/** Structured ferry metadata — always verified before display; never fabricated schedules. */
export interface FerryInfo {
  operator_name?: string;
  operator_url?: string;
  /** Season or year when this was last verified, e.g. "Summer 2025". */
  last_verified_season?: string;
  /** True if the ferry accepts vehicles (cars, campervans). */
  vehicle_capable?: boolean;
  frequency_hint?: string;
  advance_booking_required?: boolean;
  booking_tip?: string;
}

/** Border crossing notes — inherently changeable; never presented as definitive. */
export interface BorderInfo {
  crossing_point?: string;
  typical_wait_hint?: string;
  document_requirements?: string;
  /** Never presented as current; always accompanied by a "verify before travel" disclaimer. */
  last_verified?: string;
}

/** Road quality and suitability notes for campers and large vehicles. */
export interface CamperRoadInfo {
  road_quality?: "excellent" | "good" | "mixed" | "rough" | "not_recommended_for_large_vehicles";
  narrow_road_warning?: boolean;
  max_vehicle_length_hint?: string;
  parking_hint?: string;
  scenic_drive_highlight?: string;
}

/**
 * An editorial logistics connection between two destinations.
 * Stable-knowledge fields are safe to display; live-schedule fields must never be fabricated.
 */
export interface LogisticsConnection {
  id: string;
  from_destination_slug: string;
  to_destination_slug: string;
  /** Most natural transport mode for this leg. */
  primary_mode: TransportMode;
  /** Alternative modes the traveller can reasonably consider. */
  alternative_modes?: TransportMode[];
  /** Estimated driving distance in km — may be null if crossing requires ferry. */
  road_distance_km?: number | null;
  /** Estimated drive time as a human-readable string, e.g. "2h 30min". EDITORIAL_ESTIMATE only. */
  drive_time_estimate?: string | null;
  /** Estimated public transport journey time. */
  transit_time_estimate?: string | null;
  practicality: RoutePracticality;
  /** Optional editorial note — tips, scenic route callouts, etc. */
  editorial_note?: string | null;
  ferry_info?: FerryInfo | null;
  border_info?: BorderInfo | null;
  camper_info?: CamperRoadInfo | null;
  sources?: TransportSource[];
  /** Only active connections appear in itinerary guidance. */
  active: boolean;
  /** Development/demo fixtures must never surface in production. */
  demo_only?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * A computed travel segment for a specific itinerary leg — built client-side from
 * LogisticsConnection data (or haversine fallback) after the AI itinerary is generated.
 */
export interface TravelSegment {
  from_destination_name: string;
  from_destination_slug: string;
  to_destination_name: string;
  to_destination_slug: string;
  primary_mode: TransportMode;
  /** km between the two stops — haversine if no connection record exists. */
  distance_km: number;
  drive_time_estimate?: string | null;
  transit_time_estimate?: string | null;
  practicality: RoutePracticality;
  editorial_note?: string | null;
  ferry_info?: FerryInfo | null;
  border_info?: BorderInfo | null;
  camper_info?: CamperRoadInfo | null;
  /** True when built from haversine + heuristics rather than an editorial connection. */
  is_estimated: boolean;
}

// ─── Phase 20: Cultural Intelligence ─────────────────────────────────────────

export type CulturalInsightScope = "DESTINATION" | "REGION" | "COUNTRY";
export const CULTURAL_INSIGHT_SCOPE_LABELS: Record<CulturalInsightScope, string> = {
  DESTINATION: "Destination-specific",
  REGION: "Regional",
  COUNTRY: "Country-wide",
};

export type CulturalInsightCategory =
  | "LOCAL_RHYTHM"
  | "SOCIAL_CUSTOM"
  | "FOOD_CULTURE"
  | "COFFEE_CULTURE"
  | "MARKET_CULTURE"
  | "RELIGIOUS_OBSERVANCE"
  | "DRESS_CODE"
  | "TIPPING_ETIQUETTE"
  | "BARGAINING_NORMS"
  | "NOISE_AND_PACE"
  | "HOSPITALITY_CUSTOMS"
  | "FAMILY_AND_COMMUNITY"
  | "SEASONAL_RHYTHM"
  | "FESTIVAL_AND_CELEBRATION"
  | "LANGUAGE_TIPS"
  | "GETTING_AROUND_LOCALLY"
  | "SAFETY_AWARENESS"
  | "DIGITAL_AND_CONNECTIVITY"
  | "MONEY_AND_PAYMENT"
  | "PHOTOGRAPHY_ETIQUETTE"
  | "ENVIRONMENTAL_NORMS"
  | "LGBTQ_CONTEXT"
  | "ACCESSIBILITY_CONTEXT";

export const CULTURAL_INSIGHT_CATEGORY_LABELS: Record<CulturalInsightCategory, string> = {
  LOCAL_RHYTHM: "Local Rhythm",
  SOCIAL_CUSTOM: "Social Customs",
  FOOD_CULTURE: "Food Culture",
  COFFEE_CULTURE: "Coffee Culture",
  MARKET_CULTURE: "Market Culture",
  RELIGIOUS_OBSERVANCE: "Religious Observance",
  DRESS_CODE: "Dress Code",
  TIPPING_ETIQUETTE: "Tipping Etiquette",
  BARGAINING_NORMS: "Bargaining Norms",
  NOISE_AND_PACE: "Noise & Pace",
  HOSPITALITY_CUSTOMS: "Hospitality Customs",
  FAMILY_AND_COMMUNITY: "Family & Community",
  SEASONAL_RHYTHM: "Seasonal Rhythm",
  FESTIVAL_AND_CELEBRATION: "Festivals & Celebrations",
  LANGUAGE_TIPS: "Language Tips",
  GETTING_AROUND_LOCALLY: "Getting Around Locally",
  SAFETY_AWARENESS: "Safety Awareness",
  DIGITAL_AND_CONNECTIVITY: "Digital & Connectivity",
  MONEY_AND_PAYMENT: "Money & Payment",
  PHOTOGRAPHY_ETIQUETTE: "Photography Etiquette",
  ENVIRONMENTAL_NORMS: "Environmental Norms",
  LGBTQ_CONTEXT: "LGBTQ+ Context",
  ACCESSIBILITY_CONTEXT: "Accessibility",
};

export type CulturalConfidence =
  | "EDITORIAL_VERIFIED"
  | "LOCAL_CONTEXT"
  | "GENERAL_GUIDANCE"
  | "VERIFY_CURRENT_CONTEXT";

export const CULTURAL_CONFIDENCE_LABELS: Record<CulturalConfidence, string> = {
  EDITORIAL_VERIFIED: "Editorial verified",
  LOCAL_CONTEXT: "Local context",
  GENERAL_GUIDANCE: "General guidance",
  VERIFY_CURRENT_CONTEXT: "Verify current context",
};

export type CulturalSensitivity =
  | "NONE"
  | "NEEDS_REVIEW"
  | "HISTORICALLY_SENSITIVE"
  | "POLITICALLY_SENSITIVE";

export const CULTURAL_SENSITIVITY_LABELS: Record<CulturalSensitivity, string> = {
  NONE: "None",
  NEEDS_REVIEW: "Needs review",
  HISTORICALLY_SENSITIVE: "Historically sensitive",
  POLITICALLY_SENSITIVE: "Politically sensitive",
};

export interface CulturalInsight {
  id: string;
  scope: CulturalInsightScope;
  /** Matches a destination slug when scope === "DESTINATION", region slug when "REGION", country code when "COUNTRY". */
  scope_slug: string;
  category: CulturalInsightCategory;
  headline: string;
  body: string;
  /** Optional second paragraph providing additional nuance. */
  nuance?: string | null;
  confidence: CulturalConfidence;
  sensitivity: CulturalSensitivity;
  /** Optional tag for seasonal applicability, e.g. "summer", "ramadan". */
  seasonal_tag?: string | null;
  active: boolean;
  demo_only: boolean;
  created_at: string;
  updated_at: string;
}

export type LocalPhraseCategory =
  | "GREETING"
  | "THANKS"
  | "FOOD_ORDER"
  | "DIRECTIONS"
  | "SHOPPING"
  | "EMERGENCY"
  | "COURTESY"
  | "NUMBERS";

export const LOCAL_PHRASE_CATEGORY_LABELS: Record<LocalPhraseCategory, string> = {
  GREETING: "Greetings",
  THANKS: "Thanks",
  FOOD_ORDER: "Ordering Food",
  DIRECTIONS: "Directions",
  SHOPPING: "Shopping",
  EMERGENCY: "Emergency",
  COURTESY: "Courtesy",
  NUMBERS: "Numbers",
};

export interface LocalPhrase {
  id: string;
  /** ISO 639-1 or BCP-47 language code, e.g. "hr", "bs", "sr", "mk", "sq". */
  language_code: string;
  language_name: string;
  category: LocalPhraseCategory;
  phrase: string;
  transliteration?: string | null;
  translation: string;
  pronunciation_tip?: string | null;
  /** Countries or regions where this phrase is applicable. */
  applicable_country_codes: string[];
  active: boolean;
  demo_only: boolean;
}

export type FounderNoteScope = "DESTINATION" | "REGION" | "COUNTRY" | "GENERAL";
export const FOUNDER_NOTE_SCOPE_LABELS: Record<FounderNoteScope, string> = {
  DESTINATION: "Destination",
  REGION: "Regional",
  COUNTRY: "Country",
  GENERAL: "General",
};

export interface FounderNote {
  id: string;
  scope: FounderNoteScope;
  /** Matches destination/region/country slug when scope is not GENERAL. */
  scope_slug?: string | null;
  headline: string;
  body: string;
  /** Optional attribution label shown alongside the note, e.g. "— Anita, founder". */
  attribution?: string | null;
  /** Optional URL-safe image key for founder photo. */
  image_key?: string | null;
  active: boolean;
  demo_only: boolean;
  created_at: string;
}

export type PersonalConnectionStatus = "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";

export interface PersonalConnectionStory {
  id: string;
  destination_slug: string;
  author_display_name: string;
  story: string;
  connection_type?: string | null;
  status: PersonalConnectionStatus;
  created_at: string;
}

export type CulturalContributionStatus = "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";

export interface CulturalContribution {
  id: string;
  destination_slug?: string | null;
  region_slug?: string | null;
  country_code?: string | null;
  category: CulturalInsightCategory;
  suggested_headline: string;
  suggested_body: string;
  contributor_display_name?: string | null;
  contributor_user_id?: string | null;
  status: CulturalContributionStatus;
  reviewer_note?: string | null;
  created_at: string;
}

export interface CulturalMatchResult {
  insights: CulturalInsight[];
  phrases: LocalPhrase[];
  /** Surfaced founder note, if one matches the scope. AI may surface; AI may NEVER invent. */
  founderNote: FounderNote | null;
  personalStories: PersonalConnectionStory[];
}

// ---------------------------------------------------------------------------
// Phase 21 — Travel Memory & Adaptive Traveller Intelligence
// ---------------------------------------------------------------------------

/** Where a memory signal came from. Determines base weight and decay protection. */
export type MemorySignalSource =
  | "PROFILE_CONFIRMATION"      // Explicitly set in account settings (weight: 1.0, never decays)
  | "WIZARD_SELECTION"          // Chosen in the planner wizard (weight: 0.8)
  | "ITINERARY_KEEP"            // Kept an itinerary without regenerating (weight: 0.6)
  | "ITINERARY_REGENERATE"      // Regenerated — signals what was NOT wanted (weight: 0.4)
  | "PARTNER_SAVE"              // Saved a partner listing (weight: 0.4)
  | "DIRECT_MEMORY_CONFIRMATION"// Confirmed a signal from the memory UI (weight: 1.0, never decays)
  | "TRIP_COMPLETION_FEEDBACK"; // Explicit post-trip feedback (weight: 0.7)

export const MEMORY_SIGNAL_SOURCE_WEIGHTS: Record<MemorySignalSource, number> = {
  PROFILE_CONFIRMATION: 1.0,
  WIZARD_SELECTION: 0.8,
  ITINERARY_KEEP: 0.6,
  ITINERARY_REGENERATE: 0.4,
  PARTNER_SAVE: 0.4,
  DIRECT_MEMORY_CONFIRMATION: 1.0,
  TRIP_COMPLETION_FEEDBACK: 0.7,
};

/** Sources where signals are treated as authoritative and never decay over time. */
export const PROTECTED_MEMORY_SOURCES = new Set<MemorySignalSource>([
  "PROFILE_CONFIRMATION",
  "DIRECT_MEMORY_CONFIRMATION",
]);

/** Sources whose signals are considered weak on first observation (require repetition to strengthen). */
export const WEAK_SIGNAL_SOURCES = new Set<MemorySignalSource>([
  "ITINERARY_REGENERATE",
  "PARTNER_SAVE",
]);

/** The complete allowlist of sources accepted at ingestion — anything outside this set is rejected. */
export const ALLOWED_MEMORY_SIGNAL_SOURCES = new Set<MemorySignalSource>([
  "PROFILE_CONFIRMATION",
  "WIZARD_SELECTION",
  "ITINERARY_KEEP",
  "ITINERARY_REGENERATE",
  "PARTNER_SAVE",
  "DIRECT_MEMORY_CONFIRMATION",
  "TRIP_COMPLETION_FEEDBACK",
]);

/** Preference domains the memory engine may track. */
export type MemoryPreferenceDomain =
  | "PACE"               // Relaxed vs active travel cadence
  | "BUDGET"             // Spending comfort level
  | "ACCOMMODATION"      // Stay type preference
  | "TRANSPORT"          // Preferred transit modes
  | "FOOD_CULTURE"       // Dining style and food interests
  | "NATURE"             // Outdoor and landscape preference
  | "HISTORY"            // Historical and cultural interest
  | "ART"                // Art and museums
  | "NIGHTLIFE"          // Evening and nightlife preference
  | "PHOTOGRAPHY"        // Photography interest
  | "ADVENTURE"          // Adventure activities
  | "WELLNESS"           // Wellness and spa preference
  | "FAMILY"             // Family-oriented features
  | "ROMANCE"            // Romantic travel preference
  | "SOLO"               // Solo travel preference
  | "GROUP"              // Group travel preference
  | "BEACHES"            // Beach and coastal preference
  | "MOUNTAINS"          // Mountain and highlands preference
  | "CITIES"             // Urban exploration preference
  | "RURAL"              // Rural and off-the-beaten-path preference
  | "SUSTAINABILITY"     // Eco-conscious travel preference
  | "LANGUAGE"           // Language learning interest
  | "COFFEE_CULTURE"     // Coffee culture and café preference
  | "WINE"               // Wine and vineyard preference
  | "LOCAL_EVENTS"       // Local festivals and events
  | "HIDDEN_GEMS"        // Off-the-beaten-path preference
  | "GUIDED_TOURS"       // Guided vs self-guided preference
  | "ISLAND_HOPPING"     // Island and coastal route preference
  | "ROAD_TRIPS"         // Road trip preference
  | "SLOW_TRAVEL";       // Extended stay in fewer places

export const MEMORY_PREFERENCE_DOMAIN_LABELS: Record<MemoryPreferenceDomain, string> = {
  PACE: "Travel pace",
  BUDGET: "Budget comfort",
  ACCOMMODATION: "Accommodation style",
  TRANSPORT: "Transport preference",
  FOOD_CULTURE: "Food & dining",
  NATURE: "Nature & outdoors",
  HISTORY: "History & heritage",
  ART: "Art & museums",
  NIGHTLIFE: "Nightlife",
  PHOTOGRAPHY: "Photography",
  ADVENTURE: "Adventure activities",
  WELLNESS: "Wellness & spa",
  FAMILY: "Family travel",
  ROMANCE: "Romantic travel",
  SOLO: "Solo travel",
  GROUP: "Group travel",
  BEACHES: "Beaches & coast",
  MOUNTAINS: "Mountains & highlands",
  CITIES: "Urban exploration",
  RURAL: "Rural & countryside",
  SUSTAINABILITY: "Eco-conscious travel",
  LANGUAGE: "Language learning",
  COFFEE_CULTURE: "Coffee culture",
  WINE: "Wine & vineyards",
  LOCAL_EVENTS: "Local events & festivals",
  HIDDEN_GEMS: "Hidden gems",
  GUIDED_TOURS: "Guided experiences",
  ISLAND_HOPPING: "Island hopping",
  ROAD_TRIPS: "Road trips",
  SLOW_TRAVEL: "Slow travel",
};

/**
 * Domains that must NEVER be inferred from travel behaviour.
 * Signals targeting these domains are rejected at ingestion regardless of source.
 * This is a hard privacy guardrail — not configurable.
 */
export const BLOCKED_MEMORY_DOMAINS = new Set<string>([
  "RELIGION",
  "ETHNICITY",
  "RACE",
  "SEXUAL_ORIENTATION",
  "POLITICAL_AFFILIATION",
  "HEALTH",
  "DISABILITY",
  "INCOME",
  "IMMIGRATION_STATUS",
  "CRIMINAL_HISTORY",
]);

/** Which direction a preference signal points. */
export type MemorySignalDirection = "POSITIVE" | "NEGATIVE" | "NEUTRAL";

/** Traveller's review state for a specific memory signal. */
export type MemoryConfirmationStatus = "UNCONFIRMED" | "CONFIRMED" | "REJECTED";

/** Trip group context at time of signal observation. */
export type MemoryTripContext =
  | "SOLO"
  | "COUPLE"
  | "FAMILY"
  | "FRIENDS"
  | "WORKATION"
  | "ROAD_TRIP";

/** One observed travel preference signal. Rows deduplicate on (user_id, domain, subject, direction). */
export interface TravelMemorySignal {
  id: string;
  user_id: string;
  source: MemorySignalSource;
  domain: MemoryPreferenceDomain;
  /** Human-readable description, e.g. "slow mornings and cafés" */
  subject: string;
  /** Optional specific value, e.g. "Dubrovnik", "Croatian wine" */
  value?: string | null;
  direction: MemorySignalDirection;
  /** Computed 0–1 strength (source weight + repetition bonus, capped at 1.0) */
  strength: number;
  /** Computed 0–1 confidence (source weight + repetition + confirmation status) */
  confidence: number;
  source_trip_id?: string | null;
  /** How many times this signal has been observed (incremented on repeat) */
  occurrence_count: number;
  first_observed_at: string;
  last_observed_at: string;
  trip_context?: MemoryTripContext | null;
  confirmation_status: MemoryConfirmationStatus;
  /** For REJECTED signals: ISO timestamp when the 90-day cooldown expires */
  rejected_until?: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type MemoryStrengthLabel = "strong_pattern" | "noticed" | "still_learning";

/** Aggregated summary of a traveller's memory signals, for UI display. */
export interface TravelMemorySummary {
  confirmed: TravelMemorySignal[];
  strong: TravelMemorySignal[];
  noticed: TravelMemorySignal[];
  learning: TravelMemorySignal[];
  total: number;
}

// ---------------------------------------------------------------------------
// Phase 22 — Trip Companion & Pre-Trip Readiness Engine
// ---------------------------------------------------------------------------

export type ReadinessCategory =
  | "DOCUMENTS"
  | "VISA"
  | "HEALTH"
  | "INSURANCE"
  | "ACCOMMODATION"
  | "TRANSPORT"
  | "FERRY"
  | "BORDER_CROSSING"
  | "MONEY"
  | "CONNECTIVITY"
  | "PACKING"
  | "WEATHER"
  | "LOCAL_CUSTOMS"
  | "EMERGENCY"
  | "LANGUAGE"
  | "ACTIVITIES"
  | "FOOD";

/**
 * When this readiness item becomes relevant relative to departure.
 * DO_NOW is a system override for items that are immediately actionable regardless of countdown.
 */
export type ReadinessTimingWindow =
  | "DO_NOW"          // Immediate regardless of timeline
  | "NOW_URGENT"      // ≤3 days to departure
  | "THIS_WEEK"       // 4–14 days
  | "THIS_MONTH"      // 15–30 days
  | "BEFORE_YOU_GO"   // 31–90 days
  | "PLANNING_PHASE"  // >90 days, or no departure date set
  | "IN_DESTINATION"  // Relevant once travelling, not before
  | "POST_TRIP";      // After return

export type ReadinessStatus = "PENDING" | "DONE" | "SKIPPED" | "NA";
export type ReadinessPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type ReservationSensitivity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

/** "Planning is not booking" — explicit three-state booking model. */
export type BookingState = "NOT_STARTED" | "PLANNED" | "USER_MARKED_BOOKED";

export type TripCountdownState = "FUTURE" | "TODAY" | "STARTED" | "COMPLETED";

export interface TripReadinessItem {
  id: string;
  user_id: string;
  trip_id: string;
  rule_key: string;
  category: ReadinessCategory;
  timing_window: ReadinessTimingWindow;
  status: ReadinessStatus;
  priority: ReadinessPriority;
  title: string;
  description: string;
  notes?: string | null;
  booking_state: BookingState;
  reservation_sensitivity: ReservationSensitivity;
  is_auto_generated: boolean;
  context_metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface TripReadinessSummary {
  countdownState: TripCountdownState;
  daysUntilDeparture: number | null;
  total: number;
  done: number;
  critical: TripReadinessItem[];
  urgent: TripReadinessItem[];
  thisWeek: TripReadinessItem[];
  thisMonth: TripReadinessItem[];
  planningPhase: TripReadinessItem[];
}

export interface WhatMattersNow {
  state: TripCountdownState;
  daysUntilDeparture: number | null;
  items: TripReadinessItem[];
}

export const READINESS_CATEGORY_LABELS: Record<ReadinessCategory, string> = {
  DOCUMENTS: "Documents",
  VISA: "Visa",
  HEALTH: "Health",
  INSURANCE: "Insurance",
  ACCOMMODATION: "Accommodation",
  TRANSPORT: "Transport",
  FERRY: "Ferry",
  BORDER_CROSSING: "Border Crossing",
  MONEY: "Money & Cards",
  CONNECTIVITY: "Connectivity",
  PACKING: "Packing",
  WEATHER: "Weather",
  LOCAL_CUSTOMS: "Local Customs",
  EMERGENCY: "Emergency",
  LANGUAGE: "Language",
  ACTIVITIES: "Activities",
  FOOD: "Food & Dining",
};

/** Ordering used when displaying timing windows in the UI, most urgent first. */
export const READINESS_TIMING_WINDOW_ORDER: Record<ReadinessTimingWindow, number> = {
  DO_NOW: 0,
  NOW_URGENT: 1,
  THIS_WEEK: 2,
  THIS_MONTH: 3,
  BEFORE_YOU_GO: 4,
  PLANNING_PHASE: 5,
  IN_DESTINATION: 6,
  POST_TRIP: 7,
};

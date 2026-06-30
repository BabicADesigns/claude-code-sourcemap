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

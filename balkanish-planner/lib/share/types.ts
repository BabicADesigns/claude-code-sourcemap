import type { ShareBrandConfig } from "@/lib/share/brand-config";

/** Three output formats from the same data model. */
export type ShareFormat = "story" | "feed" | "postcard";

/** Template IDs — controls the visual layout and copy style. */
export type ShareTemplateId = "JOURNEY_SUMMARY" | "BALKAN_STORY" | "POSTCARD";

/** Output pixel dimensions for each format (CSS pixels; export at 2× pixelRatio). */
export const SHARE_CARD_DIMENSIONS: Record<ShareFormat, { width: number; height: number }> = {
  story:    { width: 360, height: 640 },   // 9:16  → 720×1280 @2×
  feed:     { width: 400, height: 400 },   // 1:1   → 800×800  @2×
  postcard: { width: 400, height: 500 },   // 4:5   → 800×1000 @2×
};

/**
 * Normalized, sanitized trip data consumed by the share renderer.
 *
 * The sanitizer produces this from a SavedItinerary.
 * The renderer NEVER receives raw database rows or internal confidence scores.
 * No private notes, no user email, no exact current location.
 */
export interface TripShareSnapshot {
  /** Stable trip identifier (safe — user's own data, never exposed publicly) */
  tripId: string;
  /** User-renamed title, or the AI-generated trip_title */
  title: string;
  /** Number of nights */
  durationDays: number;
  /** Travel month, e.g. "June" */
  month: string;
  /** Pace label for display: "Relaxed", "Balanced", "Explorer" */
  paceLabel: string;
  /**
   * Country display label.
   * Single-country trips: e.g. "Croatia".
   * Multi-country trips: "The Balkans".
   */
  countryLabel: string;
  /**
   * Ordered route string, e.g. "Split → Dubrovnik → Kotor".
   * Derived from non-day-trip map_points, sorted by day, max 4 stops shown.
   * Null when map_points are not available.
   */
  routeText: string | null;
  /** Number of overnight stops (from route_summary.stop_count) */
  stopCount: number;
  /** Number of day trips (from route_summary.day_trip_count). Null = unknown. */
  dayTripCount: number | null;
  /**
   * Total route distance in km.
   * Null when data is unreliable or unavailable (never fabricated).
   */
  totalDistanceKm: number | null;
  /** Attribution and branding config */
  brandConfig: ShareBrandConfig;
}

export interface ShareTemplate {
  id: ShareTemplateId;
  /** i18n key for the template display name */
  labelKey: string;
  /** Default supported formats */
  formats: ShareFormat[];
}

/**
 * Phase 18 — Local Trust & Partner Recommendation System
 *
 * Development/demo fixture data. No real partners are listed here yet.
 * All entries with demo_only: true and active: false are NEVER shown
 * in production itineraries or user-facing recommendation surfaces.
 *
 * How real partners will be onboarded:
 *   1. Editorial team manually verifies the partner
 *   2. Partner record is created with verified_at + verified_by
 *   3. active is set to true by the editorial team
 *   4. demo_only remains false for real partners
 *
 * See docs/local-trust-recommendation-system.md §Partner Onboarding.
 */

import type { LocalPartner } from "@/lib/types";

export const mockPartners: LocalPartner[] = [
  // -------------------------------------------------------------------------
  // DEMO FIXTURE — NOT LIVE
  // Ranger Hero is a future partner in development.
  // This fixture exists to validate the recommendation architecture.
  // It will never appear in production itineraries (active: false, demo_only: true).
  // Real onboarding will happen once Ranger Hero launches.
  // -------------------------------------------------------------------------
  {
    id: "demo-ranger-hero",
    name: "Ranger Hero",
    slug: "ranger-hero",
    trust_level: "founder_pick",
    commercial_relationship: "owned_or_affiliated_project",
    disclosure_text:
      "Disclosure: Ranger Hero is a project closely connected to the Balkanish family. This recommendation is personal and genuine — commercial relationship does not influence its ranking.",
    category: "outdoor_adventure",
    categories: ["outdoor_adventure", "family", "workspace", "experience"],
    country: "Croatia",
    region: "Kvarner",
    destination_slugs: [],
    short_description:
      "Outdoor adventures, family experiences, and a future basecamp on the Kvarner Riviera — coming soon.",
    founder_note:
      "This one is personal. Ranger Hero is part of the same story as Balkanish — a vision for the Kvarner coast that invites you to stay longer, go deeper, and come back. If you were travelling with me through Kvarner, this is where I'd send you.",
    website_url: null,
    instagram_url: null,
    booking_url: null,
    app_url: null,
    traveler_interests: ["adventure", "family", "hiking", "wellness"],
    mobility_options: ["bicycle", "walking", "car"],
    travel_moods: ["adventure", "family_time", "slow_living", "digital_detox"],
    trip_paces: ["relaxed", "balanced"],
    family_suitable: true,
    best_months: [4, 5, 6, 7, 8, 9, 10],
    priority: 90,
    active: false,
    demo_only: true,
  },
];

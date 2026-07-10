"use server";

import { revalidatePath } from "next/cache";
import type { DestinationCategory, DiscoveredDestination, ItineraryFocus } from "@/lib/types";
import { getCurrentUser, isSupabaseConfigured } from "@/lib/supabase/server";
import { createSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { isEditorEmail } from "@/lib/auth/editors";
import { ITINERARY_FOCUS_TRAVEL_TYPES } from "@/lib/data/itinerary-focus";
import { synthesizeImageAsset } from "@/lib/media/normalize";
import { slugify } from "@/lib/utils";
import { logError } from "@/lib/monitoring/logger";

const MODERATION_PAGE_PATH = "/admin/discoveries";

/** Best-effort default category for a freshly-promoted destination — an editor can refine it later directly in Supabase; promotion only needs to produce something reasonable, never a placeholder that blocks the row from existing. */
const FOCUS_TO_CATEGORY: Record<ItineraryFocus, DestinationCategory> = {
  coast: "island_secrets",
  food: "local_favorites",
  wine: "local_favorites",
  slow_living: "quiet_escapes",
  romantic: "romantic_spots",
  family: "family_friendly",
  culture: "local_favorites",
  national_park: "nature",
  road_trip: "local_favorites",
  mixed: "local_favorites",
};

async function requireEditor(): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Accounts aren't connected yet." };
  const user = await getCurrentUser();
  if (!isEditorEmail(user?.email)) return { error: "You're not authorized to moderate discoveries." };
  return {};
}

export async function approveDiscoveredDestination(id: string): Promise<{ error?: string }> {
  const gate = await requireEditor();
  if (gate.error) return gate;
  if (!isSupabaseAdminConfigured()) return { error: "Moderation isn't connected yet." };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("discovered_destinations").update({ moderation_status: "approved" }).eq("id", id);
  if (error) {
    logError("actions.discoveredDestinations.approve", error, { id });
    return { error: "Couldn't approve that discovery." };
  }
  revalidatePath(MODERATION_PAGE_PATH);
  return {};
}

export async function rejectDiscoveredDestination(id: string): Promise<{ error?: string }> {
  const gate = await requireEditor();
  if (gate.error) return gate;
  if (!isSupabaseAdminConfigured()) return { error: "Moderation isn't connected yet." };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("discovered_destinations").update({ moderation_status: "rejected" }).eq("id", id);
  if (error) {
    logError("actions.discoveredDestinations.reject", error, { id });
    return { error: "Couldn't reject that discovery." };
  }
  revalidatePath(MODERATION_PAGE_PATH);
  return {};
}

/**
 * The one-action "convert to Official Destination" workflow (requirement #6) — inserts a full
 * row into the real public.destinations table the planner's browse/detail pages already read
 * (see docs/ai-expansion-engine-architecture.md for the documented limitation that lib/ai/
 * grounding.ts itself won't select this new stop until it's re-deployed against live Supabase
 * data, same as every other curated destination today). Scores default to the neutral 5.0 used
 * across the codebase for "not yet earned" ratings (migration 0003); the hero image reuses the
 * exact picsum.photos + "Unassigned" placeholder pattern lib/media/normalize.ts already applies
 * to legacy/missing photography, so promotion never fabricates real photography or editorial
 * copy — only a real database row a human can finish writing later. One-way; never re-runnable
 * once promoted_destination_id is set.
 */
export async function promoteDiscoveredDestination(id: string): Promise<{ error?: string; destinationSlug?: string }> {
  const gate = await requireEditor();
  if (gate.error) return gate;
  if (!isSupabaseAdminConfigured()) return { error: "Promotion isn't connected yet." };

  const supabase = createSupabaseAdminClient();
  const { data: existing, error: fetchError } = await supabase
    .from("discovered_destinations")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (fetchError || !existing) {
    if (fetchError) logError("actions.discoveredDestinations.promote.fetch", fetchError, { id });
    return { error: "Couldn't find that discovery." };
  }

  const row = existing as DiscoveredDestination;
  if (row.promoted_destination_id) return { error: "Already promoted." };

  const label = `${row.name}, ${row.region}`;
  const slug = slugify(`${row.name}-${row.region}`);
  const focusTags = row.matched_focus.length > 0 ? row.matched_focus : (["mixed"] as ItineraryFocus[]);
  const travelTypes = Array.from(new Set(focusTags.flatMap((focus) => ITINERARY_FOCUS_TRAVEL_TYPES[focus])));
  const category = FOCUS_TO_CATEGORY[focusTags[0]];
  // Always set — synthesizeImageAsset only returns undefined when given no url, and we always give one.
  const heroImage = synthesizeImageAsset(`https://picsum.photos/seed/${slug}/1200/800`, label)!;

  const { data: inserted, error: insertError } = await supabase
    .from("destinations")
    .insert({
      slug,
      name: row.name,
      region: row.region,
      country: row.country,
      category,
      travel_types: travelTypes.length > 0 ? travelTypes : ["weekend_escape"],
      summary: "Promoted from an AI-suggested discovery — full editorial summary pending.",
      description: `${row.rationale} (AI-suggested rationale — pending full editorial research and fact-checking.)`,
      why_we_love_it:
        'This destination was surfaced by the AI Expansion Engine and approved by an editor for promotion, but its full "why we love it" story hasn\'t been written yet.',
      best_season: "Not yet confirmed — pending editorial review.",
      local_score: 5.0,
      crowd_score: 5.0,
      slow_living_score: 5.0,
      food_score: 5.0,
      story_score: 5.0,
      sunset_score: 5.0,
      hero_image_url: heroImage.url,
      gallery_image_urls: [],
      hero_image: heroImage,
      gallery_images: [],
      is_featured: false,
      latitude: row.latitude,
      longitude: row.longitude,
    })
    .select("id, slug")
    .single();

  if (insertError || !inserted) {
    logError("actions.discoveredDestinations.promote.insert", insertError, { id });
    return { error: "Couldn't create the official destination." };
  }

  const { error: updateError } = await supabase
    .from("discovered_destinations")
    .update({ moderation_status: "approved", promoted_destination_id: inserted.id })
    .eq("id", id);
  if (updateError) logError("actions.discoveredDestinations.promote.update", updateError, { id });

  revalidatePath(MODERATION_PAGE_PATH);
  revalidatePath("/hidden-gems");
  return { destinationSlug: inserted.slug };
}

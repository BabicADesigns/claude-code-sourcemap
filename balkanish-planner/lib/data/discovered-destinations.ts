import type { DestinationCandidate, DiscoveredDestination, ModerationStatus } from "@/lib/types";
import { createSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";
import { logError } from "@/lib/monitoring/logger";

/**
 * Deterministic dedup key for the shared discovered_destinations registry (migration 0012) — the
 * same real place suggested across many itinerary requests, by the same user or different ones,
 * collapses into one row instead of duplicating. This is what makes human review tractable.
 */
export function normalizedKeyFor(candidate: Pick<DestinationCandidate, "name" | "region" | "country">): string {
  return slugify(`${candidate.name}-${candidate.region}-${candidate.country}`);
}

/**
 * Upserts an AI-discovered candidate into the shared registry and returns its persistent
 * moderation status. Never throws — mirrors discoverDestinationCandidates's own "never throws"
 * guarantee, since a registry failure must never block returning an itinerary to the user.
 * Never downgrades an editor's prior decision: a candidate matching an already-approved or
 * already-rejected row keeps that status; it's not reset to "pending" just because the AI
 * proposed the same place again. When the admin client isn't configured (the expected state for
 * local prototyping), returns "pending" — the safe default the UI already treats as unreviewed.
 */
export async function registerDiscoveredDestination(candidate: DestinationCandidate): Promise<ModerationStatus> {
  if (!isSupabaseAdminConfigured()) return "pending";

  const normalizedKey = normalizedKeyFor(candidate);
  const supabase = createSupabaseAdminClient();

  try {
    const { data: existing, error: selectError } = await supabase
      .from("discovered_destinations")
      .select("moderation_status, times_suggested")
      .eq("normalized_key", normalizedKey)
      .maybeSingle();
    if (selectError) {
      logError("data.discoveredDestinations.register.select", selectError, { normalizedKey });
      return "pending";
    }

    if (existing) {
      const { error: updateError } = await supabase
        .from("discovered_destinations")
        .update({
          confidence_score: candidate.confidence_score,
          verification_status: candidate.verification_status,
          rationale: candidate.rationale,
          matched_focus: candidate.matched_focus,
          times_suggested: existing.times_suggested + 1,
        })
        .eq("normalized_key", normalizedKey);
      if (updateError) logError("data.discoveredDestinations.register.update", updateError, { normalizedKey });
      return existing.moderation_status as ModerationStatus;
    }

    const { error: insertError } = await supabase.from("discovered_destinations").insert({
      normalized_key: normalizedKey,
      name: candidate.name,
      region: candidate.region,
      country: candidate.country,
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      source: candidate.source,
      confidence_score: candidate.confidence_score,
      verification_status: candidate.verification_status,
      rationale: candidate.rationale,
      matched_focus: candidate.matched_focus,
    });
    if (insertError) {
      logError("data.discoveredDestinations.register.insert", insertError, { normalizedKey });
      return "pending";
    }
    return "pending";
  } catch (error) {
    logError("data.discoveredDestinations.register", error, { normalizedKey });
    return "pending";
  }
}

/**
 * Bumps times_saved for every discovered candidate embedded in a saved itinerary (requirement #8,
 * Future Learning Layer) — a usage signal future ranking/moderation can draw on, alongside
 * times_suggested. Never throws; called best-effort after a successful saveItinerary insert, same
 * as the anonymous-itinerary-logging call in app/api/planner/route.ts.
 */
export async function incrementDiscoveredDestinationSaves(candidates: DestinationCandidate[]): Promise<void> {
  if (!isSupabaseAdminConfigured() || candidates.length === 0) return;
  const supabase = createSupabaseAdminClient();

  await Promise.all(
    candidates.map(async (candidate) => {
      const normalizedKey = normalizedKeyFor(candidate);
      try {
        const { data: existing, error: selectError } = await supabase
          .from("discovered_destinations")
          .select("times_saved")
          .eq("normalized_key", normalizedKey)
          .maybeSingle();
        if (selectError || !existing) {
          if (selectError) logError("data.discoveredDestinations.incrementSaves.select", selectError, { normalizedKey });
          return;
        }
        const { error: updateError } = await supabase
          .from("discovered_destinations")
          .update({ times_saved: existing.times_saved + 1 })
          .eq("normalized_key", normalizedKey);
        if (updateError) logError("data.discoveredDestinations.incrementSaves.update", updateError, { normalizedKey });
      } catch (error) {
        logError("data.discoveredDestinations.incrementSaves", error, { normalizedKey });
      }
    })
  );
}

/**
 * All discovered destinations, newest first — backs the moderation page (app/admin/discoveries).
 * The select itself is public per RLS (same "editorial content" shape as destinations/food_finds),
 * since these names/rationales are already visible to any planner user who triggers discovery;
 * the moderation page's own access is gated separately by the EDITOR_EMAILS allow-list. Uses the
 * admin client (not the cookie-based server client) so this module never pulls "next/headers"
 * into the client bundle that lib/ai/discovery.ts's registerDiscoveredDestination ends up in via
 * lib/ai/itinerary.ts -> components/planner/planner-flow.tsx.
 */
export async function listDiscoveredDestinations(status?: ModerationStatus): Promise<DiscoveredDestination[]> {
  if (!isSupabaseAdminConfigured()) return [];
  const supabase = createSupabaseAdminClient();
  let query = supabase.from("discovered_destinations").select("*").order("created_at", { ascending: false });
  if (status) query = query.eq("moderation_status", status);
  const { data, error } = await query;
  if (error || !data) {
    if (error) logError("data.discoveredDestinations.list", error, { status });
    return [];
  }
  return data as DiscoveredDestination[];
}

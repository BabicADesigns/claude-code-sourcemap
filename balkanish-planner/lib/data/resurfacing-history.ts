import type {
  ResurfacingHistoryEntry,
  ResurfacingWindow,
  ResurfacingReason,
  MatchConfidence,
  ResurfacingAction,
} from "@/lib/types";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

/** Returns all resurfacing history for a user+trip combination. */
export async function getResurfacingHistoryForTrip(
  userId: string,
  tripId: string
): Promise<ResurfacingHistoryEntry[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("resurfacing_history")
    .select("*")
    .eq("user_id", userId)
    .eq("trip_id", tripId)
    .order("resurfaced_at", { ascending: false });
  if (error || !data) return [];
  return data as ResurfacingHistoryEntry[];
}

/** Records that a find was surfaced to the user. Returns the new entry ID or null. */
export async function recordResurfacingEvent(
  userId: string,
  captureId: string,
  tripId: string,
  window: ResurfacingWindow,
  reasons: ResurfacingReason[],
  confidence: MatchConfidence
): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("resurfacing_history")
    .insert({
      user_id: userId,
      capture_id: captureId,
      trip_id: tripId,
      window,
      reasons,
      confidence,
    })
    .select("id")
    .single();
  if (error || !data) return null;
  return data.id;
}

/** Records a user action on a resurfaced find and applies the appropriate suppression. */
export async function recordResurfacingAction(
  userId: string,
  captureId: string,
  tripId: string,
  action: ResurfacingAction,
  suppressedUntil: string | null,
  permanentlyDismissed: boolean
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = await createSupabaseServerClient();

  // Find the most recent history entry for this capture+trip (the one being acted on)
  const { data: existing } = await supabase
    .from("resurfacing_history")
    .select("id")
    .eq("user_id", userId)
    .eq("capture_id", captureId)
    .eq("trip_id", tripId)
    .is("action", null)
    .order("resurfaced_at", { ascending: false })
    .limit(1)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("resurfacing_history")
      .update({
        action,
        action_at: new Date().toISOString(),
        suppressed_until: suppressedUntil,
        permanently_dismissed: permanentlyDismissed,
      })
      .eq("id", existing.id)
      .eq("user_id", userId);
    return !error;
  }

  // No pending entry — insert a new row with the action already recorded
  const { error } = await supabase.from("resurfacing_history").insert({
    user_id: userId,
    capture_id: captureId,
    trip_id: tripId,
    window: "LIVE_TRIP",
    reasons: [],
    confidence: "LOW",
    action,
    action_at: new Date().toISOString(),
    suppressed_until: suppressedUntil,
    permanently_dismissed: permanentlyDismissed,
  });
  return !error;
}

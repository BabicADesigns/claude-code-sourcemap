import "server-only";

import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { LiveTripItemState, LiveItemStatus } from "@/lib/types";
import { logError } from "@/lib/monitoring/logger";

export async function getLiveTripItemStates(
  userId: string,
  tripId: string
): Promise<LiveTripItemState[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("live_trip_item_states")
    .select("*")
    .eq("user_id", userId)
    .eq("trip_id", tripId);
  if (error || !data) {
    if (error) logError("data.liveTrip.getLiveTripItemStates", error, { userId, tripId });
    return [];
  }
  return data as LiveTripItemState[];
}

export async function upsertLiveTripItemState(
  userId: string,
  tripId: string,
  itemKey: string,
  status: LiveItemStatus,
  note: string | null,
  changedOnDate: string
): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Not configured." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("live_trip_item_states")
    .upsert(
      {
        user_id: userId,
        trip_id: tripId,
        item_key: itemKey,
        status,
        note: note?.trim() || null,
        changed_on_date: changedOnDate,
      },
      { onConflict: "trip_id,item_key" }
    );
  if (error) {
    logError("data.liveTrip.upsertLiveTripItemState", error, { userId, tripId, itemKey });
    return { error: "Could not save item state." };
  }
  return {};
}

export async function deleteLiveTripItemState(
  userId: string,
  tripId: string,
  itemKey: string
): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Not configured." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("live_trip_item_states")
    .delete()
    .eq("user_id", userId)
    .eq("trip_id", tripId)
    .eq("item_key", itemKey);
  if (error) {
    logError("data.liveTrip.deleteLiveTripItemState", error, { userId, tripId, itemKey });
    return { error: "Could not delete item state." };
  }
  return {};
}

import "server-only";

import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { TripReadinessItem, ReadinessStatus, BookingState } from "@/lib/types";
import type { TripReadinessTemplate } from "@/lib/ai/trip-readiness";
import { logError } from "@/lib/monitoring/logger";

export async function getReadinessItems(
  userId: string,
  tripId: string
): Promise<TripReadinessItem[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("trip_readiness_items")
    .select("*")
    .eq("user_id", userId)
    .eq("trip_id", tripId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data as TripReadinessItem[];
}

/**
 * Upsert rules-engine templates into trip_readiness_items.
 * Conflict target: (trip_id, rule_key) — only updates fields that the engine owns
 * (timing_window, priority, title, description, reservation_sensitivity, context_metadata).
 * User-owned fields (status, booking_state, notes) are never overwritten on conflict.
 */
export async function upsertReadinessItems(
  userId: string,
  tripId: string,
  templates: TripReadinessTemplate[]
): Promise<void> {
  if (!isSupabaseConfigured() || templates.length === 0) return;
  const supabase = await createSupabaseServerClient();

  const rows = templates.map((t) => ({
    user_id: userId,
    trip_id: tripId,
    rule_key: t.rule_key,
    category: t.category,
    timing_window: t.timing_window,
    priority: t.priority,
    title: t.title,
    description: t.description,
    reservation_sensitivity: t.reservation_sensitivity,
    is_auto_generated: true,
    context_metadata: t.context_metadata ?? null,
  }));

  const { error } = await supabase
    .from("trip_readiness_items")
    .upsert(rows, {
      onConflict: "trip_id,rule_key",
      ignoreDuplicates: false,
    });

  if (error) {
    logError("data.tripReadiness.upsertReadinessItems", error, { userId, tripId });
  }
}

export async function updateReadinessItemStatus(
  id: string,
  userId: string,
  status: ReadinessStatus
): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Not configured." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("trip_readiness_items")
    .update({ status })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) {
    logError("data.tripReadiness.updateReadinessItemStatus", error, { id, userId });
    return { error: "Could not update item." };
  }
  return {};
}

export async function updateReadinessItemBookingState(
  id: string,
  userId: string,
  booking_state: BookingState
): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Not configured." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("trip_readiness_items")
    .update({ booking_state })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) {
    logError("data.tripReadiness.updateReadinessItemBookingState", error, { id, userId });
    return { error: "Could not update booking state." };
  }
  return {};
}

export async function updateReadinessItemNotes(
  id: string,
  userId: string,
  notes: string
): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Not configured." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("trip_readiness_items")
    .update({ notes: notes.trim() || null })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) {
    logError("data.tripReadiness.updateReadinessItemNotes", error, { id, userId });
    return { error: "Could not save notes." };
  }
  return {};
}

export async function setTripDepartureDate(
  tripId: string,
  userId: string,
  departureDate: string | null
): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Not configured." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("generated_itineraries")
    .update({ departure_date: departureDate })
    .eq("id", tripId)
    .eq("user_id", userId);
  if (error) {
    logError("data.tripReadiness.setTripDepartureDate", error, { tripId, userId });
    return { error: "Could not save departure date." };
  }
  return {};
}

"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, isSupabaseConfigured } from "@/lib/supabase/server";
import { upsertLiveTripItemState, deleteLiveTripItemState } from "@/lib/data/live-trip";

async function setItemState(
  tripId: string,
  itemKey: string,
  status: "PLANNED" | "DONE" | "SKIPPED" | "SAVED_FOR_LATER",
  note: string | null,
  todayDateString: string
): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Accounts aren't connected yet." };
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in to update your trip." };
  const result = await upsertLiveTripItemState(
    user.id,
    tripId,
    itemKey,
    status,
    note,
    todayDateString
  );
  if (!result.error) revalidatePath(`/trips/${tripId}/today`);
  return result;
}

export async function markDaySlotDone(
  tripId: string,
  itemKey: string,
  todayDateString: string
): Promise<{ error?: string }> {
  return setItemState(tripId, itemKey, "DONE", null, todayDateString);
}

export async function markDaySlotPlanned(
  tripId: string,
  itemKey: string,
  todayDateString: string
): Promise<{ error?: string }> {
  return setItemState(tripId, itemKey, "PLANNED", null, todayDateString);
}

export async function markDaySlotSkipped(
  tripId: string,
  itemKey: string,
  todayDateString: string
): Promise<{ error?: string }> {
  return setItemState(tripId, itemKey, "SKIPPED", null, todayDateString);
}

export async function markDaySlotSavedForLater(
  tripId: string,
  itemKey: string,
  todayDateString: string
): Promise<{ error?: string }> {
  return setItemState(tripId, itemKey, "SAVED_FOR_LATER", null, todayDateString);
}

export async function resetDaySlot(
  tripId: string,
  itemKey: string
): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Accounts aren't connected yet." };
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in to update your trip." };
  const result = await deleteLiveTripItemState(user.id, tripId, itemKey);
  if (!result.error) revalidatePath(`/trips/${tripId}/today`);
  return result;
}

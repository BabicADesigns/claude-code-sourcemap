"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  updateReadinessItemStatus,
  updateReadinessItemBookingState,
  updateReadinessItemNotes,
  setTripDepartureDate,
} from "@/lib/data/trip-readiness";

export async function markReadinessItemDone(id: string, tripId: string): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Accounts aren't connected yet." };
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in to update your checklist." };
  const result = await updateReadinessItemStatus(id, user.id, "DONE");
  if (!result.error) revalidatePath(`/trips/${tripId}/companion`);
  return result;
}

export async function markReadinessItemPending(id: string, tripId: string): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Accounts aren't connected yet." };
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in to update your checklist." };
  const result = await updateReadinessItemStatus(id, user.id, "PENDING");
  if (!result.error) revalidatePath(`/trips/${tripId}/companion`);
  return result;
}

export async function markReadinessItemSkipped(id: string, tripId: string): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Accounts aren't connected yet." };
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in to update your checklist." };
  const result = await updateReadinessItemStatus(id, user.id, "SKIPPED");
  if (!result.error) revalidatePath(`/trips/${tripId}/companion`);
  return result;
}

export async function markReadinessItemBooked(id: string, tripId: string): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Accounts aren't connected yet." };
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in to update your checklist." };
  const result = await updateReadinessItemBookingState(id, user.id, "USER_MARKED_BOOKED");
  if (!result.error) revalidatePath(`/trips/${tripId}/companion`);
  return result;
}

export async function saveReadinessItemNotes(
  id: string,
  tripId: string,
  notes: string
): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Accounts aren't connected yet." };
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in to save notes." };
  const result = await updateReadinessItemNotes(id, user.id, notes);
  if (!result.error) revalidatePath(`/trips/${tripId}/companion`);
  return result;
}

export async function saveTripDepartureDate(
  tripId: string,
  departureDate: string | null
): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Accounts aren't connected yet." };
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in to set a departure date." };
  const result = await setTripDepartureDate(tripId, user.id, departureDate);
  if (!result.error) revalidatePath(`/trips/${tripId}/companion`);
  return result;
}

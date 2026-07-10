"use server";

import { getCurrentUser, isSupabaseConfigured } from "@/lib/supabase/server";
import { updateSignalConfirmation, deleteLearnedSignals, REJECTION_COOLDOWN_DAYS } from "@/lib/data/travel-memory";

export async function confirmMemorySignal(id: string): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Accounts aren't connected yet." };
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." };
  await updateSignalConfirmation(id, user.id, "CONFIRMED");
  return {};
}

export async function rejectMemorySignal(id: string): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Accounts aren't connected yet." };
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." };
  const rejectedUntil = new Date(Date.now() + REJECTION_COOLDOWN_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await updateSignalConfirmation(id, user.id, "REJECTED", rejectedUntil);
  return {};
}

export async function resetLearnedMemory(): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Accounts aren't connected yet." };
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." };
  await deleteLearnedSignals(user.id);
  return {};
}

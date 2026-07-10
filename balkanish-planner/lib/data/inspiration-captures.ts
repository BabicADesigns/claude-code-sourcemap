import "server-only";

import type { InspirationCapture, InspirationCapturePatch, CaptureResolutionStatus } from "@/lib/types";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function getInspirationCaptures(userId: string): Promise<InspirationCapture[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("inspiration_captures")
    .select("*")
    .eq("user_id", userId)
    .neq("resolution_status", "DISMISSED")
    .order("captured_at", { ascending: false });
  if (error || !data) return [];
  return data as InspirationCapture[];
}

export async function getInspirationCaptureById(
  userId: string,
  id: string,
): Promise<InspirationCapture | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("inspiration_captures")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as InspirationCapture;
}

export async function createInspirationCapture(
  userId: string,
  capture: Omit<InspirationCapture, "id" | "user_id" | "created_at" | "updated_at">,
): Promise<InspirationCapture | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("inspiration_captures")
    .insert({ ...capture, user_id: userId })
    .select()
    .single();
  if (error || !data) return null;
  return data as InspirationCapture;
}

export async function updateInspirationCapture(
  userId: string,
  id: string,
  patch: InspirationCapturePatch,
): Promise<InspirationCapture | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("inspiration_captures")
    .update(patch)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();
  if (error || !data) return null;
  return data as InspirationCapture;
}

export async function confirmInspirationCapture(
  userId: string,
  id: string,
  patch: InspirationCapturePatch,
): Promise<InspirationCapture | null> {
  return updateInspirationCapture(userId, id, {
    ...patch,
    resolution_status: "USER_CONFIRMED",
  });
}

export async function correctInspirationCapture(
  userId: string,
  id: string,
  patch: InspirationCapturePatch,
): Promise<InspirationCapture | null> {
  return updateInspirationCapture(userId, id, {
    ...patch,
    resolution_status: "USER_CORRECTED",
  });
}

export async function dismissInspirationCapture(
  userId: string,
  id: string,
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("inspiration_captures")
    .update({
      resolution_status: "DISMISSED" as CaptureResolutionStatus,
      dismissed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId);
  return !error;
}

export async function deleteInspirationCapture(
  userId: string,
  id: string,
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("inspiration_captures")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  return !error;
}

/**
 * Trip matching boundary — returns captures that could match a set of destination slugs.
 * Compares country_code and place_name against the provided destination context.
 * No live GPS or external geocoding — pure data layer query.
 * This is the insertion point for future trip-matching activation.
 */
export async function getFindsNearDestinations(
  userId: string,
  countryCodes: string[],
): Promise<InspirationCapture[]> {
  if (!isSupabaseConfigured() || countryCodes.length === 0) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("inspiration_captures")
    .select("*")
    .eq("user_id", userId)
    .in("country_code", countryCodes)
    .neq("resolution_status", "DISMISSED")
    .order("resolution_confidence", { ascending: false });
  if (error || !data) return [];
  return data as InspirationCapture[];
}

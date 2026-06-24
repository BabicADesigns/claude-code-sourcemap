"use server";

import { revalidatePath } from "next/cache";
import type { GeneratedItinerary, PlannerInput } from "@/lib/ai/itinerary";
import { PLANNER_STYLE_TO_TRAVEL_STYLE } from "@/lib/types";
import { createSupabaseServerClient, getCurrentUser, isSupabaseConfigured } from "@/lib/supabase/server";

export async function saveItinerary(
  itinerary: GeneratedItinerary,
  input: PlannerInput
): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Accounts aren't connected yet." };

  const user = await getCurrentUser();
  if (!user) return { error: "Sign in to save this itinerary." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("generated_itineraries").insert({
    user_id: user.id,
    duration_days: input.durationDays,
    month: input.month,
    budget: input.budget,
    // travel_style is a Postgres enum that still only knows the 6 legacy values, so the wizard's
    // 8-value plannerStyle is mapped down at the point of writing — see PLANNER_STYLE_TO_TRAVEL_STYLE.
    travel_style: PLANNER_STYLE_TO_TRAVEL_STYLE[input.plannerStyle],
    interests: input.interests,
    itinerary_json: itinerary,
  });
  if (error) return { error: "Couldn't save that itinerary. Please try again." };

  revalidatePath("/my-balkans");
  revalidatePath("/my-trips");
  return {};
}

export async function deleteItinerary(id: string): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Accounts aren't connected yet." };

  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("generated_itineraries").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { error: "Couldn't delete that itinerary." };

  revalidatePath("/my-balkans");
  revalidatePath("/my-trips");
  return {};
}

export async function renameItinerary(id: string, title: string): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Accounts aren't connected yet." };

  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." };

  const trimmed = title.trim();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("generated_itineraries")
    .update({ title: trimmed || null })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: "Couldn't rename that trip." };

  revalidatePath("/my-balkans");
  revalidatePath("/my-trips");
  return {};
}

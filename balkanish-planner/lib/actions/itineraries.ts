"use server";

import { revalidatePath } from "next/cache";
import type { GeneratedItinerary, PlannerInput } from "@/lib/ai/itinerary";
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
    travel_style: input.travelStyle,
    interests: input.interests,
    itinerary_json: itinerary,
  });
  if (error) return { error: "Couldn't save that itinerary. Please try again." };

  revalidatePath("/my-balkans");
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
  return {};
}

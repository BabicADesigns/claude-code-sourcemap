import type { SavedItinerary } from "@/lib/types";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function getSavedItineraries(userId: string): Promise<SavedItinerary[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("generated_itineraries")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as SavedItinerary[];
}

/** Single saved itinerary, scoped to its owner — used by the PDF delivery actions to fetch the source to render. */
export async function getSavedItineraryById(userId: string, id: string): Promise<SavedItinerary | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("generated_itineraries")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as SavedItinerary;
}

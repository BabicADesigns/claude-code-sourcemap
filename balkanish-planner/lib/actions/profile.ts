"use server";

import { revalidatePath } from "next/cache";
import type { TravelStyle, TripPace, TravelerInterest, MobilityOption, CuisinePreference } from "@/lib/types";
import { isLocale } from "@/lib/i18n/config";
import { createSupabaseServerClient, getCurrentUser, isSupabaseConfigured } from "@/lib/supabase/server";
import { logError } from "@/lib/monitoring/logger";

const VALID_PACES: TripPace[] = ["relaxed", "balanced", "active"];
const VALID_BUDGETS = ["budget", "mid_range", "premium", "luxury"] as const;

function parseJsonArray<T extends string>(raw: string): T[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export async function updateProfile(formData: FormData): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Accounts aren't connected yet." };

  const user = await getCurrentUser();
  if (!user) return { error: "You need to sign in first." };

  const displayName = String(formData.get("displayName") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  const travelStyle = String(formData.get("travelStyle") ?? "") as TravelStyle | "";
  const favoriteRegion = String(formData.get("favoriteRegion") ?? "").trim();
  const preferredLanguage = String(formData.get("preferredLanguage") ?? "");

  // Phase 17 personalization fields
  const rawPace = String(formData.get("travel_pace") ?? "").trim();
  const travelPace: TripPace | null = (VALID_PACES as string[]).includes(rawPace) ? (rawPace as TripPace) : null;
  const rawBudget = String(formData.get("budget_preference") ?? "").trim();
  const budgetPreference = (VALID_BUDGETS as readonly string[]).includes(rawBudget) ? rawBudget : null;
  const interests = parseJsonArray<TravelerInterest>(String(formData.get("interests") ?? "[]"));
  const mobility = parseJsonArray<MobilityOption>(String(formData.get("mobility") ?? "[]"));
  const cuisinePreferences = parseJsonArray<CuisinePreference>(String(formData.get("cuisine_preferences") ?? "[]"));

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName || null,
      country: country || null,
      travel_style: travelStyle || null,
      favorite_region: favoriteRegion || null,
      ...(isLocale(preferredLanguage) ? { preferred_language: preferredLanguage } : {}),
      // Phase 17
      travel_pace: travelPace,
      budget_preference: budgetPreference,
      interests,
      mobility,
      cuisine_preferences: cuisinePreferences,
    })
    .eq("id", user.id);

  if (error) {
    logError("actions.profile.updateProfile", error, { userId: user.id });
    return { error: "Couldn't save your profile. Please try again." };
  }

  revalidatePath("/account");
  return {};
}

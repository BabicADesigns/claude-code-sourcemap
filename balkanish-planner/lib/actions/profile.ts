"use server";

import { revalidatePath } from "next/cache";
import type { TravelStyle } from "@/lib/types";
import { isLocale } from "@/lib/i18n/config";
import { createSupabaseServerClient, getCurrentUser, isSupabaseConfigured } from "@/lib/supabase/server";
import { logError } from "@/lib/monitoring/logger";

export async function updateProfile(formData: FormData): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Accounts aren't connected yet." };

  const user = await getCurrentUser();
  if (!user) return { error: "You need to sign in first." };

  const displayName = String(formData.get("displayName") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  const travelStyle = String(formData.get("travelStyle") ?? "") as TravelStyle | "";
  const favoriteRegion = String(formData.get("favoriteRegion") ?? "").trim();
  const preferredLanguage = String(formData.get("preferredLanguage") ?? "");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName || null,
      country: country || null,
      travel_style: travelStyle || null,
      favorite_region: favoriteRegion || null,
      ...(isLocale(preferredLanguage) ? { preferred_language: preferredLanguage } : {}),
    })
    .eq("id", user.id);

  if (error) {
    logError("actions.profile.updateProfile", error, { userId: user.id });
    return { error: "Couldn't save your profile. Please try again." };
  }

  revalidatePath("/account");
  return {};
}

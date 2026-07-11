"use server";

import { revalidatePath } from "next/cache";
import type { GeneratedItinerary, PlannerInput } from "@/lib/ai/itinerary";
import { PLANNER_STYLE_TO_TRAVEL_STYLE } from "@/lib/types";
import { createSupabaseServerClient, getCurrentUser, isSupabaseConfigured } from "@/lib/supabase/server";
import { incrementDiscoveredDestinationSaves } from "@/lib/data/discovered-destinations";
import { recordTravelMemorySignal } from "@/lib/data/travel-memory";
import { logError } from "@/lib/monitoring/logger";

const INTEREST_TO_DOMAIN: Record<string, string> = {
  "Hidden beaches & coves": "BEACHES",
  "Wine & gastronomy": "WINE",
  "History & old towns": "HISTORY",
  "Hiking & nature": "NATURE",
  "Island hopping": "ISLAND_HOPPING",
  "Local culture & traditions": "HISTORY",
  "Photography": "PHOTOGRAPHY",
  "Slow mornings & cafés": "COFFEE_CULTURE",
};

const MOOD_TO_DOMAIN: Record<string, string> = {
  slow_living: "SLOW_TRAVEL",
  romantic: "ROMANCE",
  adventure: "ADVENTURE",
  family_time: "FAMILY",
  digital_detox: "RURAL",
  road_trip: "ROAD_TRIPS",
  luxury_escape: "ACCOMMODATION",
  weekend_escape: "PACE",
};

const TRANSPORT_TO_DOMAIN: Record<string, string> = {
  rental_car: "TRANSPORT",
  public_transport: "TRANSPORT",
  ferry: "TRANSPORT",
  private_transfers: "TRANSPORT",
  cycling: "TRANSPORT",
  walking: "TRANSPORT",
};

export async function saveItinerary(
  itinerary: GeneratedItinerary,
  input: PlannerInput
): Promise<{ id?: string; error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Accounts aren't connected yet." };

  const user = await getCurrentUser();
  if (!user) return { error: "Sign in to save this itinerary." };

  const supabase = await createSupabaseServerClient();
  const { data: insertedRow, error } = await supabase
    .from("generated_itineraries")
    .insert({
      user_id: user.id,
      duration_days: input.durationDays,
      month: input.month,
      budget: input.budget,
      // travel_style is a Postgres enum that still only knows the 6 legacy values, so the wizard's
      // 8-value plannerStyle is mapped down at the point of writing — see PLANNER_STYLE_TO_TRAVEL_STYLE.
      travel_style: PLANNER_STYLE_TO_TRAVEL_STYLE[input.plannerStyle],
      interests: input.interests,
      itinerary_json: itinerary,
    })
    .select("id")
    .single();
  if (error) {
    logError("actions.itineraries.saveItinerary", error, { userId: user.id });
    return { error: "Couldn't save that itinerary. Please try again." };
  }

  const tripId = insertedRow?.id ?? null;

  // Extract memory signals from the saved itinerary — best-effort, non-blocking.
  // Each signal goes through the full allowlist + blocked-domain check in recordTravelMemorySignal.
  void (async () => {
    try {
      const signalBase = { userId: user.id, source: "ITINERARY_KEEP" as const, sourceTripId: tripId };
      const tasks: Promise<void>[] = [];
      for (const interest of input.interests) {
        const domain = INTEREST_TO_DOMAIN[interest];
        if (domain) tasks.push(recordTravelMemorySignal({ ...signalBase, domain: domain as never, subject: interest, direction: "POSITIVE" }));
      }
      if (input.travel_mood) {
        const domain = MOOD_TO_DOMAIN[input.travel_mood];
        if (domain) tasks.push(recordTravelMemorySignal({ ...signalBase, domain: domain as never, subject: input.travel_mood.replace(/_/g, " "), direction: "POSITIVE" }));
      }
      if (input.transport_preferences?.length) {
        for (const tp of input.transport_preferences) {
          const domain = TRANSPORT_TO_DOMAIN[tp];
          if (domain) tasks.push(recordTravelMemorySignal({ ...signalBase, domain: domain as never, subject: tp.replace(/_/g, " "), direction: "POSITIVE" }));
        }
      }
      await Promise.all(tasks);
    } catch {
      // Signal extraction is best-effort — errors must never surface to the user
    }
  })();

  // Future Learning Layer (requirement #8) — a saved trip is a strong usage signal for any AI-suggested
  // destinations it contains. Best-effort: incrementDiscoveredDestinationSaves never throws.
  await incrementDiscoveredDestinationSaves(itinerary.discovered_candidates ?? []);

  revalidatePath("/my-balkans");
  revalidatePath("/my-trips");
  return { id: tripId ?? undefined };
}

export async function deleteItinerary(id: string): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Accounts aren't connected yet." };

  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("generated_itineraries").delete().eq("id", id).eq("user_id", user.id);
  if (error) {
    logError("actions.itineraries.deleteItinerary", error, { userId: user.id, itineraryId: id });
    return { error: "Couldn't delete that itinerary." };
  }

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
  if (error) {
    logError("actions.itineraries.renameItinerary", error, { userId: user.id, itineraryId: id });
    return { error: "Couldn't rename that trip." };
  }

  revalidatePath("/my-balkans");
  revalidatePath("/my-trips");
  return {};
}

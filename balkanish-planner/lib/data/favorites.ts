import type { FavoriteEntityType } from "@/lib/types";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { logError } from "@/lib/monitoring/logger";

/** All entity ids of one type the given user has saved, for batch "is this saved" checks. */
export async function getSavedEntityIds(userId: string, entityType: FavoriteEntityType): Promise<Set<string>> {
  if (!isSupabaseConfigured()) return new Set();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("favorites")
    .select("entity_id")
    .eq("user_id", userId)
    .eq("entity_type", entityType);
  if (error || !data) {
    if (error) logError("data.favorites.getSavedEntityIds", error, { userId, entityType });
    return new Set();
  }
  return new Set(data.map((row) => row.entity_id as string));
}

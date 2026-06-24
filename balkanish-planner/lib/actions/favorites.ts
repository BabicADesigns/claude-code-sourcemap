"use server";

import { revalidatePath } from "next/cache";
import type { FavoriteEntityType } from "@/lib/types";
import { createSupabaseServerClient, getCurrentUser, isSupabaseConfigured } from "@/lib/supabase/server";

export async function toggleFavorite(
  entityType: FavoriteEntityType,
  entityId: string
): Promise<{ saved: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { saved: false, error: "Accounts aren't connected yet." };

  const user = await getCurrentUser();
  if (!user) return { saved: false, error: "Sign in to save this." };

  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("favorites").delete().eq("id", existing.id);
    if (error) return { saved: true, error: "Couldn't remove that. Please try again." };
    revalidatePath("/my-balkans");
    return { saved: false };
  }

  const { error } = await supabase
    .from("favorites")
    .insert({ user_id: user.id, entity_type: entityType, entity_id: entityId });
  if (error) return { saved: false, error: "Couldn't save that. Please try again." };

  revalidatePath("/my-balkans");
  return { saved: true };
}

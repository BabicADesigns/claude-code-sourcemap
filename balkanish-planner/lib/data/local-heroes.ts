import type { LocalHero } from "@/lib/types";
import { createSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { logError } from "@/lib/monitoring/logger";
import { mockLocalHeroes } from "@/lib/data/local-heroes-mock";

export async function getLocalHeroesForDestination(destinationSlug: string): Promise<LocalHero[]> {
  if (!isSupabaseAdminConfigured()) {
    return mockLocalHeroes.filter((h) => h.destination_slug === destinationSlug);
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("local_heroes")
    .select("*")
    .eq("destination_slug", destinationSlug)
    .order("created_at");
  if (error) {
    logError("data.localHeroes.getLocalHeroesForDestination", error, { destinationSlug });
    return mockLocalHeroes.filter((h) => h.destination_slug === destinationSlug);
  }
  return (data ?? []) as LocalHero[];
}

export async function getLocalHeroes(): Promise<LocalHero[]> {
  if (!isSupabaseAdminConfigured()) return mockLocalHeroes;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("local_heroes").select("*").order("created_at");
  if (error) {
    logError("data.localHeroes.getLocalHeroes", error);
    return mockLocalHeroes;
  }
  return (data ?? []) as LocalHero[];
}

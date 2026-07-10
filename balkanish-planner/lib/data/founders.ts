import type { Founder, FoundersPick } from "@/lib/types";
import { createSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { logError } from "@/lib/monitoring/logger";
import { mockFounders, mockFoundersPicks } from "@/lib/data/founders-mock";

export async function getFounders(): Promise<Founder[]> {
  if (!isSupabaseAdminConfigured()) return mockFounders;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("founders").select("*").order("created_at");
  if (error) {
    logError("data.founders.getFounders", error);
    return mockFounders;
  }
  return (data ?? []) as Founder[];
}

export async function getFounderBySlug(slug: string): Promise<Founder | null> {
  if (!isSupabaseAdminConfigured()) return mockFounders.find((f) => f.slug === slug) ?? null;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("founders").select("*").eq("slug", slug).maybeSingle();
  if (error) {
    logError("data.founders.getFounderBySlug", error, { slug });
    return mockFounders.find((f) => f.slug === slug) ?? null;
  }
  return (data as Founder | null) ?? null;
}

export async function getFoundersPicksForDestination(destinationSlug: string): Promise<FoundersPick[]> {
  if (!isSupabaseAdminConfigured()) {
    return mockFoundersPicks.filter((p) => p.destination_slug === destinationSlug);
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("founders_picks")
    .select("*, founder:founders(*)")
    .eq("destination_slug", destinationSlug)
    .order("created_at");
  if (error) {
    logError("data.founders.getFoundersPicksForDestination", error, { destinationSlug });
    return mockFoundersPicks.filter((p) => p.destination_slug === destinationSlug);
  }
  return (data ?? []) as FoundersPick[];
}

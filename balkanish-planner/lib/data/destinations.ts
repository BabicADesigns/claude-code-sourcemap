import type { Destination } from "@/lib/types";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { mockDestinations } from "@/lib/data/destinations-mock";
import { normalizeDestination } from "@/lib/media/normalize";
import { logError } from "@/lib/monitoring/logger";

export { mockDestinations };

export async function getDestinations(): Promise<Destination[]> {
  if (!isSupabaseConfigured()) return mockDestinations.map(normalizeDestination);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("destinations")
    .select("*")
    .order("is_featured", { ascending: false });
  if (error || !data) {
    if (error) logError("data.destinations.getDestinations", error);
    return mockDestinations.map(normalizeDestination);
  }
  return (data as Destination[]).map(normalizeDestination);
}

export async function getDestinationBySlug(slug: string): Promise<Destination | undefined> {
  if (!isSupabaseConfigured()) {
    const destination = mockDestinations.find((d) => d.slug === slug);
    return destination && normalizeDestination(destination);
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("destinations")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) {
    if (error) logError("data.destinations.getDestinationBySlug", error, { slug });
    const destination = mockDestinations.find((d) => d.slug === slug);
    return destination && normalizeDestination(destination);
  }
  return normalizeDestination(data as Destination);
}

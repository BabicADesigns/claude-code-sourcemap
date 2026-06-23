import type { Destination } from "@/lib/types";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { mockDestinations } from "@/lib/data/destinations-mock";

export { mockDestinations };

export async function getDestinations(): Promise<Destination[]> {
  if (!isSupabaseConfigured()) return mockDestinations;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("destinations")
    .select("*")
    .order("is_featured", { ascending: false });
  if (error || !data) return mockDestinations;
  return data as Destination[];
}

export async function getDestinationBySlug(slug: string): Promise<Destination | undefined> {
  if (!isSupabaseConfigured()) {
    return mockDestinations.find((d) => d.slug === slug);
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("destinations")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return mockDestinations.find((d) => d.slug === slug);
  return data as Destination;
}

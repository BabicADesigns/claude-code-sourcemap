import type { LocalPartner } from "@/lib/types";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { mockPartners } from "@/lib/data/partners-mock";
import { logError } from "@/lib/monitoring/logger";

export { mockPartners };

/** Returns all active, non-demo local partners. Falls back to mock data when Supabase is unconfigured. */
export async function getPartners(): Promise<LocalPartner[]> {
  if (!isSupabaseConfigured()) {
    return mockPartners.filter((p) => p.active && !p.demo_only);
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("local_partners")
    .select("*")
    .eq("active", true)
    .eq("demo_only", false)
    .order("priority", { ascending: false });
  if (error || !data) {
    if (error) logError("data.partners.getPartners", error);
    return mockPartners.filter((p) => p.active && !p.demo_only);
  }
  return data as LocalPartner[];
}

/** Returns ALL partners including inactive and demo entries — for admin use only. */
export async function getAllPartnersForAdmin(): Promise<LocalPartner[]> {
  if (!isSupabaseConfigured()) return mockPartners;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("local_partners")
    .select("*")
    .order("priority", { ascending: false });
  if (error || !data) {
    if (error) logError("data.partners.getAllPartnersForAdmin", error);
    return mockPartners;
  }
  return data as LocalPartner[];
}

export async function getPartnerBySlug(slug: string): Promise<LocalPartner | undefined> {
  if (!isSupabaseConfigured()) {
    return mockPartners.find((p) => p.slug === slug);
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("local_partners")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) {
    if (error) logError("data.partners.getPartnerBySlug", error, { slug });
    return mockPartners.find((p) => p.slug === slug);
  }
  return data as LocalPartner;
}

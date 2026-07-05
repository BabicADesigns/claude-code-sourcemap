import type { CulturalInsight } from "@/lib/types";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { mockCulturalInsights } from "@/lib/data/cultural-insights-mock";
import { logError } from "@/lib/monitoring/logger";

/** Returns all active, non-demo cultural insights. Falls back to empty array when Supabase is unconfigured. */
export async function getCulturalInsights(): Promise<CulturalInsight[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("cultural_insights")
    .select("*")
    .eq("active", true)
    .eq("demo_only", false);
  if (error || !data) {
    if (error) logError("data.culturalInsights.getCulturalInsights", error);
    return [];
  }
  return data as CulturalInsight[];
}

/** Returns insights for a specific scope slug (destination / region / country). */
export async function getCulturalInsightsBySlug(
  scopeSlug: string
): Promise<CulturalInsight[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("cultural_insights")
    .select("*")
    .eq("scope_slug", scopeSlug)
    .eq("active", true)
    .eq("demo_only", false);
  if (error || !data) {
    if (error) logError("data.culturalInsights.getCulturalInsightsBySlug", error);
    return [];
  }
  return data as CulturalInsight[];
}

/** Returns ALL cultural insights including inactive and demo — for admin use only. */
export async function getAllCulturalInsightsForAdmin(): Promise<CulturalInsight[]> {
  if (!isSupabaseConfigured()) return mockCulturalInsights;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("cultural_insights")
    .select("*")
    .order("scope_slug");
  if (error || !data) {
    if (error) logError("data.culturalInsights.getAllCulturalInsightsForAdmin", error);
    return mockCulturalInsights;
  }
  return data as CulturalInsight[];
}

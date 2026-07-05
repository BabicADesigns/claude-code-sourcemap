import type { LocalPhrase } from "@/lib/types";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { mockLocalPhrases } from "@/lib/data/local-phrases-mock";
import { logError } from "@/lib/monitoring/logger";

/** Returns all active, non-demo local phrases. Falls back to empty array when Supabase is unconfigured. */
export async function getLocalPhrases(): Promise<LocalPhrase[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("local_phrases")
    .select("*")
    .eq("active", true)
    .eq("demo_only", false);
  if (error || !data) {
    if (error) logError("data.localPhrases.getLocalPhrases", error);
    return [];
  }
  return data as LocalPhrase[];
}

/** Returns phrases applicable to a given country code. */
export async function getLocalPhrasesByCountry(
  countryCode: string
): Promise<LocalPhrase[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("local_phrases")
    .select("*")
    .contains("applicable_country_codes", [countryCode])
    .eq("active", true)
    .eq("demo_only", false);
  if (error || !data) {
    if (error) logError("data.localPhrases.getLocalPhrasesByCountry", error);
    return [];
  }
  return data as LocalPhrase[];
}

/** Returns ALL local phrases including inactive and demo — for admin use only. */
export async function getAllLocalPhrasesForAdmin(): Promise<LocalPhrase[]> {
  if (!isSupabaseConfigured()) return mockLocalPhrases;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("local_phrases")
    .select("*")
    .order("language_code");
  if (error || !data) {
    if (error) logError("data.localPhrases.getAllLocalPhrasesForAdmin", error);
    return mockLocalPhrases;
  }
  return data as LocalPhrase[];
}

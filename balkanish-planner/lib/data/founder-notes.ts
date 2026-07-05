import type { FounderNote } from "@/lib/types";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { mockFounderNotes } from "@/lib/data/founder-notes-mock";
import { logError } from "@/lib/monitoring/logger";

/** Returns all active, non-demo founder notes. Falls back to empty array when Supabase is unconfigured. */
export async function getFounderNotes(): Promise<FounderNote[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("founder_notes")
    .select("*")
    .eq("active", true)
    .eq("demo_only", false);
  if (error || !data) {
    if (error) logError("data.founderNotes.getFounderNotes", error);
    return [];
  }
  return data as FounderNote[];
}

/** Returns a founder note for a specific scope slug, with fallback to GENERAL scope. */
export async function getFounderNoteBySlug(
  scopeSlug: string
): Promise<FounderNote | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("founder_notes")
    .select("*")
    .eq("scope_slug", scopeSlug)
    .eq("active", true)
    .eq("demo_only", false)
    .limit(1)
    .maybeSingle();
  if (error) {
    logError("data.founderNotes.getFounderNoteBySlug", error);
    return null;
  }
  return (data as FounderNote | null) ?? null;
}

/** Returns ALL founder notes including inactive and demo — for admin use only. */
export async function getAllFounderNotesForAdmin(): Promise<FounderNote[]> {
  if (!isSupabaseConfigured()) return mockFounderNotes;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("founder_notes")
    .select("*")
    .order("scope");
  if (error || !data) {
    if (error) logError("data.founderNotes.getAllFounderNotesForAdmin", error);
    return mockFounderNotes;
  }
  return data as FounderNote[];
}

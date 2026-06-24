import type { CultureNote } from "@/lib/types";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { mockCultureNotes } from "@/lib/data/culture-notes-mock";
import { normalizeCultureNote } from "@/lib/media/normalize";

export { mockCultureNotes };

export async function getCultureNotes(): Promise<CultureNote[]> {
  if (!isSupabaseConfigured()) return mockCultureNotes.map(normalizeCultureNote);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("culture_notes")
    .select("*")
    .order("is_featured", { ascending: false });
  if (error || !data) return mockCultureNotes.map(normalizeCultureNote);
  return (data as CultureNote[]).map(normalizeCultureNote);
}

export async function getCultureNoteBySlug(slug: string): Promise<CultureNote | undefined> {
  if (!isSupabaseConfigured()) {
    const note = mockCultureNotes.find((c) => c.slug === slug);
    return note && normalizeCultureNote(note);
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("culture_notes").select("*").eq("slug", slug).maybeSingle();
  if (error || !data) {
    const note = mockCultureNotes.find((c) => c.slug === slug);
    return note && normalizeCultureNote(note);
  }
  return normalizeCultureNote(data as CultureNote);
}

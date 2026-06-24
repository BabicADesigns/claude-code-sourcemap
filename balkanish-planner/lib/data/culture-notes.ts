import type { CultureNote } from "@/lib/types";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { mockCultureNotes } from "@/lib/data/culture-notes-mock";

export { mockCultureNotes };

export async function getCultureNotes(): Promise<CultureNote[]> {
  if (!isSupabaseConfigured()) return mockCultureNotes;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("culture_notes")
    .select("*")
    .order("is_featured", { ascending: false });
  if (error || !data) return mockCultureNotes;
  return data as CultureNote[];
}

export async function getCultureNoteBySlug(slug: string): Promise<CultureNote | undefined> {
  if (!isSupabaseConfigured()) return mockCultureNotes.find((c) => c.slug === slug);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("culture_notes").select("*").eq("slug", slug).maybeSingle();
  if (error || !data) return mockCultureNotes.find((c) => c.slug === slug);
  return data as CultureNote;
}

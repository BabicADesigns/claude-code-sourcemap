import type { BalkanishStory, StoryCategory } from "@/lib/types";
import { createSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { logError } from "@/lib/monitoring/logger";
import { mockStories } from "@/lib/data/stories-mock";

export async function getStories(category?: StoryCategory): Promise<BalkanishStory[]> {
  if (!isSupabaseAdminConfigured()) {
    return category ? mockStories.filter((s) => s.category === category) : mockStories;
  }

  const supabase = createSupabaseAdminClient();
  let query = supabase.from("balkanish_stories").select("*").order("published_at", { ascending: false });
  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error) {
    logError("data.stories.getStories", error, { category });
    return category ? mockStories.filter((s) => s.category === category) : mockStories;
  }
  return (data ?? []) as BalkanishStory[];
}

export async function getStoryBySlug(slug: string): Promise<BalkanishStory | null> {
  if (!isSupabaseAdminConfigured()) return mockStories.find((s) => s.slug === slug) ?? null;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("balkanish_stories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    logError("data.stories.getStoryBySlug", error, { slug });
    return mockStories.find((s) => s.slug === slug) ?? null;
  }
  return (data as BalkanishStory | null) ?? null;
}

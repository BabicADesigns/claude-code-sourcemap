import type { FoodFind } from "@/lib/types";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { mockFoodFinds } from "@/lib/data/food-finds-mock";

export { mockFoodFinds };

export async function getFoodFinds(): Promise<FoodFind[]> {
  if (!isSupabaseConfigured()) return mockFoodFinds;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("food_finds").select("*").order("is_featured", { ascending: false });
  if (error || !data) return mockFoodFinds;
  return data as FoodFind[];
}

export async function getFoodFindBySlug(slug: string): Promise<FoodFind | undefined> {
  if (!isSupabaseConfigured()) return mockFoodFinds.find((f) => f.slug === slug);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("food_finds").select("*").eq("slug", slug).maybeSingle();
  if (error || !data) return mockFoodFinds.find((f) => f.slug === slug);
  return data as FoodFind;
}

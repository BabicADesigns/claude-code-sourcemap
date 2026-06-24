import type { FoodFind } from "@/lib/types";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { mockFoodFinds } from "@/lib/data/food-finds-mock";
import { normalizeFoodFind } from "@/lib/media/normalize";

export { mockFoodFinds };

export async function getFoodFinds(): Promise<FoodFind[]> {
  if (!isSupabaseConfigured()) return mockFoodFinds.map(normalizeFoodFind);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("food_finds").select("*").order("is_featured", { ascending: false });
  if (error || !data) return mockFoodFinds.map(normalizeFoodFind);
  return (data as FoodFind[]).map(normalizeFoodFind);
}

export async function getFoodFindBySlug(slug: string): Promise<FoodFind | undefined> {
  if (!isSupabaseConfigured()) {
    const food = mockFoodFinds.find((f) => f.slug === slug);
    return food && normalizeFoodFind(food);
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("food_finds").select("*").eq("slug", slug).maybeSingle();
  if (error || !data) {
    const food = mockFoodFinds.find((f) => f.slug === slug);
    return food && normalizeFoodFind(food);
  }
  return normalizeFoodFind(data as FoodFind);
}

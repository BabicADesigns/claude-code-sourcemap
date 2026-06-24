"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, getCurrentUser, isSupabaseConfigured } from "@/lib/supabase/server";

export async function savePostcard(input: {
  destination_name: string;
  mood: string;
  quote: string;
}): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Accounts aren't connected yet." };

  const user = await getCurrentUser();
  if (!user) return { error: "Sign in to save this postcard." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("postcards").insert({
    user_id: user.id,
    destination_name: input.destination_name,
    mood: input.mood,
    quote: input.quote,
  });
  if (error) return { error: "Couldn't save that postcard. Please try again." };

  revalidatePath("/my-balkans");
  return {};
}

export async function deletePostcard(id: string): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Accounts aren't connected yet." };

  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("postcards").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { error: "Couldn't delete that postcard." };

  revalidatePath("/my-balkans");
  return {};
}

"use server";

import { createSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { getCurrentUser, isSupabaseConfigured } from "@/lib/supabase/server";
import { logError } from "@/lib/monitoring/logger";

export async function subscribeToNewsletter(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const email = String(formData.get("email") ?? "").trim();
  const sourcePage = String(formData.get("sourcePage") ?? "");

  if (!email || !email.includes("@")) return { error: "Enter a valid email address." };
  if (!isSupabaseConfigured() || !isSupabaseAdminConfigured()) {
    return { error: "The newsletter isn't connected yet — check back soon." };
  }

  const user = await getCurrentUser();
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("newsletter_subscribers")
    .upsert({ email, source_page: sourcePage || null, user_id: user?.id ?? null }, { onConflict: "email" });

  if (error) {
    logError("actions.newsletter.subscribeToNewsletter", error, { sourcePage });
    return { error: "Couldn't subscribe right now. Please try again." };
  }
  return { success: true };
}

import { createClient } from "@supabase/supabase-js";

export function isSupabaseAdminConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** Server-only client using the service role key. Never import this from client components. */
export function createSupabaseAdminClient() {
  if (!isSupabaseAdminConfigured()) {
    throw new Error("Supabase admin client is not configured — set SUPABASE_SERVICE_ROLE_KEY.");
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}

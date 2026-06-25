import { NextResponse } from "next/server";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { logError } from "@/lib/monitoring/logger";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code && isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      logError("auth.callback.exchangeCodeForSession", error);
      return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_failed`);
    }
  }

  return NextResponse.redirect(`${origin}/`);
}

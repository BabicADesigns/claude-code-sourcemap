/**
 * Synchronous environment-shape validation — no network calls. Used by
 * instrumentation.ts at server boot and available to any code that wants a
 * snapshot of what's configured without awaiting a live Supabase ping.
 * See docs/production-readiness.md "Environment Validation".
 */

export type SupabaseEnvStatus = "not_configured" | "misconfigured" | "configured";

export interface SupabaseEnvReport {
  status: SupabaseEnvStatus;
  /** Whether SUPABASE_SERVICE_ROLE_KEY is set — admin-only features (e.g. the planner route's anonymous itinerary log) degrade gracefully without it. */
  adminConfigured: boolean;
  issues: string[];
}

export interface EnvironmentReport {
  supabase: SupabaseEnvReport;
  openai: { configured: boolean };
  plausible: { configured: boolean };
  email: { configured: boolean };
  siteUrl: { configured: boolean; value: string };
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Three states, not two: a blank `.env.local` (not_configured, the expected
 * state for local prototyping) is a different problem from a URL with a typo
 * or a half-filled-in credential set (misconfigured) — the former needs no
 * action, the latter is a bug that would otherwise fail silently.
 */
export function checkSupabaseEnv(): SupabaseEnvReport {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminConfigured = Boolean(serviceRoleKey);

  if (!url && !anonKey) {
    return { status: "not_configured", adminConfigured, issues: [] };
  }

  const issues: string[] = [];
  if (!url) issues.push("NEXT_PUBLIC_SUPABASE_URL is missing.");
  else if (!isValidHttpUrl(url)) issues.push("NEXT_PUBLIC_SUPABASE_URL is not a valid URL.");
  if (!anonKey) issues.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.");

  return { status: issues.length > 0 ? "misconfigured" : "configured", adminConfigured, issues };
}

export function getEnvironmentReport(): EnvironmentReport {
  return {
    supabase: checkSupabaseEnv(),
    // Mirrors lib/ai/itinerary.ts's isOpenAIConfigured() — duplicated rather than
    // imported so this module stays a leaf with zero non-env-var dependencies.
    openai: { configured: Boolean(process.env.OPENAI_API_KEY) },
    plausible: { configured: Boolean(process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN) },
    // Mirrors lib/email/send.ts's isEmailConfigured() — duplicated rather than imported
    // for the same leaf-module reason as the openai/plausible checks above.
    email: { configured: Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM_ADDRESS) },
    siteUrl: {
      configured: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
      value: process.env.NEXT_PUBLIC_SITE_URL ?? "https://balkanish.babicadesigns.blog",
    },
  };
}

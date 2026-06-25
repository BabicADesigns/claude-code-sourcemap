import { getEnvironmentReport } from "@/lib/env";
import { logError, logEvent, logWarning } from "@/lib/monitoring/logger";

// Runs once when the server starts. Surfaces configuration problems immediately
// in the server logs instead of letting them fail silently on the first request
// that happens to touch Supabase or the AI planner. See docs/production-readiness.md
// "Environment Validation".
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const report = getEnvironmentReport();

  if (report.supabase.status === "not_configured") {
    logWarning("instrumentation.startup", "Supabase is not configured — running in prototype/mock-data mode.");
  } else if (report.supabase.status === "misconfigured") {
    logError("instrumentation.startup", new Error("Supabase environment variables are misconfigured."), {
      issues: report.supabase.issues,
    });
  } else {
    logEvent("instrumentation.startup", "Supabase environment variables look valid — verifying connectivity…");
    await verifySupabaseReachable();
  }

  if (!report.supabase.adminConfigured && report.supabase.status !== "not_configured") {
    logWarning(
      "instrumentation.startup",
      "SUPABASE_SERVICE_ROLE_KEY is not set — admin-only features (anonymous itinerary logging) are disabled."
    );
  }

  if (!report.openai.configured) {
    logWarning(
      "instrumentation.startup",
      "OPENAI_API_KEY is not set — the AI planner will use deterministic fallback itineraries."
    );
  }
}

async function verifySupabaseReachable(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return;

  try {
    const response = await fetch(`${url}/auth/v1/health`, { signal: AbortSignal.timeout(5000) });
    if (response.ok) {
      logEvent("instrumentation.startup", "Supabase is reachable.");
    } else {
      logWarning("instrumentation.startup", `Supabase health check returned HTTP ${response.status}.`);
    }
  } catch (error) {
    logError("instrumentation.startup", error);
  }
}

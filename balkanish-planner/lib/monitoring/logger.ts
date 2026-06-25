/**
 * Console-based today; this is the seam a future error-tracking/analytics
 * service (Sentry, PostHog, etc.) would plug into — every call site that
 * currently has a Supabase/auth/storage error to report goes through here
 * instead of a bare console.error, so swapping the backend later is a
 * one-file change. See docs/production-readiness.md "Monitoring Readiness".
 */

export type LogContext = Record<string, unknown>;

function serializeError(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) return { message: error.message, stack: error.stack };
  return { message: String(error) };
}

/** `scope` identifies the subsystem, e.g. "data.destinations", "actions.profile", "auth.callback". */
export function logError(scope: string, error: unknown, context?: LogContext): void {
  const { message, stack } = serializeError(error);
  console.error(`[${scope}]`, message, { stack, ...context });
}

export function logWarning(scope: string, message: string, context?: LogContext): void {
  console.warn(`[${scope}] ${message}`, context ?? {});
}

export function logEvent(scope: string, event: string, context?: LogContext): void {
  console.log(`[${scope}] ${event}`, context ?? {});
}

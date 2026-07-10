/**
 * Minimal editor allow-list — no admin/role system exists anywhere else in this codebase. Gates
 * the moderation/promotion actions (lib/actions/discovered-destinations.ts) and the moderation
 * page (app/admin/discoveries) the same way isSupabaseConfigured()/isEmailConfigured() gate other
 * optional features: a blank env var means the feature is simply unavailable, not broken.
 */
export function isEditorEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowList = (process.env.EDITOR_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  return allowList.includes(email.toLowerCase());
}

import type { ResurfacingHistoryEntry, ResurfacingAction, ResurfacingPolicyConfig } from "@/lib/types";

/**
 * Fatigue control — decides whether a find should be suppressed.
 *
 * Suppression rules (checked in order):
 *   1. permanently_dismissed = true → suppress forever (DISMISS action)
 *   2. suppressed_until is set and in the future → suppress until that date
 *   3. Otherwise: surface
 */
export function isSuppressed(
  entry: ResurfacingHistoryEntry | undefined,
  nowIso: string
): boolean {
  if (!entry) return false;
  if (entry.permanently_dismissed) return true;
  if (entry.suppressed_until && entry.suppressed_until > nowIso) return true;
  return false;
}

/**
 * Computes a suppressed_until ISO string for REMIND_ME_LATER and VIEW_FIND actions.
 * Returns null for actions that don't apply a cooldown.
 */
export function computeSuppressedUntil(
  action: ResurfacingAction,
  nowIso: string,
  policy: ResurfacingPolicyConfig
): string | null {
  const now = new Date(nowIso);
  if (action === "REMIND_ME_LATER") {
    now.setDate(now.getDate() + policy.cooldownAfterRemindLaterDays);
    return now.toISOString();
  }
  if (action === "VIEW_FIND") {
    now.setDate(now.getDate() + policy.cooldownAfterViewDays);
    return now.toISOString();
  }
  return null;
}

/** True when the action results in permanent dismissal. */
export function isPermanentDismissal(action: ResurfacingAction): boolean {
  return action === "DISMISS" || action === "NOT_THIS_TRIP";
}

/**
 * Finds the most recent history entry for a given capture+trip combination.
 * The same (capture_id, trip_id) pair may have multiple entries over time.
 */
export function findLatestEntry(
  history: ResurfacingHistoryEntry[],
  captureId: string,
  tripId: string
): ResurfacingHistoryEntry | undefined {
  return history
    .filter((h) => h.capture_id === captureId && h.trip_id === tripId)
    .sort((a, b) => b.resurfaced_at.localeCompare(a.resurfaced_at))[0];
}

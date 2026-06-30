"use server";

import type { EngagementSignalType, EngagementEntityType } from "@/lib/types";
import { createSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { getCurrentUser, isSupabaseConfigured } from "@/lib/supabase/server";
import { logError } from "@/lib/monitoring/logger";

/**
 * Records a single engagement signal. Never throws — ranking signals are best-effort; a failure
 * here must never block the calling page from rendering. user_id is filled in when a session
 * exists, left null for anonymous signals (both are valid).
 *
 * Signals are stored for future ranking use (Phase 16 requirement #7) but are NOT read back to
 * end users in this phase — no public scores, no public rankings.
 */
export async function recordEngagementSignal(
  entityType: EngagementEntityType,
  entityId: string,
  signalType: EngagementSignalType
): Promise<void> {
  if (!isSupabaseConfigured() || !isSupabaseAdminConfigured()) return;

  try {
    const user = await getCurrentUser();
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("engagement_signals").insert({
      entity_type: entityType,
      entity_id: entityId,
      signal_type: signalType,
      user_id: user?.id ?? null,
    });
    if (error) logError("actions.engagement.record", error, { entityType, entityId, signalType });
  } catch (err) {
    logError("actions.engagement.record.unexpected", err, { entityType, entityId, signalType });
  }
}

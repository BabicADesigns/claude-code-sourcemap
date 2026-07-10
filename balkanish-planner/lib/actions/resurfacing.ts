"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  recordResurfacingEvent,
  recordResurfacingAction,
} from "@/lib/data/resurfacing-history";
import { computeSuppressedUntil, isPermanentDismissal } from "@/lib/resurfacing/fatigue";
import { DEFAULT_RESURFACING_POLICY } from "@/lib/resurfacing/policy";
import type {
  ResurfacingWindow,
  ResurfacingReason,
  MatchConfidence,
  ResurfacingAction,
} from "@/lib/types";

export type ResurfacingActionResult = { success: boolean; error?: string };

/** Called when resurfaced finds are shown to the user. Records the surfacing event. */
export async function trackResurfacing(
  captureId: string,
  tripId: string,
  window: ResurfacingWindow,
  reasons: ResurfacingReason[],
  confidence: MatchConfidence
): Promise<ResurfacingActionResult> {
  if (!isSupabaseConfigured()) return { success: false, error: "Service unavailable." };
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated." };
  const id = await recordResurfacingEvent(
    user.id,
    captureId,
    tripId,
    window,
    reasons,
    confidence
  );
  return id ? { success: true } : { success: false, error: "Could not record surfacing." };
}

/** Handles VIEW_FIND, REMIND_ME_LATER, NOT_THIS_TRIP, DISMISS actions. */
export async function recordAction(
  captureId: string,
  tripId: string,
  action: ResurfacingAction
): Promise<ResurfacingActionResult> {
  if (!isSupabaseConfigured()) return { success: false, error: "Service unavailable." };
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const suppressedUntil = computeSuppressedUntil(
    action,
    new Date().toISOString(),
    DEFAULT_RESURFACING_POLICY
  );
  const permanentlyDismissed = isPermanentDismissal(action);

  const ok = await recordResurfacingAction(
    user.id,
    captureId,
    tripId,
    action,
    suppressedUntil,
    permanentlyDismissed
  );
  if (!ok) return { success: false, error: "Could not record action." };
  revalidatePath(`/trips/${tripId}/today`);
  return { success: true };
}

import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/monitoring/logger";
import {
  ALLOWED_MEMORY_SIGNAL_SOURCES,
  BLOCKED_MEMORY_DOMAINS,
  type MemoryConfirmationStatus,
  type MemoryPreferenceDomain,
  type MemorySignalDirection,
  type MemorySignalSource,
  type MemoryTripContext,
  type TravelMemorySignal,
} from "@/lib/types";
import { computeSignalStrength, computeSignalConfidence } from "@/lib/ai/travel-memory";

export const REJECTION_COOLDOWN_DAYS = 90;

/** Returns all active, non-rejected signals for a user (excludes expired rejections automatically). */
export async function getActiveMemorySignals(userId: string): Promise<TravelMemorySignal[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("travel_memory_signals")
    .select("*")
    .eq("user_id", userId)
    .eq("active", true)
    .order("strength", { ascending: false });

  if (error) {
    logError("data.travel-memory.getActiveMemorySignals", error, { userId });
    return [];
  }
  return (data ?? []) as TravelMemorySignal[];
}

interface RecordSignalInput {
  userId: string;
  source: MemorySignalSource;
  domain: MemoryPreferenceDomain;
  subject: string;
  value?: string | null;
  direction?: MemorySignalDirection;
  tripContext?: MemoryTripContext | null;
  sourceTripId?: string | null;
}

/**
 * Upserts a travel memory signal.
 * - Rejects signals for blocked domains (hard privacy guardrail).
 * - Rejects signals from sources outside the allowed list.
 * - If the (user, domain, subject, direction) row already exists, increments
 *   occurrence_count and recomputes strength/confidence. Never creates duplicates.
 * - If an active rejection cooldown exists for this (user, domain, subject), skips silently.
 * - If a prior rejection has expired, clears it and starts fresh.
 */
export async function recordTravelMemorySignal(input: RecordSignalInput): Promise<void> {
  const { userId, source, domain, subject, value, direction = "POSITIVE", tripContext, sourceTripId } = input;

  if (BLOCKED_MEMORY_DOMAINS.has(domain)) return;
  if (!ALLOWED_MEMORY_SIGNAL_SOURCES.has(source)) return;

  const supabase = createSupabaseAdminClient();

  // Check for active rejection cooldown
  const { data: existing } = await supabase
    .from("travel_memory_signals")
    .select("id, occurrence_count, confirmation_status, rejected_until, source")
    .eq("user_id", userId)
    .eq("domain", domain)
    .eq("subject", subject)
    .eq("direction", direction)
    .maybeSingle();

  const now = new Date();

  if (existing) {
    // Active rejection cooldown — skip
    if (
      existing.confirmation_status === "REJECTED" &&
      existing.rejected_until &&
      new Date(existing.rejected_until) > now
    ) {
      return;
    }

    const newCount = existing.occurrence_count + 1;
    const newStrength = computeSignalStrength(source, newCount);
    const newConfidence = computeSignalConfidence(source, newCount, existing.confirmation_status as MemoryConfirmationStatus);

    const updatePayload: Record<string, unknown> = {
      occurrence_count: newCount,
      strength: newStrength,
      confidence: newConfidence,
      last_observed_at: now.toISOString(),
      source,
      active: true,
    };
    // Clear expired rejection
    if (existing.confirmation_status === "REJECTED") {
      updatePayload.confirmation_status = "UNCONFIRMED";
      updatePayload.rejected_until = null;
    }
    if (tripContext) updatePayload.trip_context = tripContext;
    if (sourceTripId) updatePayload.source_trip_id = sourceTripId;
    if (value !== undefined) updatePayload.value = value;

    const { error } = await supabase
      .from("travel_memory_signals")
      .update(updatePayload)
      .eq("id", existing.id);
    if (error) logError("data.travel-memory.recordTravelMemorySignal.update", error, { userId, domain, subject });
    return;
  }

  // New signal — insert
  const strength = computeSignalStrength(source, 1);
  const confidence = computeSignalConfidence(source, 1, "UNCONFIRMED");

  const { error } = await supabase.from("travel_memory_signals").insert({
    user_id: userId,
    source,
    domain,
    subject,
    value: value ?? null,
    direction,
    strength,
    confidence,
    occurrence_count: 1,
    trip_context: tripContext ?? null,
    source_trip_id: sourceTripId ?? null,
    confirmation_status: "UNCONFIRMED",
    active: true,
  });
  if (error) logError("data.travel-memory.recordTravelMemorySignal.insert", error, { userId, domain, subject });
}

export async function updateSignalConfirmation(
  id: string,
  userId: string,
  status: MemoryConfirmationStatus,
  rejectedUntil?: string | null
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const update: Record<string, unknown> = { confirmation_status: status };
  if (rejectedUntil !== undefined) update.rejected_until = rejectedUntil;

  const { error } = await supabase
    .from("travel_memory_signals")
    .update(update)
    .eq("id", id)
    .eq("user_id", userId);
  if (error) logError("data.travel-memory.updateSignalConfirmation", error, { id, userId, status });
}

/**
 * Soft-deletes all learned signals for a user.
 * Preserves CONFIRMED signals and PROFILE_CONFIRMATION source signals —
 * those represent explicit user intent and must not be wiped by a bulk reset.
 */
export async function deleteLearnedSignals(userId: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("travel_memory_signals")
    .update({ active: false })
    .eq("user_id", userId)
    .neq("confirmation_status", "CONFIRMED")
    .neq("source", "PROFILE_CONFIRMATION");
  if (error) logError("data.travel-memory.deleteLearnedSignals", error, { userId });
}

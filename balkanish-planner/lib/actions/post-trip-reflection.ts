"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  upsertTripReflection,
  upsertReflectionItem,
  recordLearningCandidateDecision,
  getTripReflection,
} from "@/lib/data/post-trip-reflection";
import { recordTravelMemorySignal } from "@/lib/data/travel-memory";
import type {
  OverallFeeling,
  PaceReflection,
  PlanningComfort,
  ReturnIntent,
  ItemReflection,
  TripLearningCandidate,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Reflection header
// ---------------------------------------------------------------------------

export async function saveReflectionOverallFeeling(
  tripId: string,
  overall_feeling: OverallFeeling
): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Accounts aren't connected yet." };
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." };

  await upsertTripReflection({
    userId: user.id,
    tripId,
    status: "IN_PROGRESS",
    overall_feeling,
  });
  revalidatePath(`/trips/${tripId}/reflection`);
  return {};
}

export async function saveReflectionPaceAndPlanning(
  tripId: string,
  pace_reflection: PaceReflection,
  planning_comfort: PlanningComfort
): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Accounts aren't connected yet." };
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." };

  await upsertTripReflection({
    userId: user.id,
    tripId,
    status: "IN_PROGRESS",
    pace_reflection,
    planning_comfort,
  });
  revalidatePath(`/trips/${tripId}/reflection`);
  return {};
}

export async function saveReflectionReturnIntent(
  tripId: string,
  return_intent: ReturnIntent,
  return_intent_destination?: string | null
): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Accounts aren't connected yet." };
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." };

  await upsertTripReflection({
    userId: user.id,
    tripId,
    status: "IN_PROGRESS",
    return_intent,
    return_intent_destination: return_intent_destination ?? null,
  });
  revalidatePath(`/trips/${tripId}/reflection`);
  return {};
}

export async function saveReflectionPrivateNote(
  tripId: string,
  private_note: string
): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Accounts aren't connected yet." };
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." };

  // private_note is stored server-side only; never logged, never sent to analytics
  await upsertTripReflection({ userId: user.id, tripId, status: "IN_PROGRESS", private_note });
  revalidatePath(`/trips/${tripId}/reflection`);
  return {};
}

export async function dismissReflection(tripId: string): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Accounts aren't connected yet." };
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." };

  // Dismissal is a valid choice — not a negative signal about the trip
  await upsertTripReflection({ userId: user.id, tripId, status: "DISMISSED" });
  revalidatePath(`/trips/${tripId}/reflection`);
  revalidatePath("/my-balkans");
  return {};
}

export async function completeReflection(tripId: string): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Accounts aren't connected yet." };
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." };

  await upsertTripReflection({
    userId: user.id,
    tripId,
    status: "COMPLETED",
    completed_at: new Date().toISOString(),
  });
  revalidatePath(`/trips/${tripId}/reflection`);
  revalidatePath("/my-balkans");
  return {};
}

// ---------------------------------------------------------------------------
// Item reflection
// ---------------------------------------------------------------------------

export async function saveReflectionItem(
  tripId: string,
  itemKey: string,
  value: ItemReflection
): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Accounts aren't connected yet." };
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." };

  await upsertReflectionItem(user.id, tripId, itemKey, value);
  return {};
}

// ---------------------------------------------------------------------------
// Learning candidate decisions + memory promotion
// ---------------------------------------------------------------------------

/**
 * Confirm a learning candidate: record the decision and promote the signal to
 * the travel memory system via the existing recordTravelMemorySignal pathway.
 * The signal source is always POST_TRIP_REFLECTION; promotion is gated by the
 * existing blocked-domain and allowed-source guardrails in the data layer.
 */
export async function confirmLearningCandidate(
  tripId: string,
  candidate: TripLearningCandidate
): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Accounts aren't connected yet." };
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." };

  const decidedAt = new Date().toISOString();

  // Record the decision log entry first
  await recordLearningCandidateDecision(
    user.id,
    tripId,
    candidate.candidate_key,
    "CONFIRMED",
    decidedAt,
    candidate as unknown as object
  );

  // Promote to travel memory only if candidate is marked promotable
  if (candidate.is_promotable) {
    await recordTravelMemorySignal({
      userId: user.id,
      source: "POST_TRIP_REFLECTION",
      domain: candidate.domain,
      subject: candidate.subject,
      value: candidate.value ?? undefined,
      direction: candidate.direction,
      sourceTripId: tripId,
    });
  }

  revalidatePath(`/trips/${tripId}/reflection`);
  return {};
}

export async function rejectLearningCandidate(
  tripId: string,
  candidateKey: string,
  candidateSnapshot?: TripLearningCandidate
): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Accounts aren't connected yet." };
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." };

  const decidedAt = new Date().toISOString();
  await recordLearningCandidateDecision(
    user.id,
    tripId,
    candidateKey,
    "REJECTED",
    decidedAt,
    candidateSnapshot as unknown as object | undefined
  );

  revalidatePath(`/trips/${tripId}/reflection`);
  return {};
}

export async function deferLearningCandidate(
  tripId: string,
  candidateKey: string
): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Accounts aren't connected yet." };
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." };

  const decidedAt = new Date().toISOString();
  await recordLearningCandidateDecision(user.id, tripId, candidateKey, "DEFERRED", decidedAt);
  return {};
}

// ---------------------------------------------------------------------------
// Load full reflection state (used by the page server component)
// ---------------------------------------------------------------------------

export async function loadReflectionState(tripId: string) {
  if (!isSupabaseConfigured()) return null;
  const user = await getCurrentUser();
  if (!user) return null;
  return getTripReflection(user.id, tripId);
}

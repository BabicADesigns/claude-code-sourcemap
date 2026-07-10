import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/monitoring/logger";
import type {
  TripReflection,
  TripReflectionItem,
  TripLearningCandidateDecision,
  TripReflectionStatus,
  OverallFeeling,
  PaceReflection,
  PlanningComfort,
  ReturnIntent,
  ItemReflection,
  CandidateDecision,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// trip_reflections
// ---------------------------------------------------------------------------

export async function getTripReflection(
  userId: string,
  tripId: string
): Promise<TripReflection | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("trip_reflections")
    .select("*")
    .eq("user_id", userId)
    .eq("trip_id", tripId)
    .maybeSingle();

  if (error) {
    logError("data.post-trip-reflection.getTripReflection", error, { userId, tripId });
    return null;
  }
  return (data as TripReflection | null) ?? null;
}

interface UpsertReflectionInput {
  userId: string;
  tripId: string;
  status?: TripReflectionStatus;
  overall_feeling?: OverallFeeling | null;
  pace_reflection?: PaceReflection | null;
  planning_comfort?: PlanningComfort | null;
  return_intent?: ReturnIntent | null;
  return_intent_destination?: string | null;
  private_note?: string | null;
  completed_at?: string | null;
}

export async function upsertTripReflection(
  input: UpsertReflectionInput
): Promise<TripReflection | null> {
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("trip_reflections")
    .upsert(
      {
        user_id: input.userId,
        trip_id: input.tripId,
        status: input.status ?? "IN_PROGRESS",
        overall_feeling: input.overall_feeling ?? null,
        pace_reflection: input.pace_reflection ?? null,
        planning_comfort: input.planning_comfort ?? null,
        return_intent: input.return_intent ?? null,
        return_intent_destination: input.return_intent_destination ?? null,
        private_note: input.private_note ?? null,
        completed_at: input.completed_at ?? null,
        updated_at: now,
      },
      { onConflict: "user_id,trip_id" }
    )
    .select()
    .single();

  if (error) {
    logError("data.post-trip-reflection.upsertTripReflection", error, {
      userId: input.userId,
      tripId: input.tripId,
    });
    return null;
  }
  return data as TripReflection;
}

// ---------------------------------------------------------------------------
// trip_reflection_items
// ---------------------------------------------------------------------------

export async function getTripReflectionItems(
  userId: string,
  tripId: string
): Promise<TripReflectionItem[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("trip_reflection_items")
    .select("*")
    .eq("user_id", userId)
    .eq("trip_id", tripId);

  if (error) {
    logError("data.post-trip-reflection.getTripReflectionItems", error, { userId, tripId });
    return [];
  }
  return (data ?? []) as TripReflectionItem[];
}

export async function upsertReflectionItem(
  userId: string,
  tripId: string,
  itemKey: string,
  value: ItemReflection
): Promise<boolean> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("trip_reflection_items")
    .upsert(
      {
        user_id: userId,
        trip_id: tripId,
        item_key: itemKey,
        value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,trip_id,item_key" }
    );

  if (error) {
    logError("data.post-trip-reflection.upsertReflectionItem", error, { userId, tripId, itemKey });
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// trip_learning_candidates
// ---------------------------------------------------------------------------

export async function getTripLearningDecisions(
  userId: string,
  tripId: string
): Promise<TripLearningCandidateDecision[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("trip_learning_candidates")
    .select("*")
    .eq("user_id", userId)
    .eq("trip_id", tripId);

  if (error) {
    logError("data.post-trip-reflection.getTripLearningDecisions", error, { userId, tripId });
    return [];
  }
  return (data ?? []) as TripLearningCandidateDecision[];
}

export async function recordLearningCandidateDecision(
  userId: string,
  tripId: string,
  candidateKey: string,
  decision: CandidateDecision,
  decidedAt: string,
  candidateSnapshot?: object
): Promise<boolean> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("trip_learning_candidates")
    .upsert(
      {
        user_id: userId,
        trip_id: tripId,
        candidate_key: candidateKey,
        decision,
        decided_at: decidedAt,
        candidate_snapshot: candidateSnapshot ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,trip_id,candidate_key" }
    );

  if (error) {
    logError("data.post-trip-reflection.recordLearningCandidateDecision", error, {
      userId,
      tripId,
      candidateKey,
    });
    return false;
  }
  return true;
}

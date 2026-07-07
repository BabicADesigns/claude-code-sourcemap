/**
 * Post-Trip Reflection Engine — Deterministic (Phase 24)
 *
 * Pure functions. No I/O, no async, no AI as decision engine.
 * All reflection eligibility and candidate derivation is rule-based and
 * deterministic — no external calls, no randomness, no inference.
 *
 * Core philosophy:
 * - "A completed trip should not become dead data."
 * - "Balkanish must not turn travel into a performance review."
 * - "Reflection is optional." — eligibility ≠ obligation.
 * - "Silence is not negative feedback."
 * - "Completion is not preference."
 * - "Skipping is not dislike."
 * - "Doing something is not proof of enjoyment."
 * - "Explicit reflection outweighs behavioural ambiguity."
 * - "Private reflections stay private."
 * - "The traveller confirms what becomes memory."
 */

import type { ItineraryDay } from "@/lib/ai/itinerary";
import type {
  TripLifecycleState,
  OverallFeeling,
  PaceReflection,
  PlanningComfort,
  ItemReflection,
  ReflectionTimingWindow,
  TripLearningCandidate,
  TripReflectionItem,
  LiveItemStatus,
  MemoryPreferenceDomain,
  MemorySignalDirection,
  CandidateConfidenceBasis,
} from "@/lib/types";
import { addDaysToDateString } from "@/lib/ai/live-trip";

// ---------------------------------------------------------------------------
// Date arithmetic (reused from live-trip pattern, UTC-safe)
// ---------------------------------------------------------------------------

function dateStringToUtcMs(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function dateDiffDays(a: string, b: string): number {
  return Math.round((dateStringToUtcMs(a) - dateStringToUtcMs(b)) / 86_400_000);
}

// ---------------------------------------------------------------------------
// Reflection eligibility
// ---------------------------------------------------------------------------

export interface ReflectionEligibilityResult {
  eligible: boolean;
  reason?: string;
}

/**
 * Determine whether a trip is eligible to have a post-trip reflection started.
 * Eligibility requires:
 *   1. Lifecycle is COMPLETED
 *   2. departure_date is known
 *   3. The trip has at least one itinerary day
 *
 * Eligibility never expires — a traveller can reflect on an old trip at any time.
 * The timing window affects only how the UI frames the invitation, not access.
 */
export function isTripReflectionEligible(
  lifecycle: TripLifecycleState,
  departureDateString: string | null | undefined,
  days: ItineraryDay[]
): ReflectionEligibilityResult {
  if (lifecycle !== "COMPLETED") {
    return { eligible: false, reason: "trip_not_completed" };
  }
  if (!departureDateString) {
    return { eligible: false, reason: "no_departure_date" };
  }
  if (!days || days.length === 0) {
    return { eligible: false, reason: "no_itinerary_days" };
  }
  return { eligible: true };
}

// ---------------------------------------------------------------------------
// Timing window
// ---------------------------------------------------------------------------

/**
 * Compute which timing window the traveller is in relative to trip completion.
 * JUST_RETURNED: 0–3 days after the last day of the trip
 * RECENT: 4–30 days after
 * PAST_TRIP: 31+ days after
 *
 * departureDateString: YYYY-MM-DD of departure
 * durationDays: number of trip days (last day = departure + durationDays - 1)
 * todayDateString: YYYY-MM-DD from getTodayDateString() on the client
 */
export function computeReflectionTimingWindow(
  departureDateString: string,
  durationDays: number,
  todayDateString: string
): ReflectionTimingWindow {
  const lastDayString = addDaysToDateString(departureDateString, durationDays - 1);
  const daysSinceReturn = dateDiffDays(todayDateString, lastDayString);

  if (daysSinceReturn <= 3) return "JUST_RETURNED";
  if (daysSinceReturn <= 30) return "RECENT";
  return "PAST_TRIP";
}

// ---------------------------------------------------------------------------
// Reflection item candidates from live-trip states
// ---------------------------------------------------------------------------

/**
 * Build the list of item_keys that should appear in the item reflection step.
 * All items from live-trip states that are DONE or PLANNED are eligible for reflection.
 * SKIPPED items default to NOT_EXPERIENCED and are pre-filled but editable.
 * Items with no live-trip state at all are also included (treated as PLANNED).
 *
 * This does NOT generate memory candidates — that is a separate step after
 * the traveller explicitly rates items.
 */
export function buildReflectionItemKeys(
  days: ItineraryDay[],
  liveStates: Record<string, LiveItemStatus>
): Array<{ item_key: string; suggested_value: ItemReflection }> {
  const result: Array<{ item_key: string; suggested_value: ItemReflection }> = [];

  for (const day of days) {
    const slots: Array<keyof Pick<ItineraryDay, "morning" | "afternoon" | "evening" | "food_highlight">> =
      ["morning", "afternoon", "evening", "food_highlight"];

    for (const slot of slots) {
      if (!day[slot]) continue;

      const slotKey = slot === "food_highlight" ? "food" : slot;
      const itemKey = `day${day.day}:${slotKey}`;
      const liveStatus = liveStates[itemKey];

      let suggested: ItemReflection;
      if (liveStatus === "SKIPPED") {
        // Skipping is not dislike — default to NOT_EXPERIENCED, traveller can override
        suggested = "NOT_EXPERIENCED";
      } else {
        // DONE, PLANNED, or unknown — no assumption about feeling
        suggested = "NOT_EXPERIENCED";
      }

      result.push({ item_key: itemKey, suggested_value: suggested });
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Learning candidate derivation
// ---------------------------------------------------------------------------

interface CandidateInput {
  tripId: string;
  days: ItineraryDay[];
  overallFeeling?: OverallFeeling | null;
  paceReflection?: PaceReflection | null;
  planningComfort?: PlanningComfort | null;
  reflectionItems: TripReflectionItem[];
}

/**
 * Derive TripLearningCandidates deterministically from explicit reflection data.
 *
 * Rules:
 * - DONE ≠ LOVED — completed items do not generate positive candidates unless rated LOVED
 * - SKIPPED ≠ DISLIKED — skipped items never produce negative candidates
 * - Only explicit ratings (LOVED, WOULD_SKIP) on items produce activity candidates
 * - pace_reflection drives ITINERARY_PACE domain candidates
 * - planning_comfort drives PLANNING_STRUCTURE domain candidates
 * - overall_feeling modulates confidence level, never standalone candidate source
 * - UNKNOWN / PREFER_NOT_TO_SAY values → no candidate
 * - All candidates require traveller confirmation before memory promotion
 */
export function buildTripLearningCandidates(input: CandidateInput): TripLearningCandidate[] {
  const { tripId, overallFeeling, paceReflection, planningComfort, reflectionItems } = input;
  const candidates: TripLearningCandidate[] = [];

  // --- Pace candidate ---
  if (paceReflection && paceReflection !== "UNKNOWN" && paceReflection !== "JUST_RIGHT") {
    let direction: MemorySignalDirection;
    let value: string;

    if (paceReflection === "TOO_FULL") {
      direction = "POSITIVE";
      value = "LIGHT";
    } else if (paceReflection === "A_LITTLE_FULL") {
      direction = "POSITIVE";
      value = "BALANCED";
    } else {
      // TOO_SLOW
      direction = "POSITIVE";
      value = "FULL";
    }

    const confidence = overallFeeling === "LOVED_IT" || overallFeeling === "GOOD_TRIP"
      ? "HIGH"
      : overallFeeling === "MIXED"
      ? "MEDIUM"
      : ("MEDIUM" as CandidateConfidenceBasis);

    candidates.push({
      candidate_key: `${tripId}:ITINERARY_PACE:${value.toLowerCase()}`,
      domain: "ITINERARY_PACE" as MemoryPreferenceDomain,
      subject: "preferred_pace",
      value,
      direction,
      evidence_summary: `Traveller rated trip pace as "${paceReflection}", suggesting a preference for ${value.toLowerCase()} itineraries.`,
      confidence_basis: confidence,
      evidence_sources: ["pace_reflection"],
      memory_signal_source: "POST_TRIP_REFLECTION",
      conflicts_with_existing: false,
      conflicting_signal_id: null,
      is_promotable: true,
    });
  }

  // --- Planning structure candidate ---
  if (planningComfort && planningComfort !== "UNKNOWN" && planningComfort !== "CURRENT_LEVEL") {
    const direction: MemorySignalDirection = "POSITIVE";
    const value = planningComfort === "MORE_FLEXIBILITY" ? "FLEXIBLE" : "STRUCTURED";

    candidates.push({
      candidate_key: `${tripId}:PLANNING_STRUCTURE:${value.toLowerCase()}`,
      domain: "PLANNING_STRUCTURE" as MemoryPreferenceDomain,
      subject: "planning_structure",
      value,
      direction,
      evidence_summary: `Traveller indicated they would prefer ${planningComfort === "MORE_FLEXIBILITY" ? "more flexibility" : "more structure"} in future itineraries.`,
      confidence_basis: "MEDIUM",
      evidence_sources: ["planning_comfort"],
      memory_signal_source: "POST_TRIP_REFLECTION",
      conflicts_with_existing: false,
      conflicting_signal_id: null,
      is_promotable: true,
    });
  }

  // --- Activity category candidates from item ratings ---
  for (const item of reflectionItems) {
    if (item.value !== "LOVED" && item.value !== "WOULD_SKIP") continue;

    // Parse item_key to extract slot type for category inference
    const slotMatch = item.item_key.match(/^day\d+:(.+)$/);
    if (!slotMatch) continue;

    const slot = slotMatch[1];

    // Map slot to a MemoryPreferenceDomain and subject slug
    const categoryMap: Record<string, { domain: MemoryPreferenceDomain; subject: string }> = {
      food: { domain: "FOOD_CULTURE", subject: "food_experiences" },
      morning: { domain: "ACTIVITY_CATEGORY_PREFERENCE" as MemoryPreferenceDomain, subject: "morning_activities" },
      afternoon: { domain: "ACTIVITY_CATEGORY_PREFERENCE" as MemoryPreferenceDomain, subject: "afternoon_activities" },
      evening: { domain: "ACTIVITY_CATEGORY_PREFERENCE" as MemoryPreferenceDomain, subject: "evening_activities" },
    };

    const mapping = categoryMap[slot];
    if (!mapping) continue;

    const direction: MemorySignalDirection = item.value === "LOVED" ? "POSITIVE" : "NEGATIVE";
    const candidateKey = `${tripId}:${mapping.domain}:${mapping.subject}_${direction.toLowerCase()}`;

    // Avoid duplicate candidate keys
    if (candidates.some((c) => c.candidate_key === candidateKey)) continue;

    candidates.push({
      candidate_key: candidateKey,
      domain: mapping.domain,
      subject: mapping.subject,
      value: item.value,
      direction,
      evidence_summary: `Traveller rated ${slot} activity as "${item.value}".`,
      confidence_basis: "LOW",
      evidence_sources: ["item_reflection"],
      memory_signal_source: "POST_TRIP_REFLECTION",
      conflicts_with_existing: false,
      conflicting_signal_id: null,
      is_promotable: true,
    });
  }

  // Rank: HIGH confidence first, then MEDIUM, then LOW
  const rankOrder: Record<CandidateConfidenceBasis, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  candidates.sort((a, b) => rankOrder[a.confidence_basis] - rankOrder[b.confidence_basis]);

  return candidates;
}

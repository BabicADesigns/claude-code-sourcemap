/**
 * Live Trip Mode — Deterministic Engine (Phase 23)
 *
 * Pure functions. No I/O, no async, no live data, no location.
 * All date arithmetic uses UTC midnight to avoid DST boundary issues.
 * All lifecycle decisions are based solely on departure_date, duration_days,
 * and the client's local date string — never server UTC time.
 *
 * Core philosophy:
 * - "During the trip, the planner should become quieter."
 * - "Time-aware is not the same as live-data-aware."
 * - "Passing time is not evidence of traveller behaviour."
 * - A planned activity is not proof of presence.
 */

import type { ItineraryDay } from "@/lib/ai/itinerary";
import type {
  TripLifecycleState,
  CurrentTripMoment,
  DayLoadLevel,
  PlanFlexibility,
  DaySlot,
  ItemTimeSemantic,
  NowNextGroup,
  LiveItemStatus,
  LiveTripDayItem,
  PracticalContextCard,
  PracticalContextCardType,
  TripDayContext,
  LighterDayProposal,
  TripReadinessItem,
  LiveTripItemState,
} from "@/lib/types";
import type { TravelSegment } from "@/lib/types";

// ---------------------------------------------------------------------------
// Date arithmetic helpers
// ---------------------------------------------------------------------------

/**
 * Parse a YYYY-MM-DD string into a UTC midnight timestamp.
 * Using UTC prevents DST from shifting the date boundary.
 */
function dateStringToUtcMs(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/**
 * Get today's date as a YYYY-MM-DD string in the *client's local timezone*.
 * Must only be called on the client (useEffect).
 */
export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Add N days to a YYYY-MM-DD string, returning a new YYYY-MM-DD string.
 * Safe for DST boundaries.
 */
export function addDaysToDateString(dateStr: string, days: number): string {
  const ms = dateStringToUtcMs(dateStr) + days * 86_400_000;
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const da = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
}

/**
 * Compute the calendar date (YYYY-MM-DD) for trip day N (1-indexed),
 * given the departure date string.
 */
export function getTripDayDateString(
  departureDateString: string,
  dayNumber: number
): string {
  return addDaysToDateString(departureDateString, dayNumber - 1);
}

/**
 * Diff in whole days: dayA - dayB (positive = dayA is later).
 */
function dateDiffDays(a: string, b: string): number {
  return Math.round((dateStringToUtcMs(a) - dateStringToUtcMs(b)) / 86_400_000);
}

// ---------------------------------------------------------------------------
// Lifecycle engine
// ---------------------------------------------------------------------------

/**
 * Compute where the trip stands in its lifecycle.
 * Called on the client with the local date string from getTodayDateString().
 *
 * Lifecycle boundaries:
 *   PLANNING:        No departure_date, or more than 1 day away.
 *   PRE_TRIP:        Exactly 1 day before departure (eve of travel).
 *   DEPARTURE_DAY:   departure_date === today (trip day 1).
 *   IN_TRIP:         After departure day, before last day is complete.
 *   COMPLETED:       Today is strictly after (departure_date + duration_days - 1).
 */
export function computeLifecycle(
  departureDateString: string | null | undefined,
  durationDays: number,
  todayDateString: string
): TripLifecycleState {
  if (!departureDateString) return "PLANNING";

  const diff = dateDiffDays(departureDateString, todayDateString);
  // diff: positive = departure is in the future; negative = departure is in the past

  if (diff > 1) return "PLANNING";
  if (diff === 1) return "PRE_TRIP";
  if (diff === 0) return "DEPARTURE_DAY";

  // diff < 0: we are past departure
  const daysPast = Math.abs(diff); // how many days since departure (0-indexed)
  if (daysPast < durationDays) return "IN_TRIP";
  return "COMPLETED";
}

/**
 * Compute the current trip moment from all available date information.
 * Returns a stable, deterministic snapshot — no side effects.
 */
export function computeCurrentMoment(
  departureDateString: string | null | undefined,
  durationDays: number,
  todayDateString: string
): CurrentTripMoment {
  const lifecycle = computeLifecycle(departureDateString, durationDays, todayDateString);

  let currentDayNumber: number | null = null;
  let daysFromDeparture: number | null = null;

  if (departureDateString) {
    const diff = dateDiffDays(departureDateString, todayDateString);
    daysFromDeparture = -diff; // positive = we are N days into (or past) the trip

    if (lifecycle === "DEPARTURE_DAY") {
      currentDayNumber = 1;
    } else if (lifecycle === "IN_TRIP") {
      currentDayNumber = Math.abs(diff) + 1;
    }
  }

  return {
    lifecycle,
    current_day_number: currentDayNumber,
    today_date_string: todayDateString,
    days_from_departure: daysFromDeparture,
  };
}

// ---------------------------------------------------------------------------
// Day load engine
// ---------------------------------------------------------------------------

const SLOT_KEYS: DaySlot[] = ["morning", "afternoon", "evening", "food"];

/** Count how many prose slots in an ItineraryDay have non-trivial content. */
function countPopulatedSlots(day: ItineraryDay): number {
  const texts = [day.morning, day.afternoon, day.evening, day.food_highlight];
  return texts.filter((t) => t && t.trim().length > 20).length;
}

/**
 * Compute day load from slot density.
 * LIGHT: 0–1 populated slots; MODERATE: 2; FULL: 3+.
 * This is an editorial estimate — the planner makes no live-schedule claims.
 */
export function computeDayLoad(day: ItineraryDay): DayLoadLevel {
  const count = countPopulatedSlots(day);
  if (count <= 1) return "LIGHT";
  if (count === 2) return "MODERATE";
  return "FULL";
}

/**
 * Derive plan flexibility from day load.
 */
export function computeItemFlexibility(load: DayLoadLevel): PlanFlexibility {
  if (load === "LIGHT") return "EASY_TO_MOVE";
  if (load === "MODERATE") return "SOME_FLEXIBILITY";
  return "TIGHTLY_PACKED";
}

// ---------------------------------------------------------------------------
// Item builder
// ---------------------------------------------------------------------------

/** Map a slot to its prose text from ItineraryDay. */
function getSlotProse(day: ItineraryDay, slot: DaySlot): string {
  switch (slot) {
    case "morning": return day.morning ?? "";
    case "afternoon": return day.afternoon ?? "";
    case "evening": return day.evening ?? "";
    case "food": return day.food_highlight ?? "";
    case "day_overview": return day.summary ?? "";
  }
}

/** Prose-only itinerary slots are never FIXED_TIME — only SUGGESTED_TIME or UNTIMED. */
function slotTimeSemantic(slot: DaySlot): ItemTimeSemantic {
  if (slot === "morning" || slot === "afternoon" || slot === "evening") {
    return "SUGGESTED_TIME";
  }
  return "UNTIMED";
}

/**
 * Assign NowNextGroup based on current local hour and slot.
 * This is a heuristic suggestion, not a real-time assertion.
 * Copy must reflect this: "Your plan for this morning" not "You are at".
 */
function resolveNowNextGroupByHour(slot: DaySlot, currentHour: number): NowNextGroup {
  if (slot === "day_overview" || slot === "food") return "LATER";

  if (slot === "morning") {
    return currentHour < 12 ? "NOW" : "DONE_TODAY";
  }
  if (slot === "afternoon") {
    if (currentHour < 12) return "NEXT";
    if (currentHour < 17) return "NOW";
    return "DONE_TODAY";
  }
  if (slot === "evening") {
    if (currentHour < 17) return "LATER";
    return "NOW";
  }
  return "LATER";
}

/**
 * Build the list of LiveTripDayItems for a given day, merging prose with persisted states.
 * Only slots with meaningful prose are included (>20 chars).
 *
 * @param day - The ItineraryDay from the saved itinerary.
 * @param stateMap - Map of item_key → LiveTripItemState for this trip.
 * @param currentHour - Local hour (0–23) used for NowNext heuristic. Pass null for non-active days.
 * @param load - Pre-computed day load.
 */
export function buildLiveDayItems(
  day: ItineraryDay,
  stateMap: Map<string, LiveTripItemState>,
  currentHour: number | null,
  load: DayLoadLevel
): LiveTripDayItem[] {
  const flexibility = computeItemFlexibility(load);
  const items: LiveTripDayItem[] = [];

  for (const slot of SLOT_KEYS) {
    const prose = getSlotProse(day, slot);
    if (!prose || prose.trim().length <= 20) continue;

    const item_key = `day${day.day}:${slot}`;
    const persisted = stateMap.get(item_key);
    const status: LiveItemStatus = persisted?.status ?? "PLANNED";

    const now_next_group: NowNextGroup =
      status === "DONE" || status === "SKIPPED"
        ? "DONE_TODAY"
        : currentHour !== null
        ? resolveNowNextGroupByHour(slot, currentHour)
        : "LATER";

    items.push({
      item_key,
      day_number: day.day,
      slot,
      time_semantic: slotTimeSemantic(slot),
      prose,
      status,
      now_next_group,
      flexibility,
      note: persisted?.note ?? null,
    });
  }

  return items;
}

// ---------------------------------------------------------------------------
// NowNextGroup resolver (export for UI)
// ---------------------------------------------------------------------------

export function resolveNowNextGroup(
  slot: DaySlot,
  status: LiveItemStatus,
  currentHour: number | null
): NowNextGroup {
  if (status === "DONE" || status === "SKIPPED") return "DONE_TODAY";
  if (currentHour === null) return "LATER";
  return resolveNowNextGroupByHour(slot, currentHour);
}

// ---------------------------------------------------------------------------
// Practical context cards
// ---------------------------------------------------------------------------

/**
 * Build practical context cards for a trip day.
 * Cards are sourced from logistics data (TravelSegments) and readiness items.
 * All cards carry STATIC_CURATED or TRIP_DERIVED capability — never LIVE_PROVIDER.
 */
export function buildPracticalCards(
  dayNumber: number,
  segments: TravelSegment[],
  readinessItems: TripReadinessItem[]
): PracticalContextCard[] {
  const cards: PracticalContextCard[] = [];

  // Ferry day card — derived from TravelSegment ferry_info
  const ferrySegments = segments.filter((s) => s.ferry_info);
  if (ferrySegments.length > 0) {
    const ferry = ferrySegments[0];
    const info = ferry.ferry_info!;
    cards.push({
      type: "FERRY_DAY",
      headline: `Ferry: ${ferry.from_destination_name} → ${ferry.to_destination_name}`,
      body: [
        info.operator_name ? `Operator: ${info.operator_name}` : null,
        info.advance_booking_required ? "Advance booking recommended." : null,
        info.booking_tip ?? null,
        info.last_verified_season ? `Information from ${info.last_verified_season} — verify current schedules before travel.` : "Verify current schedules before travel.",
      ]
        .filter(Boolean)
        .join(" "),
      capability: "TRIP_DERIVED",
      action_url: info.operator_url ?? null,
    });
  }

  // Border crossing card
  const borderSegments = segments.filter((s) => s.border_info);
  if (borderSegments.length > 0) {
    const border = borderSegments[0];
    const info = border.border_info!;
    cards.push({
      type: "BORDER_CROSSING",
      headline: `Border crossing: ${border.from_destination_name} → ${border.to_destination_name}`,
      body: [
        info.crossing_point ? `Crossing point: ${info.crossing_point}.` : null,
        info.document_requirements ?? null,
        info.typical_wait_hint ? `Typical wait: ${info.typical_wait_hint}.` : null,
        "Border conditions change — check current requirements before travel.",
      ]
        .filter(Boolean)
        .join(" "),
      capability: "STATIC_CURATED",
      action_url: null,
    });
  }

  // Logistics move card (long transfer day without ferry)
  const longSegments = segments.filter(
    (s) =>
      !s.ferry_info &&
      (s.practicality.rating === "LONG_DAY" || s.practicality.rating === "COMPLEX")
  );
  if (longSegments.length > 0 && cards.length === 0) {
    const seg = longSegments[0];
    cards.push({
      type: "LOGISTICS_MOVE",
      headline: `Travel day: ${seg.from_destination_name} → ${seg.to_destination_name}`,
      body: [
        seg.drive_time_estimate ? `Estimated drive time: ${seg.drive_time_estimate}.` : null,
        seg.practicality.reason,
      ]
        .filter(Boolean)
        .join(" "),
      capability: "TRIP_DERIVED",
      action_url: null,
    });
  }

  // Reservation due card — HIGH or CRITICAL readiness items still PENDING
  const urgentItems = readinessItems.filter(
    (item) =>
      item.status === "PENDING" &&
      (item.reservation_sensitivity === "HIGH" || item.reservation_sensitivity === "CRITICAL") &&
      (item.timing_window === "IN_DESTINATION" || item.timing_window === "DO_NOW")
  );
  if (urgentItems.length > 0) {
    cards.push({
      type: "RESERVATION_DUE",
      headline: `${urgentItems.length} pending item${urgentItems.length > 1 ? "s" : ""} for today`,
      body: urgentItems.map((i) => i.title).join(", "),
      capability: "TRIP_DERIVED",
      action_url: null,
    });
  }

  // Packing check — packing items still PENDING (useful on departure/pre-trip days)
  if (dayNumber === 1) {
    const packingItems = readinessItems.filter(
      (item) =>
        item.status === "PENDING" &&
        item.category === "PACKING"
    );
    if (packingItems.length > 0) {
      cards.push({
        type: "PACKING_CHECK",
        headline: `${packingItems.length} packing item${packingItems.length > 1 ? "s" : ""} still pending`,
        body: "Check your packing list before you leave.",
        capability: "TRIP_DERIVED",
        action_url: null,
      });
    }
  }

  return cards;
}

// ---------------------------------------------------------------------------
// Lighter day proposal
// ---------------------------------------------------------------------------

/**
 * Build a lighter-day proposal by identifying the lowest-priority slots to suggest skipping.
 * Only suggests skipping PLANNED items (not already DONE/SKIPPED).
 * Never skips the last remaining item — a day needs at least one plan.
 */
export function buildLighterDayProposal(
  items: LiveTripDayItem[]
): LighterDayProposal | null {
  if (items.length === 0) return null;

  const plannedItems = items.filter((i) => i.status === "PLANNED");
  if (plannedItems.length <= 1) return null;

  // Priority order to skip: food first, then afternoon, then morning, never evening alone
  const skipPriority: DaySlot[] = ["food", "afternoon", "morning", "evening"];

  const toSkip: string[] = [];
  const remaining = [...plannedItems];

  for (const slot of skipPriority) {
    if (remaining.length <= 1) break;
    const idx = remaining.findIndex((i) => i.slot === slot);
    if (idx === -1) continue;
    toSkip.push(remaining[idx].item_key);
    remaining.splice(idx, 1);
  }

  if (toSkip.length === 0) return null;

  const loadAfter: DayLoadLevel =
    remaining.length <= 1 ? "LIGHT" : remaining.length === 2 ? "MODERATE" : "FULL";

  const dayNumber = items[0].day_number;
  return {
    original_day_number: dayNumber,
    suggested_items_to_keep: remaining.map((i) => i.item_key),
    suggested_items_to_skip: toSkip,
    reasoning:
      "Based on your plan, a lighter day is possible by setting aside some activities. You can always come back to them.",
    load_after: loadAfter,
  };
}

// ---------------------------------------------------------------------------
// Full day context builder
// ---------------------------------------------------------------------------

/**
 * Build the complete TripDayContext for one trip day.
 * This is the primary entry point for the Today view.
 *
 * @param day - ItineraryDay from the saved itinerary (1-indexed day.day field)
 * @param departureDateString - The trip's departure date (YYYY-MM-DD)
 * @param stateMap - All persisted LiveTripItemState for this trip, keyed by item_key
 * @param currentHour - Local hour (0–23); null if viewing a non-current day
 * @param segments - TravelSegments for this day's route leg (may be empty)
 * @param readinessItems - Relevant readiness items (typically IN_DESTINATION timing)
 */
export function buildTripDayContext(
  day: ItineraryDay,
  departureDateString: string,
  stateMap: Map<string, LiveTripItemState>,
  currentHour: number | null,
  segments: TravelSegment[],
  readinessItems: TripReadinessItem[]
): TripDayContext {
  const load = computeDayLoad(day);
  const flexibility = computeItemFlexibility(load);
  const items = buildLiveDayItems(day, stateMap, currentHour, load);
  const practical_cards = buildPracticalCards(day.day, segments, readinessItems);
  const date_string = getTripDayDateString(departureDateString, day.day);

  return {
    day_number: day.day,
    date_string,
    title: day.title,
    load,
    flexibility,
    items,
    practical_cards,
  };
}

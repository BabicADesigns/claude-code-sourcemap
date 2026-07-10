import type { TripLifecycleState } from "@/lib/types";

export type LifecycleNavEntry = {
  /** Dot-path key within the common i18n namespace, e.g. "navigation.liveTrip" */
  labelKey: string;
  href: string;
  variant: "default" | "outline";
};

/**
 * Canonical source of truth for trip lifecycle navigation policy.
 *
 * Returns the single primary lifecycle CTA for a trip in the given state,
 * or null when no lifecycle surface is appropriate (PLANNING with no departure
 * date, or departure is more than 1 day away).
 *
 * Callers must resolve labelKey via their i18n provider:
 *   t("common", action.labelKey)
 *
 * Do not scatter lifecycle CTA decisions across components — use this function.
 */
export function getPrimaryLifecycleAction(
  lifecycle: TripLifecycleState,
  tripId: string
): LifecycleNavEntry | null {
  switch (lifecycle) {
    case "PRE_TRIP":
    case "DEPARTURE_DAY":
    case "IN_TRIP":
      return {
        labelKey: "navigation.liveTrip",
        href: `/trips/${tripId}/today`,
        variant: "default",
      };
    case "COMPLETED":
      return {
        labelKey: "navigation.reflectOnTrip",
        href: `/trips/${tripId}/reflection`,
        variant: "outline",
      };
    case "PLANNING":
    default:
      return null;
  }
}

/**
 * Lifecycle navigation policy matrix — for documentation and audit purposes.
 *
 * This object describes the full policy for each lifecycle state, including
 * what is primary, what is secondary, and what is unavailable.
 * It is NOT used at runtime; use getPrimaryLifecycleAction for runtime decisions.
 * Referenced by docs/authenticated-workspace-architecture.md.
 */
export const LIFECYCLE_NAVIGATION_POLICY: Record<
  TripLifecycleState,
  {
    primary: string | null;
    secondary: string | null;
    unavailable: string[];
    notes: string;
  }
> = {
  PLANNING: {
    primary: null,
    secondary: "Trip Companion (/trips/[id]/companion)",
    unavailable: ["Live Trip", "Trip Reflection"],
    notes:
      "No departure date, or departure is more than 1 day away. No time-sensitive lifecycle surface available. Trip Companion is always accessible.",
  },
  PRE_TRIP: {
    primary: "Live Trip (/trips/[id]/today)",
    secondary: "Trip Companion (/trips/[id]/companion)",
    unavailable: ["Trip Reflection"],
    notes:
      "1 day before departure (eve of travel). Surface Live Trip as the primary action. Trip Companion remains accessible for last-minute readiness.",
  },
  DEPARTURE_DAY: {
    primary: "Live Trip (/trips/[id]/today)",
    secondary: "Trip Companion (/trips/[id]/companion)",
    unavailable: ["Trip Reflection"],
    notes:
      "Day 1 of travel. Surface Live Trip as the primary action.",
  },
  IN_TRIP: {
    primary: "Live Trip (/trips/[id]/today)",
    secondary: "Trip Companion (/trips/[id]/companion)",
    unavailable: ["Trip Reflection"],
    notes:
      "Days 2–N of travel. Surface Live Trip as the primary action.",
  },
  COMPLETED: {
    primary: "Reflect on this trip (/trips/[id]/reflection)",
    secondary: null,
    unavailable: ["Live Trip"],
    notes:
      "All trip days have passed. Surface Trip Reflection as the primary action. Live Trip is no longer relevant.",
  },
};

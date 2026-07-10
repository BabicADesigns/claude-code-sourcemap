/**
 * Deterministic Pre-Trip Readiness Rules Engine
 *
 * Pure functions — no I/O, no AI. Takes trip context and returns a flat list
 * of readiness item templates. The data layer merges these against persisted
 * state so user check-offs survive re-generation.
 *
 * Rule keys must remain stable across versions — they are the idempotency key
 * for the upsert in lib/data/trip-readiness.ts. Never rename a key once shipped.
 */

import type { TravelSegment, TripReadinessItem } from "@/lib/types";
import type { GeneratedItinerary, PlannerInput } from "@/lib/ai/itinerary";
import {
  type ReadinessCategory,
  type ReadinessPriority,
  type ReadinessTimingWindow,
  type ReservationSensitivity,
  type TripCountdownState,
  READINESS_TIMING_WINDOW_ORDER,
} from "@/lib/types";

export interface TripReadinessContext {
  itinerary: GeneratedItinerary;
  input: PlannerInput;
  travelSegments?: TravelSegment[];
  departureDate: Date | null;
}

/** Subset of TripReadinessItem used for upsert — no server-assigned fields. */
export interface TripReadinessTemplate {
  rule_key: string;
  category: ReadinessCategory;
  timing_window: ReadinessTimingWindow;
  priority: ReadinessPriority;
  title: string;
  description: string;
  reservation_sensitivity: ReservationSensitivity;
  context_metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Countdown helpers
// ---------------------------------------------------------------------------

export function computeDaysUntilDeparture(departureDate: Date | null): number | null {
  if (!departureDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dep = new Date(departureDate);
  dep.setHours(0, 0, 0, 0);
  return Math.round((dep.getTime() - today.getTime()) / 86_400_000);
}

export function computeCountdownState(daysUntil: number | null): TripCountdownState {
  if (daysUntil === null) return "FUTURE";
  if (daysUntil > 0) return "FUTURE";
  if (daysUntil === 0) return "TODAY";
  // Negative: trip has started; treat as STARTED until duration passes
  return "STARTED";
}

/** Returns the current urgency window based on days remaining. */
export function currentWindowFromDays(daysUntil: number | null): ReadinessTimingWindow {
  if (daysUntil === null) return "PLANNING_PHASE";
  if (daysUntil <= 0) return "DO_NOW";
  if (daysUntil <= 3) return "NOW_URGENT";
  if (daysUntil <= 14) return "THIS_WEEK";
  if (daysUntil <= 30) return "THIS_MONTH";
  if (daysUntil <= 90) return "BEFORE_YOU_GO";
  return "PLANNING_PHASE";
}

/**
 * Returns true when an item with the given timing_window should surface in the
 * "What Matters Now" section given the current countdown window.
 */
export function isActiveNow(
  itemWindow: ReadinessTimingWindow,
  currentWindow: ReadinessTimingWindow
): boolean {
  return READINESS_TIMING_WINDOW_ORDER[itemWindow] <= READINESS_TIMING_WINDOW_ORDER[currentWindow];
}

// ---------------------------------------------------------------------------
// Rule builders — each returns zero or more templates
// ---------------------------------------------------------------------------

function documentRules(daysUntil: number | null): TripReadinessTemplate[] {
  const items: TripReadinessTemplate[] = [];

  // Passport renewal can take 6+ weeks — always surface at PLANNING_PHASE
  // escalate to DO_NOW if departure is imminent
  const passportWindow: ReadinessTimingWindow =
    daysUntil !== null && daysUntil <= 14 ? "DO_NOW" : "PLANNING_PHASE";

  items.push({
    rule_key: "documents.passport",
    category: "DOCUMENTS",
    timing_window: passportWindow,
    priority: "CRITICAL",
    title: "Passport validity",
    description:
      "Check your passport expires at least 6 months after your return date. Many Balkan border controls enforce this strictly.",
    reservation_sensitivity: "CRITICAL",
  });

  items.push({
    rule_key: "documents.copies",
    category: "DOCUMENTS",
    timing_window: "BEFORE_YOU_GO",
    priority: "MEDIUM",
    title: "Document copies",
    description:
      "Keep digital and physical copies of your passport, insurance policy, and booking confirmations stored separately from originals.",
    reservation_sensitivity: "LOW",
  });

  return items;
}

function visaRules(): TripReadinessTemplate[] {
  return [
    {
      rule_key: "visa.requirements",
      category: "VISA",
      timing_window: "PLANNING_PHASE",
      priority: "CRITICAL",
      title: "Visa requirements",
      description:
        "Check entry requirements for each country in your itinerary. Most Western passports enter Croatia, Montenegro, and Slovenia visa-free; Bosnia and Albania vary. Always verify directly with the official embassy website.",
      reservation_sensitivity: "CRITICAL",
    },
  ];
}

function healthRules(daysUntil: number | null): TripReadinessTemplate[] {
  const items: TripReadinessTemplate[] = [];

  // Vaccinations need weeks to take effect — always PLANNING_PHASE
  const vaccinationWindow: ReadinessTimingWindow =
    daysUntil !== null && daysUntil <= 30 ? "BEFORE_YOU_GO" : "PLANNING_PHASE";

  items.push({
    rule_key: "health.vaccinations",
    category: "HEALTH",
    timing_window: vaccinationWindow,
    priority: "HIGH",
    title: "Travel vaccinations",
    description:
      "Confirm routine vaccinations are up to date. Tick-borne encephalitis vaccine is recommended for rural and forested areas in the western Balkans.",
    reservation_sensitivity: "LOW",
  });

  items.push({
    rule_key: "health.prescriptions",
    category: "HEALTH",
    timing_window: "BEFORE_YOU_GO",
    priority: "HIGH",
    title: "Prescription medications",
    description:
      "Ensure you have enough prescription medication for your trip plus a buffer. Carry a copy of the prescription and a doctor's note for customs.",
    reservation_sensitivity: "LOW",
  });

  items.push({
    rule_key: "health.kit",
    category: "HEALTH",
    timing_window: "THIS_WEEK",
    priority: "MEDIUM",
    title: "Travel health kit",
    description:
      "Pack a basic kit: pain relief, antihistamines, blister plasters, sunscreen, and insect repellent. Pharmacies are well-stocked in cities but scarce on islands.",
    reservation_sensitivity: "LOW",
  });

  return items;
}

function insuranceRules(): TripReadinessTemplate[] {
  return [
    {
      rule_key: "insurance.travel",
      category: "INSURANCE",
      timing_window: "BEFORE_YOU_GO",
      priority: "CRITICAL",
      title: "Travel insurance",
      description:
        "Arrange comprehensive travel insurance covering medical evacuation, trip cancellation, and delays. Check coverage includes adventure activities if relevant to your itinerary.",
      reservation_sensitivity: "CRITICAL",
    },
    {
      rule_key: "insurance.health_card",
      category: "INSURANCE",
      timing_window: "BEFORE_YOU_GO",
      priority: "HIGH",
      title: "European Health Insurance Card (EHIC / GHIC)",
      description:
        "If you hold an EU or UK passport, carry your EHIC or GHIC for reduced-cost state healthcare in Croatia and Slovenia. Does not replace travel insurance.",
      reservation_sensitivity: "LOW",
    },
  ];
}

function accommodationRules(input: PlannerInput, daysUntil: number | null): TripReadinessTemplate[] {
  const items: TripReadinessTemplate[] = [];

  // Peak season (Jun–Sep) properties fill up quickly — escalate timing
  const isPeakSeason = ["June", "July", "August", "September"].includes(input.month);
  const accommodationWindow: ReadinessTimingWindow = isPeakSeason
    ? daysUntil !== null && daysUntil <= 30
      ? "THIS_MONTH"
      : "BEFORE_YOU_GO"
    : "BEFORE_YOU_GO";

  items.push({
    rule_key: "accommodation.booking",
    category: "ACCOMMODATION",
    timing_window: accommodationWindow,
    priority: isPeakSeason ? "HIGH" : "MEDIUM",
    title: isPeakSeason ? "Book accommodation — peak season" : "Book accommodation",
    description: isPeakSeason
      ? `${input.month} is high season across the Adriatic. Quality properties on the coast and islands sell out months in advance. Book now.`
      : `Book accommodation for each stop. Independent guesthouses and agriturismos in rural areas often need advance contact.`,
    reservation_sensitivity: isPeakSeason ? "CRITICAL" : "HIGH",
  });

  items.push({
    rule_key: "accommodation.confirm_addresses",
    category: "ACCOMMODATION",
    timing_window: "THIS_WEEK",
    priority: "MEDIUM",
    title: "Confirm check-in details",
    description:
      "Verify check-in times and addresses for each property. Properties on islands or in old towns may have hard-to-find entrances — save Google Maps pins in advance.",
    reservation_sensitivity: "LOW",
  });

  return items;
}

function transportRules(input: PlannerInput, travelSegments?: TravelSegment[]): TripReadinessTemplate[] {
  const items: TripReadinessTemplate[] = [];

  const hasCarRental = input.transport_preferences?.includes("rental_car");
  const hasOwnCar = input.transport_preferences?.includes("own_car");

  if (hasCarRental) {
    items.push({
      rule_key: "transport.car_rental",
      category: "TRANSPORT",
      timing_window: "BEFORE_YOU_GO",
      priority: "HIGH",
      title: "Car rental confirmation",
      description:
        "Book and confirm your rental car. Check the insurance coverage — decline the credit-card collision waiver only if your card's coverage is confirmed in writing. An international driving permit may be required in some countries.",
      reservation_sensitivity: "HIGH",
    });
  }

  if (hasOwnCar) {
    items.push({
      rule_key: "transport.own_car_docs",
      category: "TRANSPORT",
      timing_window: "BEFORE_YOU_GO",
      priority: "MEDIUM",
      title: "Vehicle documentation",
      description:
        "Carry your vehicle registration, proof of insurance, and a green card for the countries you're crossing into. Check that your breakdown cover extends to the Balkans.",
      reservation_sensitivity: "LOW",
    });
  }

  // Check for ferry segments
  const ferrySegments = (travelSegments ?? []).filter((s) => s.ferry_info);
  if (ferrySegments.length > 0) {
    const routeDescription = ferrySegments
      .map((s) => `${s.from_destination_name} → ${s.to_destination_name}`)
      .join(", ");

    items.push({
      rule_key: "ferry.booking",
      category: "FERRY",
      timing_window: "BEFORE_YOU_GO",
      priority: "HIGH",
      title: "Ferry tickets",
      description: `Book ferry crossings in advance, especially with a vehicle. Routes: ${routeDescription}. Car deck space sells out weeks ahead in summer. Verify current timetables on the operator's website — schedules change seasonally.`,
      reservation_sensitivity: "CRITICAL",
      context_metadata: { routes: routeDescription },
    });
  }

  // Check for border crossings
  const borderSegments = (travelSegments ?? []).filter((s) => s.border_info);
  if (borderSegments.length > 0) {
    const borderRoutes = borderSegments
      .map((s) => `${s.from_destination_name} → ${s.to_destination_name}`)
      .join(", ");

    items.push({
      rule_key: "border.requirements",
      category: "BORDER_CROSSING",
      timing_window: "BEFORE_YOU_GO",
      priority: "HIGH",
      title: "Border crossing requirements",
      description: `Your route includes border crossings (${borderRoutes}). Check current entry requirements, vehicle documentation, and whether your car hire covers cross-border travel. Some borders require a vignette or green card.`,
      reservation_sensitivity: "LOW",
      context_metadata: { routes: borderRoutes },
    });
  }

  return items;
}

function moneyRules(input: PlannerInput): TripReadinessTemplate[] {
  const isLuxury = input.budget === "luxury";

  return [
    {
      rule_key: "money.cash_and_cards",
      category: "MONEY",
      timing_window: "THIS_WEEK",
      priority: "MEDIUM",
      title: "Cash and card strategy",
      description:
        "Croatia uses EUR; Bosnia, Serbia, and Albania still deal largely in cash. Montenegro uses EUR but has limited ATM coverage in rural areas. Carry a mix: a no-fee travel debit card plus €100–200 in small notes.",
      reservation_sensitivity: "LOW",
    },
    {
      rule_key: "money.notify_bank",
      category: "MONEY",
      timing_window: "THIS_WEEK",
      priority: isLuxury ? "MEDIUM" : "LOW",
      title: "Notify your bank",
      description:
        "Tell your bank and card provider you're travelling. Some banks block foreign ATM withdrawals without advance notice, especially for daily limits over €300.",
      reservation_sensitivity: "LOW",
    },
  ];
}

function connectivityRules(): TripReadinessTemplate[] {
  return [
    {
      rule_key: "connectivity.sim",
      category: "CONNECTIVITY",
      timing_window: "THIS_WEEK",
      priority: "MEDIUM",
      title: "SIM card or eSIM",
      description:
        "EU roaming applies in Croatia and Slovenia. Montenegro, Bosnia, Albania, and Serbia are outside the EU — check your plan's international rates or buy a local SIM on arrival. eSIMs from providers like Airalo work well across the region.",
      reservation_sensitivity: "LOW",
    },
    {
      rule_key: "connectivity.offline_maps",
      category: "CONNECTIVITY",
      timing_window: "THIS_WEEK",
      priority: "LOW",
      title: "Download offline maps",
      description:
        "Download Google Maps or Maps.me offline maps for each country on your route. Mobile signal is unreliable in mountain passes and rural coastal areas.",
      reservation_sensitivity: "LOW",
    },
  ];
}

function packingRules(input: PlannerInput): TripReadinessTemplate[] {
  const items: TripReadinessTemplate[] = [];

  items.push({
    rule_key: "packing.essentials",
    category: "PACKING",
    timing_window: "THIS_WEEK",
    priority: "MEDIUM",
    title: "Pack for the climate",
    description: `${input.month} in the Balkans: expect heat and high humidity on the coast, cooler evenings inland. Pack light, breathable layers plus a compact rain shell. Modest dress is required in religious sites.`,
    reservation_sensitivity: "LOW",
  });

  const hasHiking = input.interests.some(
    (i) => i.toLowerCase().includes("hiking") || i.toLowerCase().includes("nature")
  );
  if (hasHiking) {
    items.push({
      rule_key: "packing.hiking_gear",
      category: "PACKING",
      timing_window: "THIS_WEEK",
      priority: "MEDIUM",
      title: "Hiking gear",
      description:
        "Pack sturdy ankle-support trail shoes, trekking poles if needed, and sun protection. Many Balkan trails are unmarked — download a hiking GPS app (Komoot, AllTrails) with offline maps.",
      reservation_sensitivity: "LOW",
    });
  }

  const hasBeach = input.interests.some((i) => i.toLowerCase().includes("beach"));
  if (hasBeach) {
    items.push({
      rule_key: "packing.beach_gear",
      category: "PACKING",
      timing_window: "THIS_WEEK",
      priority: "LOW",
      title: "Beach and water gear",
      description:
        "Adriatic beaches are often pebbled — water shoes are a worthwhile comfort. Pack high-SPF sunscreen (50+) as Croatian pharmacy prices are high.",
      reservation_sensitivity: "LOW",
    });
  }

  return items;
}

function weatherRules(input: PlannerInput): TripReadinessTemplate[] {
  return [
    {
      rule_key: "weather.forecast",
      category: "WEATHER",
      timing_window: "NOW_URGENT",
      priority: "LOW",
      title: "Check 3-day forecast",
      description: `Check the weather for ${input.month} at each stop before you leave. The Adriatic can produce sudden afternoon thunderstorms; mountain areas cool sharply at night.`,
      reservation_sensitivity: "LOW",
    },
  ];
}

function localCustomsRules(): TripReadinessTemplate[] {
  return [
    {
      rule_key: "local_customs.tipping",
      category: "LOCAL_CUSTOMS",
      timing_window: "IN_DESTINATION",
      priority: "LOW",
      title: "Tipping customs",
      description:
        "Tipping is appreciated but not obligatory. 10% at restaurants is generous; rounding up the bill is common. Tip taxi drivers by rounding up. In Bosnia and Albania cash tipping is preferred.",
      reservation_sensitivity: "LOW",
    },
    {
      rule_key: "local_customs.dress_code",
      category: "LOCAL_CUSTOMS",
      timing_window: "IN_DESTINATION",
      priority: "LOW",
      title: "Dress code in religious sites",
      description:
        "Cover shoulders and knees when entering mosques (Bosnia, Albania) and Orthodox churches. Shawls are often available at entrances, but having your own is more reliable.",
      reservation_sensitivity: "LOW",
    },
  ];
}

function emergencyRules(): TripReadinessTemplate[] {
  return [
    {
      rule_key: "emergency.contacts",
      category: "EMERGENCY",
      timing_window: "BEFORE_YOU_GO",
      priority: "HIGH",
      title: "Emergency contact list",
      description:
        "Save key numbers before you leave: travel insurance emergency line, embassy contacts for each country you're visiting, and a trusted contact at home who has copies of your documents.",
      reservation_sensitivity: "LOW",
    },
    {
      rule_key: "emergency.embassy",
      category: "EMERGENCY",
      timing_window: "BEFORE_YOU_GO",
      priority: "MEDIUM",
      title: "Register with your embassy",
      description:
        "Register your trip with your country's official travel registration service (e.g., FCDO Travel Aware, STEP). You'll receive safety alerts and it makes emergency contact easier.",
      reservation_sensitivity: "LOW",
    },
  ];
}

function languageRules(): TripReadinessTemplate[] {
  return [
    {
      rule_key: "language.phrases",
      category: "LANGUAGE",
      timing_window: "IN_DESTINATION",
      priority: "LOW",
      title: "A few local phrases",
      description:
        "Croatian, Bosnian, Montenegrin, and Serbian are mutually intelligible. Basic phrases: 'hvala' (thank you), 'dobar dan' (good day), 'gdje je?' (where is?). In Albania it's 'faleminderit' and 'mirëdita'.",
      reservation_sensitivity: "LOW",
    },
    {
      rule_key: "language.translation_app",
      category: "LANGUAGE",
      timing_window: "THIS_WEEK",
      priority: "LOW",
      title: "Download translation app",
      description:
        "Download Google Translate's offline packs for Croatian, Albanian, and any other languages on your route. Useful in rural restaurants and markets where English is rare.",
      reservation_sensitivity: "LOW",
    },
  ];
}

function activitiesRules(input: PlannerInput): TripReadinessTemplate[] {
  const items: TripReadinessTemplate[] = [];

  const hasHistory = input.interests.some(
    (i) => i.toLowerCase().includes("history") || i.toLowerCase().includes("old town")
  );
  if (hasHistory) {
    items.push({
      rule_key: "activities.prebook_heritage",
      category: "ACTIVITIES",
      timing_window: "BEFORE_YOU_GO",
      priority: "MEDIUM",
      title: "Pre-book heritage sites",
      description:
        "Popular walled towns and national parks (Plitvice, Kotor) sell timed entry tickets. Book online weeks in advance in peak season to avoid queues and sold-out slots.",
      reservation_sensitivity: "HIGH",
    });
  }

  const hasWine = input.interests.some((i) => i.toLowerCase().includes("wine"));
  if (hasWine) {
    items.push({
      rule_key: "activities.winery_reservations",
      category: "ACTIVITIES",
      timing_window: "BEFORE_YOU_GO",
      priority: "LOW",
      title: "Winery reservations",
      description:
        "Smaller Dalmatian and Istrian wineries require advance booking for tastings and tours. Email or call ahead — most do not take walk-ins.",
      reservation_sensitivity: "MEDIUM",
    });
  }

  items.push({
    rule_key: "activities.restaurant_reservations",
    category: "ACTIVITIES",
    timing_window: "BEFORE_YOU_GO",
    priority: "MEDIUM",
    title: "Key restaurant reservations",
    description:
      "Sought-after konobas and fish restaurants — especially on islands — fill up days ahead. Book the meals you care most about before you leave.",
    reservation_sensitivity: "MEDIUM",
  });

  return items;
}

function foodRules(input: PlannerInput): TripReadinessTemplate[] {
  const hasDietaryNeeds =
    input.cuisine_preferences?.some((p) =>
      ["vegetarian", "vegan", "gluten_free", "halal"].includes(p)
    ) ?? false;

  if (!hasDietaryNeeds) return [];

  return [
    {
      rule_key: "food.dietary_requirements",
      category: "FOOD",
      timing_window: "IN_DESTINATION",
      priority: "MEDIUM",
      title: "Dietary requirements on the ground",
      description:
        "The Balkans are improving for dietary needs but rural areas have limited options. Learn the local phrase for your restriction. Vegan options are easiest in Split, Zagreb, and Tirana; fish menus dominate coastal restaurants.",
      reservation_sensitivity: "LOW",
    },
  ];
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/** Builds the full list of readiness item templates for a given trip context. */
export function buildTripReadiness(ctx: TripReadinessContext): TripReadinessTemplate[] {
  const daysUntil = computeDaysUntilDeparture(ctx.departureDate);

  return [
    ...documentRules(daysUntil),
    ...visaRules(),
    ...healthRules(daysUntil),
    ...insuranceRules(),
    ...accommodationRules(ctx.input, daysUntil),
    ...transportRules(ctx.input, ctx.travelSegments),
    ...moneyRules(ctx.input),
    ...connectivityRules(),
    ...packingRules(ctx.input),
    ...weatherRules(ctx.input),
    ...localCustomsRules(),
    ...emergencyRules(),
    ...languageRules(),
    ...activitiesRules(ctx.input),
    ...foodRules(ctx.input),
  ];
}

/** Returns items that are immediately relevant given the current countdown state. */
export function buildWhatMattersNow(
  items: TripReadinessItem[],
  daysUntil: number | null
): TripReadinessItem[] {
  const currentWindow = currentWindowFromDays(daysUntil);
  return items.filter(
    (item) =>
      item.status === "PENDING" &&
      isActiveNow(item.timing_window, currentWindow)
  );
}

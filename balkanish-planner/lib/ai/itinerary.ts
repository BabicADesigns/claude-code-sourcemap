import OpenAI from "openai";
import { z } from "zod";
import {
  COUNTRIES,
  ITINERARY_FOCUS_LABELS,
  DESTINATION_CATEGORY_LABELS,
  PLANNER_STYLE_LABELS,
  TRIP_PACE_LABELS,
  type Country,
  type ItineraryFocus,
  type DestinationCategory,
  type PlannerStyle,
  type TripPace,
  type RouteVariant,
  type VerificationStatus,
  type DestinationSourceType,
  type ModerationStatus,
} from "@/lib/types";
import {
  deriveItineraryFocus,
  buildGroundedItinerary,
  findFoodFindsForDestination,
  type GroundedItinerary,
  type GroundedDayTrip,
} from "@/lib/ai/grounding";
import { parseDiscoveryQuery } from "@/lib/ai/discovery-query";
import { discoverDestinationCandidates, DISCOVERY_COVERAGE_THRESHOLD } from "@/lib/ai/discovery";

export const BUDGET_TIERS = ["budget", "mid_range", "luxury"] as const;
export type BudgetTier = (typeof BUDGET_TIERS)[number];

export const BUDGET_TIER_LABELS: Record<BudgetTier, string> = {
  budget: "Budget — hostels, konobas, ferries",
  mid_range: "Mid-range — boutique stays, good tables, the occasional splurge",
  luxury: "Premium — design hotels, private drivers, tasting menus",
};

export const INTEREST_OPTIONS = [
  "Hidden beaches & coves",
  "Wine & gastronomy",
  "History & old towns",
  "Hiking & nature",
  "Island hopping",
  "Local culture & traditions",
  "Photography",
  "Slow mornings & cafés",
] as const;

/** The three itineraries generated per submission (requirement #6) — same input, pace locked per variant. */
export const ROUTE_VARIANTS: RouteVariant[] = ["conservative", "balanced", "explorer"];

const VARIANT_PACE: Record<RouteVariant, TripPace> = {
  conservative: "relaxed",
  balanced: "balanced",
  explorer: "active",
};

/** Which of the 3 generated variants matches a given pace — used by the wizard to pick a default tab after generation. */
export function defaultVariantForPace(pace: TripPace): RouteVariant {
  return ROUTE_VARIANTS.find((variant) => VARIANT_PACE[variant] === pace) ?? "balanced";
}

export const plannerInputSchema = z.object({
  durationDays: z.number().int().min(2).max(21),
  month: z.string().min(1),
  budget: z.enum(BUDGET_TIERS),
  /** Null means "no preference" — the planner draws from the full curated region instead of one country. */
  country: z.enum(COUNTRIES as [Country, ...Country[]]).nullable(),
  pace: z.enum(["relaxed", "balanced", "active"] as [TripPace, ...TripPace[]]),
  plannerStyle: z.enum(Object.keys(PLANNER_STYLE_LABELS) as [PlannerStyle, ...PlannerStyle[]]),
  interests: z.array(z.string()).min(1).max(6),
  /** Free-text smart discovery request (requirement #7), e.g. "quiet alternatives to Dubrovnik". Optional — empty/absent means discovery only kicks in if curated coverage is thin. */
  discoveryQuery: z.string().max(200).optional(),
});
export type PlannerInput = z.infer<typeof plannerInputSchema>;

const itineraryDaySchema = z.object({
  day: z.number(),
  title: z.string(),
  summary: z.string(),
  morning: z.string(),
  afternoon: z.string(),
  evening: z.string(),
  food_highlight: z.string(),
});
export type ItineraryDay = z.infer<typeof itineraryDaySchema>;

const dayTripEntrySchema = z.object({
  day: z.number(),
  origin: z.string(),
  destination_name: z.string(),
  destination_slug: z.string(),
  drive_time: z.string(),
  why_go: z.string(),
  local_tip: z.string(),
});

const mapPointSchema = z.object({
  destination: z.string(),
  slug: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  day: z.number(),
  category: z.enum(Object.keys(DESTINATION_CATEGORY_LABELS) as [DestinationCategory, ...DestinationCategory[]]),
  is_day_trip: z.boolean(),
});

/** A single deterministic "why this stop" sentence — see requirement #5, built from lib/ai/grounding.ts's score breakdown. */
const selectionReasonSchema = z.object({
  destination_slug: z.string(),
  destination_name: z.string(),
  reason: z.string(),
});

/** Numeric route facts, kept separate from the prose overview so a future PDF/export can render them without re-deriving anything (requirement #8). */
const routeSummarySchema = z.object({
  stop_count: z.number(),
  day_trip_count: z.number(),
  total_distance_km: z.number(),
  average_distance_km: z.number(),
});

/** Layer B output (requirements #1-5) — a real place the AI is proposing, never scored or sequenced alongside curated stops. See lib/ai/discovery.ts. */
const destinationCandidateSchema = z.object({
  name: z.string(),
  region: z.string(),
  country: z.enum(COUNTRIES as [Country, ...Country[]]),
  latitude: z.number(),
  longitude: z.number(),
  source: z.enum(["curated", "ai_suggested"] as [DestinationSourceType, ...DestinationSourceType[]]),
  confidence_score: z.number(),
  verification_status: z.enum(["unverified", "structurally_checked", "rejected"] as [
    VerificationStatus,
    ...VerificationStatus[],
  ]),
  rationale: z.string(),
  matched_focus: z.array(z.enum(Object.keys(ITINERARY_FOCUS_LABELS) as [ItineraryFocus, ...ItineraryFocus[]])),
  /** Persistent editorial review state from the shared discovered_destinations registry (migration 0012) — see lib/data/discovered-destinations.ts. */
  moderation_status: z.enum(["pending", "approved", "rejected"] as [ModerationStatus, ...ModerationStatus[]]),
});

export const generatedItinerarySchema = z.object({
  trip_title: z.string(),
  /** Short, non-prose label of the trip's planner style + focus — e.g. "Food & Wine · Wine Journey". For PDF/export headers. */
  trip_theme: z.string(),
  overview: z.string(),
  days: z.array(itineraryDaySchema),
  hidden_gems: z.array(z.string()),
  restaurant_picks: z.array(z.string()),
  culture_notes: z.array(z.string()),
  packing_list: z.array(z.string()),
  /** Additive — populated by the deterministic grounding layer, never by AI. */
  focus: z.enum(Object.keys(ITINERARY_FOCUS_LABELS) as [ItineraryFocus, ...ItineraryFocus[]]),
  day_trips: z.array(dayTripEntrySchema),
  map_points: z.array(mapPointSchema),
  country: z.enum(COUNTRIES as [Country, ...Country[]]).nullable(),
  pace: z.enum(["relaxed", "balanced", "active"] as [TripPace, ...TripPace[]]),
  variant: z.enum(["conservative", "balanced", "explorer"] as [RouteVariant, ...RouteVariant[]]),
  selection_reasons: z.array(selectionReasonSchema),
  route_summary: routeSummarySchema,
  /** True when the curated pool for the requested country was too thin and the search widened beyond it. */
  widened_search: z.boolean(),
  /** Layer B — AI-suggested destinations, always shown separately from the curated stops above. Empty when discovery wasn't triggered or found nothing verifiable. */
  discovered_candidates: z.array(destinationCandidateSchema),
});
export type GeneratedItinerary = z.infer<typeof generatedItinerarySchema>;

export function isOpenAIConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

// --- Deterministic, grounded skeleton — facts only, no AI ---

const SUMMER_MONTHS = new Set(["June", "July", "August"]);
const WINTER_MONTHS = new Set(["December", "January", "February"]);

function buildPackingList(input: PlannerInput): string[] {
  const list = [
    "A reusable water bottle",
    "An EU plug adapter",
    "Comfortable walking shoes for cobblestones",
  ];
  if (SUMMER_MONTHS.has(input.month)) {
    list.push("Reef-safe sunscreen", "A swimsuit and a quick-dry towel", "A wide-brim hat");
  } else if (WINTER_MONTHS.has(input.month)) {
    list.push("A warm waterproof jacket", "Layers for sharp coastal wind", "Waterproof boots for wet cobblestones");
  } else {
    list.push("A light rain jacket", "A versatile layer for cool evenings");
  }
  if (input.budget === "luxury") list.push("A smart-casual outfit for boutique dinners");
  if (input.budget === "budget") list.push("A day pack for ferries, buses, and day trips");
  return list;
}

function buildCultureNotes(grounded: GroundedItinerary): string[] {
  const fromNotes = grounded.cultureNotes.map((note) => `${note.title}: ${note.excerpt}`);
  const fromStops = grounded.stops.map((stop) => `${stop.destination.name}: ${stop.destination.why_we_love_it}`);
  return [...fromNotes, ...fromStops];
}

function buildOverview(input: PlannerInput, focus: ItineraryFocus, grounded: GroundedItinerary): string {
  const stopNames = grounded.stops.map((stop) => stop.destination.name);
  const totalKm = grounded.legDistancesKm.reduce((sum, km) => sum + km, 0);
  const dayTripNote =
    grounded.dayTrips.length > 0
      ? ` Day trips to ${grounded.dayTrips.map((dt) => dt.destination.name).join(" and ")} are built in along the way.`
      : "";
  const widenedNote = grounded.widenedSearch
    ? ` Our curated list for that country alone is still growing, so this route draws on nearby destinations too.`
    : "";
  return `A ${input.durationDays}-day ${ITINERARY_FOCUS_LABELS[focus].toLowerCase()} through ${stopNames.join(
    ", "
  )}, sequenced to follow the real geography rather than backtrack — roughly ${totalKm} km between stops in total.${dayTripNote}${widenedNote}`;
}

function buildRouteSummary(grounded: GroundedItinerary): z.infer<typeof routeSummarySchema> {
  const totalKm = grounded.legDistancesKm.reduce((sum, km) => sum + km, 0);
  const averageKm = grounded.legDistancesKm.length > 0 ? Math.round(totalKm / grounded.legDistancesKm.length) : 0;
  return {
    stop_count: grounded.stops.length,
    day_trip_count: grounded.dayTrips.length,
    total_distance_km: totalKm,
    average_distance_km: averageKm,
  };
}

function buildTripTheme(input: PlannerInput, focus: ItineraryFocus): string {
  return `${PLANNER_STYLE_LABELS[input.plannerStyle]} · ${ITINERARY_FOCUS_LABELS[focus]}`;
}

function buildDaySkeletons(durationDays: number, grounded: GroundedItinerary): ItineraryDay[] {
  const dayTripsByDay = new Map<number, GroundedDayTrip>(grounded.dayTrips.map((dt) => [dt.day, dt]));
  const days: ItineraryDay[] = [];

  for (let day = 1; day <= durationDays; day++) {
    const stop = grounded.stops.find((s) => day >= s.dayStart && day <= s.dayEnd);
    if (!stop) continue;
    const { destination } = stop;
    const dayTrip = dayTripsByDay.get(day);
    const food = findFoodFindsForDestination(destination)[0];

    days.push({
      day,
      title: dayTrip ? `${destination.name} & a day trip to ${dayTrip.destination.name}` : destination.name,
      summary:
        day === stop.dayStart
          ? `Settle into ${destination.name}, ${destination.region}. ${destination.summary}`
          : `Another day based in ${destination.name} — ${destination.why_we_love_it}`,
      morning: `Start slow in ${destination.name}. ${destination.why_we_love_it}`,
      afternoon: dayTrip
        ? `Day trip to ${dayTrip.dayTrip.destination_name} — ${dayTrip.dayTrip.drive_time} from ${destination.name}. ${dayTrip.dayTrip.why_go}`
        : `Explore ${destination.name} at your own pace — best season here is ${destination.best_season}.`,
      evening: dayTrip
        ? dayTrip.dayTrip.local_tip
        : destination.sunset_score >= 8
          ? `Catch the sunset in ${destination.name} — it's one of the best spots in the region for it.`
          : `Settle in for dinner in ${destination.name}.`,
      food_highlight: food
        ? `${food.name} — ${food.story}`
        : `Local specialties around ${destination.name} — ask your konoba host what's fresh today.`,
    });
  }
  return days;
}

function buildSkeleton(
  input: PlannerInput,
  focus: ItineraryFocus,
  pace: TripPace,
  variant: RouteVariant,
  grounded: GroundedItinerary
): GeneratedItinerary {
  const stopNames = grounded.stops.map((stop) => stop.destination.name);
  return {
    trip_title: `${ITINERARY_FOCUS_LABELS[focus]}: ${stopNames.join(" → ")}`,
    trip_theme: buildTripTheme(input, focus),
    overview: buildOverview(input, focus, grounded),
    days: buildDaySkeletons(input.durationDays, grounded),
    hidden_gems: grounded.hiddenGems.map((d) => `${d.name} (${d.region}) — ${d.summary}`),
    restaurant_picks: grounded.foodFinds.map((f) => `${f.name} (${f.region}) — ${f.where_to_try}`),
    culture_notes: buildCultureNotes(grounded),
    packing_list: buildPackingList(input),
    focus,
    day_trips: grounded.dayTrips.map((dt) => ({
      day: dt.day,
      origin: dt.dayTrip.origin,
      destination_name: dt.dayTrip.destination_name,
      destination_slug: dt.dayTrip.destination_slug!,
      drive_time: dt.dayTrip.drive_time,
      why_go: dt.dayTrip.why_go,
      local_tip: dt.dayTrip.local_tip,
    })),
    map_points: grounded.mapPoints,
    country: input.country,
    pace,
    variant,
    selection_reasons: grounded.selectionReasons.map((r) => ({
      destination_slug: r.destinationSlug,
      destination_name: r.destinationName,
      reason: r.reason,
    })),
    route_summary: buildRouteSummary(grounded),
    widened_search: grounded.widenedSearch,
    discovered_candidates: [],
  };
}

// --- AI prose layer — narrative only, sandboxed to the grounded skeleton's facts ---

const PROSE_SYSTEM_PROMPT = `You are the Balkanish Planner's writing voice — warm, specific, a little poetic, like a well-travelled Balkan friend sharing recommendations over coffee. Never robotic, never generic travel-blog clichés ("hidden gem you must visit!", "breathtaking", "bucket list").

You will receive a JSON trip brief containing the ONLY real facts you may use: real destination names, regions, real day trips with real drive times, and real distances between stops. These facts are already finalized and verified. Do not rename them, do not add a destination, dish, distance, or fact that is not present in the brief, and do not invent specific restaurants or landmarks — keep those generic ("a konoba on the waterfront") unless the brief names something specific.

Your job is only to write the narrative prose around these fixed facts: a trip title, a short overview, and for each day a summary, morning, afternoon, and evening paragraph. If a day has a day_trip in the brief, that day's afternoon or evening text must mention it using the exact name and drive time given.

Respond with a single JSON object only, no markdown fences, no extra commentary, matching exactly:
{
  "trip_title": string,
  "overview": string,
  "days": [{ "day": number, "summary": string, "morning": string, "afternoon": string, "evening": string }]
}
The "days" array must have exactly one entry per day given in the brief, in the same day numbers, in order.`;

const proseSchema = z.object({
  trip_title: z.string(),
  overview: z.string(),
  days: z.array(
    z.object({
      day: z.number(),
      summary: z.string(),
      morning: z.string(),
      afternoon: z.string(),
      evening: z.string(),
    })
  ),
});

function buildGroundingBrief(input: PlannerInput, pace: TripPace, grounded: GroundedItinerary): string {
  const stops = grounded.stops.map((stop, idx) => {
    const dayTrip = grounded.dayTrips.find((dt) => dt.fromDestinationSlug === stop.destination.slug);
    return {
      days: `${stop.dayStart}-${stop.dayEnd}`,
      name: stop.destination.name,
      region: stop.destination.region,
      country: stop.destination.country,
      summary: stop.destination.summary,
      why_we_love_it: stop.destination.why_we_love_it,
      distance_from_previous_km: idx === 0 ? null : grounded.legDistancesKm[idx - 1],
      day_trip: dayTrip
        ? {
            on_day: dayTrip.day,
            to: dayTrip.destination.name,
            drive_time: dayTrip.dayTrip.drive_time,
            why_go: dayTrip.dayTrip.why_go,
          }
        : null,
    };
  });

  return JSON.stringify(
    {
      duration_days: input.durationDays,
      month: input.month,
      travel_style: PLANNER_STYLE_LABELS[input.plannerStyle],
      pace: TRIP_PACE_LABELS[pace],
      focus: ITINERARY_FOCUS_LABELS[grounded.focus],
      stops,
    },
    null,
    2
  );
}

async function fetchProse(brief: string, dayCount: number) {
  const openai = new OpenAI();
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    temperature: 0.7,
    messages: [
      { role: "system", content: PROSE_SYSTEM_PROMPT },
      { role: "user", content: brief },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) return null;

  const parsed = proseSchema.parse(JSON.parse(raw));
  if (parsed.days.length !== dayCount) return null;
  return parsed;
}

function applyProse(skeleton: GeneratedItinerary, prose: z.infer<typeof proseSchema>) {
  skeleton.trip_title = prose.trip_title;
  skeleton.overview = prose.overview;
  prose.days.forEach((day, idx) => {
    const target = skeleton.days[idx];
    if (!target) return;
    target.summary = day.summary;
    target.morning = day.morning;
    target.afternoon = day.afternoon;
    target.evening = day.evening;
  });
}

/**
 * Generates one itinerary. `variant` locks the pace used for selection/pacing (see VARIANT_PACE) —
 * input.pace is not read here; it's UI metadata generateItineraryVariants' caller uses to pick
 * which of the three variants to show by default, not a second, conflicting pace signal.
 */
export async function generateItinerary(input: PlannerInput, variant: RouteVariant = "balanced"): Promise<GeneratedItinerary> {
  const pace = VARIANT_PACE[variant];
  const focus = deriveItineraryFocus(input.plannerStyle, input.interests);
  const grounded = buildGroundedItinerary(input.plannerStyle, focus, input.country, input.durationDays, pace);
  const skeleton = buildSkeleton(input, focus, pace, variant, grounded);

  const parsedQuery = input.discoveryQuery?.trim() ? parseDiscoveryQuery(input.discoveryQuery) : null;
  // Layer B runs both when explicitly requested (a discovery query) and proactively when the
  // curated pool alone barely covers the request (requirement #1 — the two layers combine).
  const shouldDiscover = grounded.coverageScore < DISCOVERY_COVERAGE_THRESHOLD || parsedQuery !== null;

  const [prose, discoveredCandidates] = await Promise.all([
    isOpenAIConfigured()
      ? fetchProse(buildGroundingBrief(input, pace, grounded), skeleton.days.length).catch((error) => {
          console.error("AI prose layer failed; falling back to deterministic itinerary text.", error);
          return null;
        })
      : Promise.resolve(null),
    shouldDiscover
      ? discoverDestinationCandidates({
          plannerStyle: input.plannerStyle,
          focus,
          country: input.country,
          query: parsedQuery,
          existingStopNames: grounded.stops.map((stop) => stop.destination.name),
        })
      : Promise.resolve([]),
  ]);

  if (prose) applyProse(skeleton, prose);
  skeleton.discovered_candidates = discoveredCandidates;

  return generatedItinerarySchema.parse(skeleton);
}

/** Requirement #6 — Conservative/Balanced/Explorer, generated from the same input, pace fixed per variant. */
export async function generateItineraryVariants(
  input: PlannerInput
): Promise<Record<RouteVariant, GeneratedItinerary>> {
  const results = await Promise.all(ROUTE_VARIANTS.map((variant) => generateItinerary(input, variant)));
  return {
    conservative: results[0],
    balanced: results[1],
    explorer: results[2],
  };
}

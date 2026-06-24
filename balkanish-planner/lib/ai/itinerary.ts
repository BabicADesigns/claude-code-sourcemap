import OpenAI from "openai";
import { z } from "zod";
import {
  TRAVEL_STYLE_LABELS,
  ITINERARY_FOCUS_LABELS,
  DESTINATION_CATEGORY_LABELS,
  type TravelStyle,
  type ItineraryFocus,
  type DestinationCategory,
} from "@/lib/types";
import {
  deriveItineraryFocus,
  buildGroundedItinerary,
  findFoodFindsForDestination,
  type GroundedItinerary,
  type GroundedDayTrip,
} from "@/lib/ai/grounding";

export const BUDGET_TIERS = ["budget", "mid_range", "luxury"] as const;
export type BudgetTier = (typeof BUDGET_TIERS)[number];

export const BUDGET_TIER_LABELS: Record<BudgetTier, string> = {
  budget: "Budget-conscious — hostels, konobas, ferries",
  mid_range: "Mid-range — boutique stays, good tables, the occasional splurge",
  luxury: "Treat yourself — design hotels, private drivers, tasting menus",
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

export const plannerInputSchema = z.object({
  durationDays: z.number().int().min(2).max(21),
  month: z.string().min(1),
  budget: z.enum(BUDGET_TIERS),
  travelStyle: z.enum(Object.keys(TRAVEL_STYLE_LABELS) as [TravelStyle, ...TravelStyle[]]),
  interests: z.array(z.string()).min(1).max(6),
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

export const generatedItinerarySchema = z.object({
  trip_title: z.string(),
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
  return `A ${input.durationDays}-day ${ITINERARY_FOCUS_LABELS[focus].toLowerCase()} through ${stopNames.join(
    ", "
  )}, sequenced to follow the real geography rather than backtrack — roughly ${totalKm} km between stops in total.${dayTripNote}`;
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

function buildSkeleton(input: PlannerInput, focus: ItineraryFocus, grounded: GroundedItinerary): GeneratedItinerary {
  const stopNames = grounded.stops.map((stop) => stop.destination.name);
  return {
    trip_title: `${ITINERARY_FOCUS_LABELS[focus]}: ${stopNames.join(" → ")}`,
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

function buildGroundingBrief(input: PlannerInput, grounded: GroundedItinerary): string {
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
      travel_style: TRAVEL_STYLE_LABELS[input.travelStyle],
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

export async function generateItinerary(input: PlannerInput): Promise<GeneratedItinerary> {
  const focus = deriveItineraryFocus(input.travelStyle, input.interests);
  const grounded = buildGroundedItinerary(focus, input.durationDays);
  const skeleton = buildSkeleton(input, focus, grounded);

  if (isOpenAIConfigured()) {
    try {
      const brief = buildGroundingBrief(input, grounded);
      const prose = await fetchProse(brief, skeleton.days.length);
      if (prose) applyProse(skeleton, prose);
    } catch (error) {
      console.error("AI prose layer failed; falling back to deterministic itinerary text.", error);
    }
  }

  return generatedItinerarySchema.parse(skeleton);
}

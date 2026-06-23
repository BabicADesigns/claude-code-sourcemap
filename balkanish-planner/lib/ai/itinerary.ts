import OpenAI from "openai";
import { z } from "zod";
import { TRAVEL_STYLE_LABELS, type TravelStyle } from "@/lib/types";

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

export const generatedItinerarySchema = z.object({
  trip_title: z.string(),
  overview: z.string(),
  days: z.array(itineraryDaySchema),
  hidden_gems: z.array(z.string()),
  restaurant_picks: z.array(z.string()),
  culture_notes: z.array(z.string()),
  packing_list: z.array(z.string()),
});
export type GeneratedItinerary = z.infer<typeof generatedItinerarySchema>;

const SYSTEM_PROMPT = `You are the Balkanish Planner, the AI travel-planning voice of Balkanish — a Croatia and Western Balkans travel guide for people who want the version locals actually live, not the cruise-ship version.

Voice: warm, intelligent, a little poetic, like a well-travelled Balkan friend sharing recommendations over coffee. Never robotic, never salesy, never generic travel-blog clichés ("hidden gem you must visit!", "breathtaking", "bucket list").

Always favor specific, real, lesser-known places over famous tourist traps. Mention actual town names, neighborhoods, and types of food — be concrete, not vague.

Respond with a single JSON object only, matching this exact shape, with no markdown fences and no extra commentary:
{
  "trip_title": string,
  "overview": string (2-3 sentences, the trip's character),
  "days": [
    { "day": number, "title": string, "summary": string, "morning": string, "afternoon": string, "evening": string, "food_highlight": string }
  ],
  "hidden_gems": string[] (3-5 specific places),
  "restaurant_picks": string[] (3-5 specific places or dishes),
  "culture_notes": string[] (2-3 short cultural notes relevant to the trip),
  "packing_list": string[] (5-8 items)
}
The "days" array must have exactly as many entries as the requested trip duration.`;

function buildUserPrompt(input: PlannerInput) {
  return `Plan a ${input.durationDays}-day Balkans trip in ${input.month}.
Budget: ${BUDGET_TIER_LABELS[input.budget]}.
Travel style: ${TRAVEL_STYLE_LABELS[input.travelStyle]}.
Interests: ${input.interests.join(", ")}.`;
}

export async function generateItinerary(input: PlannerInput): Promise<GeneratedItinerary> {
  const openai = new OpenAI();

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    temperature: 0.8,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(input) },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("OpenAI returned an empty itinerary.");

  return generatedItinerarySchema.parse(JSON.parse(raw));
}
